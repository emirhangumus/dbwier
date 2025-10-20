// src/parseSQL.ts
import type { SchemaGraph, Table, Column, ForeignKey } from "./types";

const trimQ = (s: string) => s.replace(/^"+|"+$/g, '');

function normalizeIdent(raw: string) {
    // supports writer_schema.table or "writer_schema"."table"
    const parts = raw
        .replace(/\s+/g, '')
        .replace(/`/g, '"')
        .split('.');
    if (parts.length === 2) {
        return { schema: trimQ(parts[0]), table: trimQ(parts[1]) };
    }
    return { schema: null as string | null, table: trimQ(parts[0]) };
}

function collectCreateTableBlocks(sql: string) {
    // naive but robust enough: find "CREATE TABLE [IF NOT EXISTS] <ident> ( ... );"
    const blocks: { header: string; body: string }[] = [];
    const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\s\S]+?)\(([\s\S]*?)\);/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
        blocks.push({ header: m[1].trim(), body: m[2].trim() });
    }
    return blocks;
}

function parseColumns(body: string): { columns: Column[]; pk: string[] } {
    // Better parsing: track parentheses depth to handle multi-line constraints
    const items: string[] = [];
    let buf = '';
    let depth = 0;

    for (let i = 0; i < body.length; i++) {
        const char = body[i];

        if (char === '(') depth++;
        if (char === ')') depth--;

        buf += char;

        // Split on comma only at depth 0 (not inside parentheses)
        if (char === ',' && depth === 0) {
            items.push(buf.slice(0, -1).trim());
            buf = '';
        }
    }
    if (buf.trim()) items.push(buf.trim());

    const columns: Column[] = [];
    const pk: string[] = [];

    for (const it of items) {
        // Skip table-level CONSTRAINT declarations
        if (/^CONSTRAINT\s+/i.test(it)) {
            // Check if it's a PRIMARY KEY constraint
            const pkTable = it.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (pkTable) {
                pk.push(
                    ...pkTable[1]
                        .split(',')
                        .map(s => trimQ(s.trim()))
                );
            }
            continue;
        }

        // Skip standalone PRIMARY KEY constraint (table-level without CONSTRAINT keyword)
        const pkTable = it.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkTable) {
            pk.push(
                ...pkTable[1]
                    .split(',')
                    .map(s => trimQ(s.trim()))
            );
            continue;
        }

        // Skip CHECK constraints that aren't part of a column definition
        if (/^CHECK\s*\(/i.test(it)) {
            continue;
        }

        // Skip UNIQUE constraints at table level (with multiple columns)
        if (/^UNIQUE\s*\(/i.test(it)) {
            continue;
        }

        // Skip FOREIGN KEY constraints at table level
        if (/^FOREIGN\s+KEY\s*\(/i.test(it)) {
            continue;
        }

        // column line starts with identifier or quoted identifier
        const colMatch = it.match(/^"?([a-zA-Z0-9_]+)"?\s+([^,\s]+(?:\s*\([^)]+\))?)/);
        if (colMatch) {
            const name = trimQ(colMatch[1]);
            const type = colMatch[2].trim();

            const notNull = /\bNOT\s+NULL\b/i.test(it);
            const nullable = !notNull;
            const unique = /\bUNIQUE\b/i.test(it);

            // Extract default value - be more careful to avoid grabbing CHECK constraints
            const defaultMatch = it.match(/DEFAULT\s+([^,\s]+(?:\s*\([^)]*\))?)/i);
            const defaultValue = defaultMatch ? defaultMatch[1].trim() : undefined;

            const col: Column = { name, type, nullable, notNull, unique, defaultValue };

            // inline primary key?
            if (/\bPRIMARY\s+KEY\b/i.test(it)) col.pk = true;

            columns.push(col);
        }
    }
    return { columns, pk };
}

function parseAlterFKs(sql: string): ForeignKey[] {
    // ALTER TABLE <ident> ADD CONSTRAINT <name> FOREIGN KEY (col) REFERENCES <ident> (col) [ON DELETE ...] [ON UPDATE ...]
    // This handles both single and multiple ADD CONSTRAINT in one ALTER TABLE statement
    const fks: ForeignKey[] = [];

    // First, find all ALTER TABLE blocks
    const alterTableRe = /ALTER\s+TABLE\s+([\w."]+)\s+([\s\S]*?)(?=;)/gi;
    let alterMatch: RegExpExecArray | null;

    while ((alterMatch = alterTableRe.exec(sql)) !== null) {
        const tableName = alterMatch[1].trim();
        const alterBody = alterMatch[2];

        const from = normalizeIdent(tableName);

        // Now find all ADD CONSTRAINT ... FOREIGN KEY within this ALTER TABLE
        const constraintRe = /ADD\s+CONSTRAINT\s+([\w."]+)\s+FOREIGN\s+KEY\s*\(([\s\S]*?)\)\s+REFERENCES\s+([\w."]+)\s*\(([\s\S]*?)\)((?:\s+ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*)/gi;
        let constMatch: RegExpExecArray | null;

        while ((constMatch = constraintRe.exec(alterBody)) !== null) {
            const name = trimQ(constMatch[1].trim());
            const fromCols = constMatch[2]
                .split(',')
                .map(s => trimQ(s.trim()));
            const toIdent = normalizeIdent(constMatch[3].trim());
            const toCols = constMatch[4]
                .split(',')
                .map(s => trimQ(s.trim()));
            const options = constMatch[5] || '';

            // Extract ON DELETE and ON UPDATE
            const onDeleteMatch = options.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);
            const onUpdateMatch = options.match(/ON\s+UPDATE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);

            // zip pairs (most schemas are 1:1)
            for (let i = 0; i < Math.min(fromCols.length, toCols.length); i++) {
                fks.push({
                    name,
                    fromTable: from.schema ? `${from.schema}.${from.table}` : from.table,
                    fromColumn: fromCols[i],
                    toTable: toIdent.schema ? `${toIdent.schema}.${toIdent.table}` : toIdent.table,
                    toColumn: toCols[i],
                    onDelete: onDeleteMatch ? onDeleteMatch[1].toUpperCase() : undefined,
                    onUpdate: onUpdateMatch ? onUpdateMatch[1].toUpperCase() : undefined,
                });
            }
        }
    }
    return fks;
}

export function parsePostgresSchema(sql: string): SchemaGraph {
    const tables: Table[] = [];
    const creates = collectCreateTableBlocks(sql);

    for (const { header, body } of creates) {
        // header ends with the identifier; remove trailing stuff like "USING ..." (rare here)
        // Examples: writer_schema.sites  |  "writer_schema"."view_nodes"
        const hdrMatch = header.match(/("?[\w.]+"?)/);
        if (!hdrMatch) continue;
        const ident = normalizeIdent(hdrMatch[1]);
        const { columns, pk } = parseColumns(body);

        // mark pk flags on columns
        if (pk.length) {
            for (const c of columns) {
                if (pk.includes(c.name)) c.pk = true;
            }
        }

        tables.push({
            name: ident.schema ? `${ident.schema}.${ident.table}` : ident.table,
            schema: ident.schema,
            columns,
            pk,
        });
    }

    const fks = parseAlterFKs(sql);

    // also try to capture inline REFERENCES inside CREATE TABLE body
    const inlineRefRe =
        /"?([a-zA-Z0-9_]+)"?\s+[^,]*?\bREFERENCES\b\s+(["\w.]+)\s*\(\s*"?([a-zA-Z0-9_]+)"?\s*\)/gi;
    for (const { header, body } of creates) {
        const hdrMatch = header.match(/("?[\w.]+"?)/);
        if (!hdrMatch) continue;
        const from = normalizeIdent(hdrMatch[1]);
        let m: RegExpExecArray | null;
        while ((m = inlineRefRe.exec(body)) !== null) {
            const to = normalizeIdent(m[2]);
            fks.push({
                fromTable: from.schema ? `${from.schema}.${from.table}` : from.table,
                fromColumn: trimQ(m[1]),
                toTable: to.schema ? `${to.schema}.${to.table}` : to.table,
                toColumn: trimQ(m[3]),
            });
        }
    }

    return { tables, fks };
}

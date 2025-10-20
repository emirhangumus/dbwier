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
    // split by lines/commas but keep constraint lines intact
    const rawLines = body
        .split(/\n/)
        .map(l => l.trim())
        .filter(Boolean);

    const items: string[] = [];
    let buf = '';
    for (const line of rawLines) {
        buf += (buf ? ' ' : '') + line;
        if (/,(\s*--.*)?$/.test(line) || /\)$/.test(line)) {
            // end of definition likely marked by comma or closing constraint
            items.push(buf.replace(/,+$/, '').trim());
            buf = '';
        }
    }
    if (buf) items.push(buf);

    const columns: Column[] = [];
    const pk: string[] = [];

    for (const it of items) {
        // PRIMARY KEY constraint (table-level)
        const pkTable = it.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkTable) {
            pk.push(
                ...pkTable[1]
                    .split(',')
                    .map(s => trimQ(s.trim()))
            );
            continue;
        }

        // column line starts with identifier
        const colMatch = it.match(/^"?([a-zA-Z0-9_]+)"?\s+([^,\s]+(?:\s*\([^)]+\))?)/);
        if (colMatch) {
            const name = trimQ(colMatch[1]);
            const type = colMatch[2].trim();

            const nullable = !/\bNOT\s+NULL\b/i.test(it);
            const col: Column = { name, type, nullable };

            // inline primary key?
            if (/\bPRIMARY\s+KEY\b/i.test(it)) col.pk = true;

            columns.push(col);
        }
    }
    return { columns, pk };
}

function parseAlterFKs(sql: string): ForeignKey[] {
    // ALTER TABLE <ident> ADD CONSTRAINT <name> FOREIGN KEY (col) REFERENCES <ident> (col)
    const fks: ForeignKey[] = [];
    const re =
        /ALTER\s+TABLE\s+([\s\S]*?)\s+ADD\s+CONSTRAINT\s+([\s\S]*?)\s+FOREIGN\s+KEY\s*\(([\s\S]*?)\)\s+REFERENCES\s+([\s\S]*?)\s*\(([\s\S]*?)\)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
        const from = normalizeIdent(m[1].trim());
        const name = trimQ(m[2].trim());
        const fromCols = m[3]
            .split(',')
            .map(s => trimQ(s.trim()));
        const toIdent = normalizeIdent(m[4].trim());
        const toCols = m[5]
            .split(',')
            .map(s => trimQ(s.trim()));

        // zip pairs (most schemas are 1:1)
        for (let i = 0; i < Math.min(fromCols.length, toCols.length); i++) {
            fks.push({
                name,
                fromTable: from.schema ? `${from.schema}.${from.table}` : from.table,
                fromColumn: fromCols[i],
                toTable: toIdent.schema ? `${toIdent.schema}.${toIdent.table}` : toIdent.table,
                toColumn: toCols[i],
            });
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

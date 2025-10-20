export type Column = {
    name: string;
    type: string;
    pk?: boolean;
    nullable?: boolean; // best-effort
};

export type ForeignKey = {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    name?: string;
};

export type Table = {
    name: string;           // schema.table or just table
    schema?: string | null; // writer_schema
    columns: Column[];
    pk?: string[];          // primary key column names
};

export type SchemaGraph = {
    tables: Table[];
    fks: ForeignKey[];
};

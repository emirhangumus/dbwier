export type Column = {
    name: string;
    type: string;
    pk?: boolean;
    nullable?: boolean;
    notNull?: boolean;
    unique?: boolean;
    defaultValue?: string;
    comment?: string;
};

export type ForeignKey = {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    name?: string;
    onDelete?: string;
    onUpdate?: string;
};

export type Table = {
    name: string;           // schema.table or just table
    schema?: string | null; // writer_schema
    columns: Column[];
    pk?: string[];          // primary key column names
    indexes?: string[];     // index names
    comment?: string;
};

export type SchemaGraph = {
    tables: Table[];
    fks: ForeignKey[];
};

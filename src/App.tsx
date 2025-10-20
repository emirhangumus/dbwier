// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Code2, Download, Upload, Share2, Image, FileText, RotateCcw } from "lucide-react";
import SchemaFlow from "./components/SchemaFlow";
import SearchFilter from "./components/SearchFilter";
import { parsePostgresSchema } from "./lib/parseSQL";
import { shareViaURL, loadFromURL, exportAsPNG, exportAsSVG } from "./lib/exportUtils";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";

const EXAMPLE = `-- paste your SQL here
${`CREATE SCHEMA IF NOT EXISTS writer_schema;

CREATE TABLE IF NOT EXISTS writer_schema.sites (
    id bigint PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text,
    live_release_id bigint
);

CREATE TABLE IF NOT EXISTS writer_schema.site_releases (
    id bigint PRIMARY KEY,
    site_id bigint NOT NULL
);

ALTER TABLE writer_schema.sites
ADD CONSTRAINT fk_sites_live_release FOREIGN KEY (live_release_id) REFERENCES writer_schema.site_releases (id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS writer_schema.views (
    id bigint PRIMARY KEY,
    site_id bigint NOT NULL,
    path text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE writer_schema.views
ADD CONSTRAINT views_site_id_fkey FOREIGN KEY (site_id) REFERENCES writer_schema.sites (id) ON DELETE CASCADE;
`}`;

export default function App() {
  const [sql, setSql] = useState(() => {
    // Try to load from URL first, then localStorage, then EXAMPLE
    const urlSchema = loadFromURL();
    if (urlSchema) return urlSchema;

    try {
      const saved = localStorage.getItem("sql");
      return saved || EXAMPLE;
    } catch {
      return EXAMPLE;
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const graph = useMemo(() => parsePostgresSchema(sql), [sql]);

  // store in localStorage for convenience
  useEffect(() => {
    try { localStorage.setItem("sql", sql); } catch { }
  }, [sql]);

  const exportSchema = () => {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSchema = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sql,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setSql(content);
          setIsOpen(false);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const resetToExample = () => {
    setSql(EXAMPLE);
    localStorage.removeItem("sql");
  };

  const handleShare = async () => {
    const shareUrl = shareViaURL(sql);
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch {
      prompt('Share this URL:', shareUrl);
    }
  };

  const handleExportPNG = () => {
    exportAsPNG(reactFlowInstance, 'schema.png');
  };

  const handleExportSVG = () => {
    exportAsSVG(reactFlowInstance, 'schema.svg');
  };

  // Calculate total columns
  const totalColumns = graph.tables.reduce((sum, table) => sum + table.columns.length, 0);

  // Get selected table details
  const tableDetails = useMemo(() => {
    if (!selectedTable) return null;
    return graph.tables.find(t => t.name === selectedTable);
  }, [selectedTable, graph.tables]);

  // Get foreign keys for selected table
  const tableForeignKeys = useMemo(() => {
    if (!selectedTable) return { outgoing: [], incoming: [] };

    const outgoing = graph.fks.filter(fk => fk.fromTable === selectedTable);
    const incoming = graph.fks.filter(fk => fk.toTable === selectedTable);

    return { outgoing, incoming };
  }, [selectedTable, graph.fks]);

  const handleNodeDoubleClick = (tableName: string) => {
    setSelectedTable(tableName);
    setIsDetailsOpen(true);
  };

  return (
    <div className="relative h-screen w-screen bg-zinc-950">
      {/* Fullscreen ReactFlow */}
      <div className="absolute inset-0">
        <SchemaFlow
          graph={graph}
          searchQuery={searchQuery}
          onInit={setReactFlowInstance}
          onNodeDoubleClick={handleNodeDoubleClick}
        />
      </div>

      {/* Top Bar with Search */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 items-center pointer-events-none">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="default" size="default" className="shadow-lg shrink-0 pointer-events-auto">
              <Code2 className="size-4" />
              Edit SQL
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
            <SheetHeader>
              <SheetTitle className="text-zinc-100">PostgreSQL Schema Editor</SheetTitle>
              <SheetDescription className="text-zinc-400">
                Paste your CREATE TABLE and ALTER TABLE statements to visualize your schema.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 px-4">
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className="w-full h-[calc(100vh-340px)] bg-zinc-950 border border-zinc-700 rounded-lg p-4 font-mono text-xs leading-5 outline-none focus:border-indigo-500 text-zinc-100 resize-none"
                spellCheck={false}
                placeholder="Paste your SQL schema here..."
              />
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={importSchema} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <Upload className="size-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={exportSchema} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <Download className="size-4" />
                  Export SQL
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPNG} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <Image className="size-4" />
                  PNG
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSVG} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <FileText className="size-4" />
                  SVG
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <Share2 className="size-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={resetToExample} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800 ml-auto">
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Box */}
        <div className="flex-1 max-w-md pointer-events-auto">
          <SearchFilter
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-lg backdrop-blur-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-zinc-100">Schema Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-1.5 text-xs text-zinc-400">
            <div className="flex justify-between gap-6">
              <span>Tables:</span>
              <span className="font-semibold text-zinc-100">{graph.tables.length}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Columns:</span>
              <span className="font-semibold text-zinc-100">{totalColumns}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Foreign Keys:</span>
              <span className="font-semibold text-zinc-100">{graph.fks.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-lg backdrop-blur-sm">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-zinc-100">Legend</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-1 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded" />
              <span>Primary Key</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded" />
              <span>Unique</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span>NOT NULL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-indigo-500" />
              <span>Foreign Key</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
          <SheetHeader>
            <SheetTitle className="text-zinc-100 font-mono text-lg">
              {tableDetails?.name || "Table Details"}
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              Complete table information including columns, constraints, and relationships.
            </SheetDescription>
          </SheetHeader>

          {tableDetails && (
            <div className="mt-6 space-y-6 px-4">
              {/* Columns Section */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-indigo-500 rounded" />
                  Columns ({tableDetails.columns.length})
                </h3>
                <div className="space-y-2">
                  {tableDetails.columns.map((col) => (
                    <div
                      key={col.name}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-zinc-100">{col.name}</span>
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                            {col.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {col.pk && (
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                            PRIMARY KEY
                          </span>
                        )}
                        {col.unique && (
                          <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                            UNIQUE
                          </span>
                        )}
                        {col.notNull && (
                          <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                            NOT NULL
                          </span>
                        )}
                        {col.defaultValue && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                            DEFAULT: {col.defaultValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outgoing Foreign Keys */}
              {tableForeignKeys.outgoing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded" />
                    Outgoing References ({tableForeignKeys.outgoing.length})
                  </h3>
                  <div className="space-y-2">
                    {tableForeignKeys.outgoing.map((fk, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1"
                      >
                        <div className="font-mono text-sm text-zinc-100">
                          {fk.name && <div className="text-xs text-zinc-500 mb-1">{fk.name}</div>}
                          <div>
                            <span className="text-indigo-400">{fk.fromColumn}</span>
                            <span className="text-zinc-500 mx-2">→</span>
                            <span className="text-green-400">{fk.toTable}</span>
                            <span className="text-zinc-500">.</span>
                            <span className="text-indigo-400">{fk.toColumn}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {fk.onDelete && (
                            <span className="text-zinc-400">
                              ON DELETE: <span className="text-orange-400">{fk.onDelete}</span>
                            </span>
                          )}
                          {fk.onUpdate && (
                            <span className="text-zinc-400">
                              ON UPDATE: <span className="text-purple-400">{fk.onUpdate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Foreign Keys */}
              {tableForeignKeys.incoming.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded" />
                    Referenced By ({tableForeignKeys.incoming.length})
                  </h3>
                  <div className="space-y-2">
                    {tableForeignKeys.incoming.map((fk, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1"
                      >
                        <div className="font-mono text-sm text-zinc-100">
                          {fk.name && <div className="text-xs text-zinc-500 mb-1">{fk.name}</div>}
                          <div>
                            <span className="text-purple-400">{fk.fromTable}</span>
                            <span className="text-zinc-500">.</span>
                            <span className="text-indigo-400">{fk.fromColumn}</span>
                            <span className="text-zinc-500 mx-2">→</span>
                            <span className="text-indigo-400">{fk.toColumn}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {fk.onDelete && (
                            <span className="text-zinc-400">
                              ON DELETE: <span className="text-orange-400">{fk.onDelete}</span>
                            </span>
                          )}
                          {fk.onUpdate && (
                            <span className="text-zinc-400">
                              ON UPDATE: <span className="text-purple-400">{fk.onUpdate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-zinc-400">Total Columns</div>
                    <div className="text-xl font-semibold text-zinc-100">{tableDetails.columns.length}</div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Primary Keys</div>
                    <div className="text-xl font-semibold text-yellow-400">
                      {tableDetails.columns.filter(c => c.pk).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Unique Constraints</div>
                    <div className="text-xl font-semibold text-cyan-400">
                      {tableDetails.columns.filter(c => c.unique).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400">NOT NULL</div>
                    <div className="text-xl font-semibold text-red-400">
                      {tableDetails.columns.filter(c => c.notNull).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Outgoing FKs</div>
                    <div className="text-xl font-semibold text-green-400">
                      {tableForeignKeys.outgoing.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Incoming FKs</div>
                    <div className="text-xl font-semibold text-purple-400">
                      {tableForeignKeys.incoming.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

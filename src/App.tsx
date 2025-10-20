// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Code2, Download, Upload } from "lucide-react";
import SchemaFlow from "./components/SchemaFlow";
import { parsePostgresSchema } from "./lib/parseSQL";
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
    code text NOT NULL,
    name text,
    live_release_id bigint
);

CREATE TABLE IF NOT EXISTS writer_schema.site_releases (
    id bigint PRIMARY KEY,
    site_id bigint NOT NULL
);

ALTER TABLE writer_schema.sites
ADD CONSTRAINT fk_sites_live_release FOREIGN KEY (live_release_id) REFERENCES writer_schema.site_releases (id);

CREATE TABLE IF NOT EXISTS writer_schema.views (
    id bigint PRIMARY KEY,
    site_id bigint NOT NULL,
    path text NOT NULL
);

ALTER TABLE writer_schema.views
ADD CONSTRAINT views_site_id_fkey FOREIGN KEY (site_id) REFERENCES writer_schema.sites (id) ON DELETE CASCADE;
`}`;

export default function App() {
  const [sql, setSql] = useState(() => {
    // Try to load from localStorage first, fallback to EXAMPLE
    try {
      const saved = localStorage.getItem("sql");
      return saved || EXAMPLE;
    } catch {
      return EXAMPLE;
    }
  });
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative h-screen w-screen bg-zinc-950">
      {/* Fullscreen ReactFlow */}
      <div className="absolute inset-0">
        <SchemaFlow graph={graph} />
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="default" size="default" className="shadow-lg">
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
            <div className="mt-6 space-y-4">
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className="w-full h-[calc(100vh-280px)] bg-zinc-950 border border-zinc-700 rounded-lg p-4 font-mono text-xs leading-5 outline-none focus:border-indigo-500 text-zinc-100 resize-none"
                spellCheck={false}
                placeholder="Paste your SQL schema here..."
              />
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={importSchema} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <Upload className="size-4" />
                  Import SQL
                </Button>
                <Button variant="outline" size="sm" onClick={exportSchema} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                  <Download className="size-4" />
                  Export SQL
                </Button>
                <Button variant="outline" size="sm" onClick={resetToExample} className="border-zinc-700 text-zinc-100 hover:bg-zinc-800 ml-auto">
                  Reset to Example
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Info Card */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-lg backdrop-blur-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-zinc-100">Schema Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1 text-xs text-zinc-400">
            <div className="flex justify-between gap-4">
              <span>Tables:</span>
              <span className="font-semibold text-zinc-100">{graph.tables.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Foreign Keys:</span>
              <span className="font-semibold text-zinc-100">{graph.fks.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

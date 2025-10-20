// src/TableNode.tsx
import { Handle, Position, type NodeProps } from "reactflow";
import { Key, Hash } from "lucide-react";

type Data = {
    title: string;
    columns: { name: string; type: string; pk?: boolean; nullable?: boolean }[];
};

export default function TableNode({ data, selected }: NodeProps<Data>) {
    return (
        <div
            className={`rounded-lg border-2 ${selected ? "border-indigo-400 shadow-lg shadow-indigo-500/20" : "border-zinc-700/50"} bg-zinc-900/95 backdrop-blur-sm text-zinc-100 shadow-xl min-w-[240px] overflow-hidden`}
        >
            {/* Table Header */}
            <div className="px-3 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-sm font-semibold text-zinc-100">{data.title}</span>
            </div>

            {/* Columns List */}
            <div className="max-h-72 overflow-auto">
                {data.columns.map((c, index) => (
                    <div
                        key={`${data.title}-${c.name}-${index}`}
                        className="px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30 last:border-b-0"
                    >
                        {/* Icon for PK */}
                        {c.pk ? (
                            <Key className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        ) : (
                            <Hash className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        )}

                        {/* Column Name */}
                        <span className={`text-xs font-medium flex-1 ${c.pk ? 'text-zinc-100' : 'text-zinc-300'}`}>
                            {c.name}
                        </span>

                        {/* Type */}
                        <span className="text-[10px] text-zinc-500 font-mono">
                            {c.type}
                        </span>
                    </div>
                ))}
            </div>

            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-indigo-500! border-2! border-zinc-900!"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-indigo-500! border-2! border-zinc-900!"
            />
        </div>
    );
}

// src/TableNode.tsx
import { Handle, Position, type NodeProps } from "reactflow";
import { Key, Hash } from "lucide-react";

type Data = {
    title: string;
    columns: {
        name: string;
        type: string;
        pk?: boolean;
        nullable?: boolean;
        hasSourceHandle?: boolean;
        hasTargetHandle?: boolean;
    }[];
};

export default function TableNode({ data, selected }: NodeProps<Data>) {
    return (
        <div
            className={`rounded-lg border-2 ${selected ? "border-indigo-400 shadow-lg shadow-indigo-500/20" : "border-zinc-700/50"} bg-zinc-900/95 backdrop-blur-sm text-zinc-100 shadow-xl w-[240px]`}
        >
            {/* Table Header */}
            <div className="px-3 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-sm font-semibold text-zinc-100 flex-1 truncate" title={data.title}>
                    {data.title}
                </span>
                <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {data.columns.length}
                </span>
            </div>

            {/* Columns List - No scrolling, shows all columns */}
            <div>
                {data.columns.map((c, index) => (
                    <div
                        key={`${data.title}-${c.name}-${index}`}
                        className="relative px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30 last:border-b-0"
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

                        {/* Connection handles for each column - only show if connected */}
                        {c.hasTargetHandle && (
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={`${c.name}-target`}
                                className="w-2! h-2! bg-indigo-500! border-2! border-zinc-900! -left-[5px]!"
                                style={{ top: '50%', transform: 'translateY(-50%)' }}
                            />
                        )}
                        {c.hasSourceHandle && (
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`${c.name}-source`}
                                className="w-2! h-2! bg-indigo-500! border-2! border-zinc-900! -right-[5px]!"
                                style={{ top: '50%', transform: 'translateY(-50%)' }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

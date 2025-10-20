// src/SchemaFlow.tsx
import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, LayoutGrid } from "lucide-react";
import TableNode from "./TableNode";
import type { SchemaGraph } from "@/lib/types";
import { layout } from "@/lib/autoLayout";
import { Button } from "./ui/button";

const nodeTypes = { table: TableNode };

export default function SchemaFlow({ graph }: { graph: SchemaGraph }) {
    const initialNodesEdges = useMemo(() => {
        // First, calculate which columns have connections
        const columnConnections = new Map<string, Set<string>>();

        graph.fks.forEach((fk) => {
            // Track source columns
            const sourceKey = `${fk.fromTable}.${fk.fromColumn}`;
            if (!columnConnections.has(sourceKey)) {
                columnConnections.set(sourceKey, new Set());
            }
            columnConnections.get(sourceKey)!.add('source');

            // Track target columns
            const targetKey = `${fk.toTable}.${fk.toColumn}`;
            if (!columnConnections.has(targetKey)) {
                columnConnections.set(targetKey, new Set());
            }
            columnConnections.get(targetKey)!.add('target');
        });

        const nodes: Node[] = graph.tables.map((t) => {
            // Add connection info for each column
            const columnsWithConnections = t.columns.map(col => {
                const colKey = `${t.name}.${col.name}`;
                const connections = columnConnections.get(colKey);
                return {
                    ...col,
                    hasSourceHandle: connections?.has('source') || false,
                    hasTargetHandle: connections?.has('target') || false,
                };
            });

            return {
                id: t.name,
                type: "table",
                data: { title: t.name, columns: columnsWithConnections },
                position: { x: 0, y: 0 },
            };
        });

        const edges: Edge[] = graph.fks.map((f, i) => ({
            id: `fk-${f.fromTable}-${f.fromColumn}-${f.toTable}-${f.toColumn}-${i}`,
            source: f.fromTable,
            sourceHandle: `${f.fromColumn}-source`,
            target: f.toTable,
            targetHandle: `${f.toColumn}-target`,
            label: f.name || `${f.fromColumn} → ${f.toColumn}`,
            animated: false,
            type: 'smoothstep',
            style: {
                strokeWidth: 1.5,
                stroke: '#6366f1',
            },
            labelStyle: {
                fill: '#d4d4d8',
                fontSize: 10,
                fontWeight: 500,
            } as React.CSSProperties,
            labelBgStyle: {
                fill: '#18181b',
                fillOpacity: 0.9,
            } as React.CSSProperties,
            markerEnd: 'arrowclosed',
        }));

        return layout(nodes, edges, "LR");
    }, [graph]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesEdges.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesEdges.edges);

    const onLayout = useCallback((direction: "TB" | "LR" | "RL" | "BT") => {
        const layouted = layout(nodes, edges, direction);
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);
    }, [nodes, edges, setNodes, setEdges]);

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-zinc-950"
                minZoom={0.1}
                maxZoom={2}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                }}
            >
                <MiniMap
                    pannable
                    zoomable
                    className="bg-zinc-900/90 border border-zinc-800 rounded-lg"
                    nodeColor="#27272a"
                    maskColor="rgba(0, 0, 0, 0.7)"
                />
                <Controls className="bg-zinc-900/90 border border-zinc-800 rounded-lg shadow-xl [&>button]:bg-zinc-900 [&>button]:border-zinc-700 [&>button]:text-zinc-100 [&>button:hover]:bg-zinc-800" />
                <Background
                    color="#27272a"
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                />

                {/* Layout Controls */}
                <Panel position="top-right" className="flex gap-2 m-2">
                    <div className="bg-zinc-900/95 border border-zinc-800 rounded-lg shadow-xl p-1 flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLayout("LR")}
                            className="text-zinc-100 hover:bg-zinc-800 hover:text-white"
                            title="Layout: Left to Right"
                        >
                            <AlignHorizontalDistributeCenter className="w-4 h-4" />
                            <span className="ml-1 text-xs">LR</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLayout("TB")}
                            className="text-zinc-100 hover:bg-zinc-800 hover:text-white"
                            title="Layout: Top to Bottom"
                        >
                            <AlignVerticalDistributeCenter className="w-4 h-4" />
                            <span className="ml-1 text-xs">TB</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLayout("RL")}
                            className="text-zinc-100 hover:bg-zinc-800 hover:text-white"
                            title="Layout: Right to Left"
                        >
                            <AlignHorizontalDistributeCenter className="w-4 h-4 rotate-180" />
                            <span className="ml-1 text-xs">RL</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLayout("BT")}
                            className="text-zinc-100 hover:bg-zinc-800 hover:text-white"
                            title="Layout: Bottom to Top"
                        >
                            <AlignVerticalDistributeCenter className="w-4 h-4 rotate-180" />
                            <span className="ml-1 text-xs">BT</span>
                        </Button>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

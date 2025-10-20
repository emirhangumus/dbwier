// src/autoLayout.ts
import dagre from "dagre";
import type { Edge, Node } from "reactflow";

const nodeWidth = 240;
const baseNodeHeight = 60; // Header height + padding
const rowHeight = 33; // Height per column row

function calculateNodeHeight(columnCount: number): number {
    // Calculate full height: header + all rows (no max limit)
    return baseNodeHeight + (columnCount * rowHeight);
}

export function layout(nodes: Node[], edges: Edge[], direction: "LR" | "TB" | "RL" | "BT" = "LR") {
    const g = new dagre.graphlib.Graph();

    // Increase spacing significantly to prevent overlap
    const isVertical = direction === "TB" || direction === "BT";
    g.setGraph({
        rankdir: direction,
        nodesep: isVertical ? 100 : 150,  // Horizontal spacing between nodes
        ranksep: isVertical ? 150 : 200, // Vertical spacing between ranks
        marginx: 30,
        marginy: 30,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Set node dimensions based on actual column count
    nodes.forEach(n => {
        const columnCount = n.data?.columns?.length || 0;
        const height = calculateNodeHeight(columnCount);
        g.setNode(n.id, { width: nodeWidth, height });
    });

    edges.forEach(e => g.setEdge(e.source, e.target));

    dagre.layout(g);

    const outNodes = nodes.map(n => {
        const pos = g.node(n.id);
        const columnCount = n.data?.columns?.length || 0;
        const height = calculateNodeHeight(columnCount);

        return {
            ...n,
            position: {
                x: pos.x - nodeWidth / 2,
                y: pos.y - height / 2
            },
        };
    });

    return { nodes: outNodes, edges };
}

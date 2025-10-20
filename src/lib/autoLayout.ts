// src/autoLayout.ts
import dagre from "dagre";
import type { Edge, Node } from "reactflow";

const nodeWidth = 240;
const nodeHeight = 140;

export function layout(nodes: Node[], edges: Edge[], direction: "LR" | "TB" | "RL" | "BT" = "LR") {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(n => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
    edges.forEach(e => g.setEdge(e.source, e.target));

    dagre.layout(g);

    const outNodes = nodes.map(n => {
        const pos = g.node(n.id);
        return {
            ...n,
            position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
        };
    });

    return { nodes: outNodes, edges };
}

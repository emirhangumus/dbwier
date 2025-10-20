// src/lib/exportUtils.ts
import { toPng, toSvg } from 'html-to-image';

export function shareViaURL(sql: string): string {
    const encoded = btoa(encodeURIComponent(sql));
    const url = new URL(window.location.href);
    url.searchParams.set('schema', encoded);
    return url.toString();
}

export function loadFromURL(): string | null {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get('schema');
    if (!encoded) return null;

    try {
        return decodeURIComponent(atob(encoded));
    } catch {
        return null;
    }
}

export async function exportAsPNG(reactFlowInstance: any, filename: string) {
    if (!reactFlowInstance) {
        alert('ReactFlow instance not ready');
        return;
    }

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
        alert('ReactFlow viewport not found');
        return;
    }

    try {
        const dataUrl = await toPng(viewport, {
            backgroundColor: '#09090b',
            width: viewport.offsetWidth,
            height: viewport.offsetHeight,
        });

        const a = document.createElement('a');
        a.setAttribute('download', filename);
        a.setAttribute('href', dataUrl);
        a.click();
    } catch (error) {
        console.error('Failed to export PNG:', error);
        alert('Failed to export PNG');
    }
}

export async function exportAsSVG(reactFlowInstance: any, filename: string) {
    if (!reactFlowInstance) {
        alert('ReactFlow instance not ready');
        return;
    }

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
        alert('ReactFlow viewport not found');
        return;
    }

    try {
        const dataUrl = await toSvg(viewport, {
            backgroundColor: '#09090b',
            width: viewport.offsetWidth,
            height: viewport.offsetHeight,
        });

        const a = document.createElement('a');
        a.setAttribute('download', filename);
        a.setAttribute('href', dataUrl);
        a.click();
    } catch (error) {
        console.error('Failed to export SVG:', error);
        alert('Failed to export SVG');
    }
}


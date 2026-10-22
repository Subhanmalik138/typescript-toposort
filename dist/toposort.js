"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CycleError = void 0;
exports.topologicalSort = topologicalSort;
exports.topologicalSortDFS = topologicalSortDFS;
exports.findCycle = findCycle;
exports.hasCycle = hasCycle;
exports.isDAG = isDAG;
/**
 * Error thrown when a graph is not a DAG. Carries one concrete cycle path
 * (e.g. ["a", "b", "c", "a"]) so callers can show users exactly what's wrong.
 */
class CycleError extends Error {
    cycle;
    constructor(cycle) {
        super(`cycle detected: ${cycle.join(" -> ")}`);
        this.name = "CycleError";
        this.cycle = cycle;
    }
}
exports.CycleError = CycleError;
function defaultCompare(a, b) {
    if (typeof a === "number" && typeof b === "number")
        return a - b;
    return String(a).localeCompare(String(b));
}
/**
 * Kahn's algorithm (BFS over in-degree-0 nodes), iterative and O(V + E).
 * Cycle detection is a natural byproduct: any node left without an order is
 * part of, or downstream of, a cycle.
 *
 * @throws {CycleError} when the graph contains a cycle
 */
function topologicalSort(graph, options = {}) {
    const compare = options.compare ?? defaultCompare;
    const out = graph.internalOut();
    const inDegree = new Map();
    const ids = graph.internalNodeIds();
    for (const id of ids) {
        const k = graph.internalKeyOf(id);
        inDegree.set(k, 0);
    }
    for (const targets of out.values()) {
        for (const t of targets)
            inDegree.set(t, inDegree.get(t) + 1);
    }
    const ready = [];
    for (const id of ids) {
        const k = graph.internalKeyOf(id);
        if (inDegree.get(k) === 0)
            ready.push(k);
    }
    const result = [];
    while (ready.length > 0) {
        // Deterministic pick among available nodes.
        ready.sort((a, b) => compare(graph.internalIdOf(a), graph.internalIdOf(b)));
        const key = ready.shift();
        result.push(graph.internalIdOf(key));
        for (const next of out.get(key) ?? []) {
            const remaining = inDegree.get(next) - 1;
            inDegree.set(next, remaining);
            if (remaining === 0)
                ready.push(next);
        }
    }
    if (result.length !== ids.length) {
        throw new CycleError(findCycle(graph) ?? []);
    }
    return result;
}
/**
 * Iterative depth-first topological sort. Produces the same valid ordering
 * guarantees as Kahn's but without recursion, so deep chains can't overflow
 * the call stack.
 *
 * @throws {CycleError} when the graph contains a cycle
 */
function topologicalSortDFS(graph) {
    const out = graph.internalOut();
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    const result = [];
    for (const id of graph.internalNodeIds()) {
        const start = graph.internalKeyOf(id);
        if (color.get(start) === BLACK)
            continue;
        // Explicit stack of [node, iterator-exhausted?].
        const stack = [
            { key: start, children: [...(out.get(start) ?? [])], index: 0 },
        ];
        color.set(start, GRAY);
        const path = [start];
        while (stack.length > 0) {
            const frame = stack[stack.length - 1];
            if (frame.index < frame.children.length) {
                const child = frame.children[frame.index++];
                const c = color.get(child) ?? WHITE;
                if (c === GRAY) {
                    // Back edge: child is on the current DFS path -> cycle.
                    const cycleStart = path.indexOf(child);
                    const cycle = [...path.slice(cycleStart), child].map((k) => graph.internalIdOf(k));
                    throw new CycleError(cycle);
                }
                if (c === WHITE) {
                    color.set(child, GRAY);
                    path.push(child);
                    stack.push({ key: child, children: [...(out.get(child) ?? [])], index: 0 });
                }
            }
            else {
                color.set(frame.key, BLACK);
                path.pop();
                result.push(graph.internalIdOf(frame.key));
                stack.pop();
            }
        }
    }
    return result.reverse();
}
/** Iterative DFS that returns one concrete cycle path, or null if acyclic. */
function findCycle(graph) {
    const out = graph.internalOut();
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    for (const id of graph.internalNodeIds()) {
        const start = graph.internalKeyOf(id);
        if ((color.get(start) ?? WHITE) !== WHITE)
            continue;
        const stack = [
            { key: start, children: [...(out.get(start) ?? [])], index: 0 },
        ];
        color.set(start, GRAY);
        const path = [start];
        while (stack.length > 0) {
            const frame = stack[stack.length - 1];
            if (frame.index < frame.children.length) {
                const child = frame.children[frame.index++];
                const c = color.get(child) ?? WHITE;
                if (c === GRAY) {
                    const cycleStart = path.indexOf(child);
                    return [...path.slice(cycleStart), child].map((k) => graph.internalIdOf(k));
                }
                if (c === WHITE) {
                    color.set(child, GRAY);
                    path.push(child);
                    stack.push({ key: child, children: [...(out.get(child) ?? [])], index: 0 });
                }
            }
            else {
                color.set(frame.key, BLACK);
                path.pop();
                stack.pop();
            }
        }
    }
    return null;
}
function hasCycle(graph) {
    return findCycle(graph) !== null;
}
function isDAG(graph) {
    return !hasCycle(graph);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitiveDependents = transitiveDependents;
exports.transitiveDependencies = transitiveDependencies;
exports.longestChainDepths = longestChainDepths;
/** All nodes reachable downstream from `id` (everything that depends on it). */
function transitiveDependents(graph, id) {
    return walk(graph, id, (g, i) => g.successors(i));
}
/** All nodes upstream of `id` (everything it directly or indirectly needs). */
function transitiveDependencies(graph, id) {
    return walk(graph, id, (g, i) => g.predecessors(i));
}
function walk(graph, start, step) {
    if (!graph.hasNode(start))
        throw new Error(`unknown node: ${start}`);
    const seen = new Set([graph.internalKeyOf(start)]);
    const stack = step(graph, start);
    const result = [];
    while (stack.length > 0) {
        const id = stack.pop();
        const k = graph.internalKeyOf(id);
        if (seen.has(k))
            continue;
        seen.add(k);
        result.push(id);
        stack.push(...step(graph, id));
    }
    return result;
}
/**
 * The length of the longest dependency chain ending at each node
 * (0 = no prerequisites). Useful for estimating critical-path depth.
 */
function longestChainDepths(graph) {
    const depths = new Map();
    const out = graph.internalOut();
    const visiting = new Set();
    const visit = (key) => {
        const known = depths.get(key);
        if (known !== undefined)
            return known;
        if (visiting.has(key)) {
            throw new Error(`cannot compute depths: graph contains a cycle near ${graph.internalIdOf(key)}`);
        }
        visiting.add(key);
        let depth = 0;
        for (const child of out.get(key) ?? []) {
            depth = Math.max(depth, 1 + visit(child));
        }
        visiting.delete(key);
        depths.set(key, depth);
        return depth;
    };
    for (const id of graph.internalNodeIds())
        visit(graph.internalKeyOf(id));
    const result = new Map();
    for (const [key, depth] of depths)
        result.set(graph.internalIdOf(key), depth);
    return result;
}

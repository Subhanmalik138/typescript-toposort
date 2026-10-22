import { DirectedGraph, NodeId } from "./graph";

/** All nodes reachable downstream from `id` (everything that depends on it). */
export function transitiveDependents(graph: DirectedGraph, id: NodeId): NodeId[] {
  return walk(graph, id, (g, i) => g.successors(i));
}

/** All nodes upstream of `id` (everything it directly or indirectly needs). */
export function transitiveDependencies(graph: DirectedGraph, id: NodeId): NodeId[] {
  return walk(graph, id, (g, i) => g.predecessors(i));
}

function walk(
  graph: DirectedGraph,
  start: NodeId,
  step: (g: DirectedGraph, id: NodeId) => NodeId[]
): NodeId[] {
  if (!graph.hasNode(start)) throw new Error(`unknown node: ${start}`);
  const seen = new Set<string>([graph.internalKeyOf(start)]);
  const stack = step(graph, start);
  const result: NodeId[] = [];

  while (stack.length > 0) {
    const id = stack.pop()!;
    const k = graph.internalKeyOf(id);
    if (seen.has(k)) continue;
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
export function longestChainDepths(graph: DirectedGraph): Map<NodeId, number> {
  const depths = new Map<string, number>();
  const out = graph.internalOut();
  const visiting = new Set<string>();

  const visit = (key: string): number => {
    const known = depths.get(key);
    if (known !== undefined) return known;
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

  for (const id of graph.internalNodeIds()) visit(graph.internalKeyOf(id));

  const result = new Map<NodeId, number>();
  for (const [key, depth] of depths) result.set(graph.internalIdOf(key), depth);
  return result;
}

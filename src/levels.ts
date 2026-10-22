import { DirectedGraph, NodeId } from "./graph";
import { CycleError, SortOptions, findCycle } from "./toposort";

/**
 * Computes maximally parallel execution levels: a layered variant of Kahn's
 * algorithm where level 0 holds every node with no prerequisites, level 1
 * holds nodes whose prerequisites are all in level 0, and so on.
 *
 * Every node in the same level can run concurrently (think build steps or
 * CI stages). The union of the levels is a valid topological order.
 *
 * @throws {CycleError} when the graph contains a cycle
 */
export function computeLevels(graph: DirectedGraph, options: SortOptions = {}): NodeId[][] {
  const out = graph.internalOut();
  const inDegree = new Map<string, number>();
  const ids = graph.internalNodeIds();

  for (const id of ids) inDegree.set(graph.internalKeyOf(id), 0);
  for (const targets of out.values()) {
    for (const t of targets) inDegree.set(t, inDegree.get(t)! + 1);
  }

  let current = ids
    .map((id) => graph.internalKeyOf(id))
    .filter((k) => inDegree.get(k) === 0);

  const levels: NodeId[][] = [];
  let placed = 0;

  while (current.length > 0) {
    levels.push(current.map((k) => graph.internalIdOf(k)));
    placed += current.length;

    const next: string[] = [];
    for (const key of current) {
      for (const child of out.get(key) ?? []) {
        const remaining = inDegree.get(child)! - 1;
        inDegree.set(child, remaining);
        if (remaining === 0) next.push(child);
      }
    }
    current = next;
  }

  if (placed !== ids.length) {
    throw new CycleError(findCycle(graph) ?? []);
  }

  return levels;
}

import { DirectedGraph, NodeId } from "./graph";

/**
 * Error thrown when a graph is not a DAG. Carries one concrete cycle path
 * (e.g. ["a", "b", "c", "a"]) so callers can show users exactly what's wrong.
 */
export class CycleError extends Error {
  readonly cycle: NodeId[];

  constructor(cycle: NodeId[]) {
    super(`cycle detected: ${cycle.join(" -> ")}`);
    this.name = "CycleError";
    this.cycle = cycle;
  }
}

export interface SortOptions {
  /**
   * Tie-breaker used when several nodes are simultaneously available.
   * Defaults to a stable numeric-then-lexicographic comparison, which makes
   * output fully deterministic regardless of insertion order.
   */
  compare?: (a: NodeId, b: NodeId) => number;
}

function defaultCompare(a: NodeId, b: NodeId): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Kahn's algorithm (BFS over in-degree-0 nodes), iterative and O(V + E).
 * Cycle detection is a natural byproduct: any node left without an order is
 * part of, or downstream of, a cycle.
 *
 * @throws {CycleError} when the graph contains a cycle
 */
export function topologicalSort(graph: DirectedGraph, options: SortOptions = {}): NodeId[] {
  const compare = options.compare ?? defaultCompare;
  const out = graph.internalOut();
  const inDegree = new Map<string, number>();
  const ids = graph.internalNodeIds();

  for (const id of ids) {
    const k = graph.internalKeyOf(id);
    inDegree.set(k, 0);
  }
  for (const targets of out.values()) {
    for (const t of targets) inDegree.set(t, inDegree.get(t)! + 1);
  }

  const ready: string[] = [];
  for (const id of ids) {
    const k = graph.internalKeyOf(id);
    if (inDegree.get(k) === 0) ready.push(k);
  }

  const result: NodeId[] = [];
  while (ready.length > 0) {
    // Deterministic pick among available nodes.
    ready.sort((a, b) => compare(graph.internalIdOf(a), graph.internalIdOf(b)));
    const key = ready.shift()!;
    result.push(graph.internalIdOf(key));
    for (const next of out.get(key) ?? []) {
      const remaining = inDegree.get(next)! - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) ready.push(next);
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
export function topologicalSortDFS(graph: DirectedGraph): NodeId[] {
  const out = graph.internalOut();
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const result: NodeId[] = [];

  for (const id of graph.internalNodeIds()) {
    const start = graph.internalKeyOf(id);
    if (color.get(start) === BLACK) continue;
    // Explicit stack of [node, iterator-exhausted?].
    const stack: Array<{ key: string; children: string[]; index: number }> = [
      { key: start, children: [...(out.get(start) ?? [])], index: 0 },
    ];
    color.set(start, GRAY);
    const path: string[] = [start];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.index < frame.children.length) {
        const child = frame.children[frame.index++];
        const c = color.get(child) ?? WHITE;
        if (c === GRAY) {
          // Back edge: child is on the current DFS path -> cycle.
          const cycleStart = path.indexOf(child);
          const cycle = [...path.slice(cycleStart), child].map((k) =>
            graph.internalIdOf(k)
          );
          throw new CycleError(cycle);
        }
        if (c === WHITE) {
          color.set(child, GRAY);
          path.push(child);
          stack.push({ key: child, children: [...(out.get(child) ?? [])], index: 0 });
        }
      } else {
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
export function findCycle(graph: DirectedGraph): NodeId[] | null {
  const out = graph.internalOut();
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();

  for (const id of graph.internalNodeIds()) {
    const start = graph.internalKeyOf(id);
    if ((color.get(start) ?? WHITE) !== WHITE) continue;

    const stack: Array<{ key: string; children: string[]; index: number }> = [
      { key: start, children: [...(out.get(start) ?? [])], index: 0 },
    ];
    color.set(start, GRAY);
    const path: string[] = [start];

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
      } else {
        color.set(frame.key, BLACK);
        path.pop();
        stack.pop();
      }
    }
  }
  return null;
}

export function hasCycle(graph: DirectedGraph): boolean {
  return findCycle(graph) !== null;
}

export function isDAG(graph: DirectedGraph): boolean {
  return !hasCycle(graph);
}

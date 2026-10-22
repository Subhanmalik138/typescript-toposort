import { DirectedGraph, NodeId } from "./graph";
/**
 * Error thrown when a graph is not a DAG. Carries one concrete cycle path
 * (e.g. ["a", "b", "c", "a"]) so callers can show users exactly what's wrong.
 */
export declare class CycleError extends Error {
    readonly cycle: NodeId[];
    constructor(cycle: NodeId[]);
}
export interface SortOptions {
    /**
     * Tie-breaker used when several nodes are simultaneously available.
     * Defaults to a stable numeric-then-lexicographic comparison, which makes
     * output fully deterministic regardless of insertion order.
     */
    compare?: (a: NodeId, b: NodeId) => number;
}
/**
 * Kahn's algorithm (BFS over in-degree-0 nodes), iterative and O(V + E).
 * Cycle detection is a natural byproduct: any node left without an order is
 * part of, or downstream of, a cycle.
 *
 * @throws {CycleError} when the graph contains a cycle
 */
export declare function topologicalSort(graph: DirectedGraph, options?: SortOptions): NodeId[];
/**
 * Iterative depth-first topological sort. Produces the same valid ordering
 * guarantees as Kahn's but without recursion, so deep chains can't overflow
 * the call stack.
 *
 * @throws {CycleError} when the graph contains a cycle
 */
export declare function topologicalSortDFS(graph: DirectedGraph): NodeId[];
/** Iterative DFS that returns one concrete cycle path, or null if acyclic. */
export declare function findCycle(graph: DirectedGraph): NodeId[] | null;
export declare function hasCycle(graph: DirectedGraph): boolean;
export declare function isDAG(graph: DirectedGraph): boolean;

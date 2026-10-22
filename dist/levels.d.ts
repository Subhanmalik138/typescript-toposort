import { DirectedGraph, NodeId } from "./graph";
import { SortOptions } from "./toposort";
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
export declare function computeLevels(graph: DirectedGraph, options?: SortOptions): NodeId[][];

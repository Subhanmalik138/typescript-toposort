import { DirectedGraph, NodeId } from "./graph";
/** All nodes reachable downstream from `id` (everything that depends on it). */
export declare function transitiveDependents(graph: DirectedGraph, id: NodeId): NodeId[];
/** All nodes upstream of `id` (everything it directly or indirectly needs). */
export declare function transitiveDependencies(graph: DirectedGraph, id: NodeId): NodeId[];
/**
 * The length of the longest dependency chain ending at each node
 * (0 = no prerequisites). Useful for estimating critical-path depth.
 */
export declare function longestChainDepths(graph: DirectedGraph): Map<NodeId, number>;

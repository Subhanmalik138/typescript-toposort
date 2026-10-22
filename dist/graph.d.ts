/**
 * A mutable directed graph backed by adjacency sets.
 *
 * Node ids are normalized to strings so string and numeric labels can be
 * mixed freely; the original ids are preserved for iteration and output.
 */
export type NodeId = string | number;
export interface Edge {
    from: NodeId;
    to: NodeId;
}
export declare class DirectedGraph {
    private readonly nodesByKey;
    private readonly outEdges;
    private readonly inEdges;
    private key;
    addNode(id: NodeId): this;
    /**
     * Adds a directed edge `from -> to`. Adding an existing edge is a no-op.
     * Self-loops are allowed and reported by the cycle analysis (they make a
     * graph non-DAG), unless `allowSelfLoop` is set — in which case they are
     * silently dropped.
     */
    addEdge(from: NodeId, to: NodeId, allowSelfLoop?: boolean): this;
    hasNode(id: NodeId): boolean;
    hasEdge(from: NodeId, to: NodeId): boolean;
    get nodeCount(): number;
    get edgeCount(): number;
    /** Original node ids in insertion order. */
    nodeIds(): NodeId[];
    successors(id: NodeId): NodeId[];
    predecessors(id: NodeId): NodeId[];
    inDegree(id: NodeId): number;
    outDegree(id: NodeId): number;
    edges(): Edge[];
    /** Internal views keyed by normalized id, for the algorithms. */
    internalOut(): Map<string, Set<string>>;
    internalNodeIds(): NodeId[];
    internalKeyOf(id: NodeId): string;
    internalIdOf(key: string): NodeId;
}
/** Builds a graph from an edge list; edge `from -> to` means `from` runs first. */
export declare function graphFromEdges(edges: Iterable<Edge>): DirectedGraph;
/** Builds a graph from a dependency map: key depends on each of its values. */
export declare function graphFromDependencies(deps: Record<string, NodeId[]>): DirectedGraph;

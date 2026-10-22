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

export class DirectedGraph {
  private readonly nodesByKey = new Map<string, NodeId>();
  private readonly outEdges = new Map<string, Set<string>>();
  private readonly inEdges = new Map<string, Set<string>>();

  private key(id: NodeId): string {
    return typeof id === "number" ? `#${id}` : id;
  }

  addNode(id: NodeId): this {
    const k = this.key(id);
    if (!this.nodesByKey.has(k)) {
      this.nodesByKey.set(k, id);
      this.outEdges.set(k, new Set());
      this.inEdges.set(k, new Set());
    }
    return this;
  }

  /**
   * Adds a directed edge `from -> to`. Adding an existing edge is a no-op.
   * Self-loops are allowed and reported by the cycle analysis (they make a
   * graph non-DAG), unless `allowSelfLoop` is set — in which case they are
   * silently dropped.
   */
  addEdge(from: NodeId, to: NodeId, allowSelfLoop = false): this {
    if (from === to && allowSelfLoop) return this;
    this.addNode(from).addNode(to);
    this.outEdges.get(this.key(from))!.add(this.key(to));
    this.inEdges.get(this.key(to))!.add(this.key(from));
    return this;
  }

  hasNode(id: NodeId): boolean {
    return this.nodesByKey.has(this.key(id));
  }

  hasEdge(from: NodeId, to: NodeId): boolean {
    return this.outEdges.get(this.key(from))?.has(this.key(to)) ?? false;
  }

  get nodeCount(): number {
    return this.nodesByKey.size;
  }

  get edgeCount(): number {
    let n = 0;
    for (const targets of this.outEdges.values()) n += targets.size;
    return n;
  }

  /** Original node ids in insertion order. */
  nodeIds(): NodeId[] {
    return [...this.nodesByKey.values()];
  }

  successors(id: NodeId): NodeId[] {
    const k = this.key(id);
    return [...(this.outEdges.get(k) ?? [])].map((t) => this.nodesByKey.get(t)!);
  }

  predecessors(id: NodeId): NodeId[] {
    const k = this.key(id);
    return [...(this.inEdges.get(k) ?? [])].map((t) => this.nodesByKey.get(t)!);
  }

  inDegree(id: NodeId): number {
    return this.inEdges.get(this.key(id))?.size ?? 0;
  }

  outDegree(id: NodeId): number {
    return this.outEdges.get(this.key(id))?.size ?? 0;
  }

  edges(): Edge[] {
    const out: Edge[] = [];
    for (const [from, targets] of this.outEdges) {
      for (const to of targets) {
        out.push({ from: this.nodesByKey.get(from)!, to: this.nodesByKey.get(to)! });
      }
    }
    return out;
  }

  /** Internal views keyed by normalized id, for the algorithms. */
  internalOut(): Map<string, Set<string>> {
    return this.outEdges;
  }

  internalNodeIds(): NodeId[] {
    return this.nodeIds();
  }

  internalKeyOf(id: NodeId): string {
    return this.key(id);
  }

  internalIdOf(key: string): NodeId {
    return this.nodesByKey.get(key)!;
  }
}

/** Builds a graph from an edge list; edge `from -> to` means `from` runs first. */
export function graphFromEdges(edges: Iterable<Edge>): DirectedGraph {
  const g = new DirectedGraph();
  for (const e of edges) g.addEdge(e.from, e.to);
  return g;
}

/** Builds a graph from a dependency map: key depends on each of its values. */
export function graphFromDependencies(deps: Record<string, NodeId[]>): DirectedGraph {
  const g = new DirectedGraph();
  for (const [node, requirements] of Object.entries(deps)) {
    g.addNode(node);
    for (const req of requirements) g.addEdge(req, node); // req runs before node
  }
  return g;
}

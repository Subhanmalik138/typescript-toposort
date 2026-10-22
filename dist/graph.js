"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectedGraph = void 0;
exports.graphFromEdges = graphFromEdges;
exports.graphFromDependencies = graphFromDependencies;
class DirectedGraph {
    nodesByKey = new Map();
    outEdges = new Map();
    inEdges = new Map();
    key(id) {
        return typeof id === "number" ? `#${id}` : id;
    }
    addNode(id) {
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
    addEdge(from, to, allowSelfLoop = false) {
        if (from === to && allowSelfLoop)
            return this;
        this.addNode(from).addNode(to);
        this.outEdges.get(this.key(from)).add(this.key(to));
        this.inEdges.get(this.key(to)).add(this.key(from));
        return this;
    }
    hasNode(id) {
        return this.nodesByKey.has(this.key(id));
    }
    hasEdge(from, to) {
        return this.outEdges.get(this.key(from))?.has(this.key(to)) ?? false;
    }
    get nodeCount() {
        return this.nodesByKey.size;
    }
    get edgeCount() {
        let n = 0;
        for (const targets of this.outEdges.values())
            n += targets.size;
        return n;
    }
    /** Original node ids in insertion order. */
    nodeIds() {
        return [...this.nodesByKey.values()];
    }
    successors(id) {
        const k = this.key(id);
        return [...(this.outEdges.get(k) ?? [])].map((t) => this.nodesByKey.get(t));
    }
    predecessors(id) {
        const k = this.key(id);
        return [...(this.inEdges.get(k) ?? [])].map((t) => this.nodesByKey.get(t));
    }
    inDegree(id) {
        return this.inEdges.get(this.key(id))?.size ?? 0;
    }
    outDegree(id) {
        return this.outEdges.get(this.key(id))?.size ?? 0;
    }
    edges() {
        const out = [];
        for (const [from, targets] of this.outEdges) {
            for (const to of targets) {
                out.push({ from: this.nodesByKey.get(from), to: this.nodesByKey.get(to) });
            }
        }
        return out;
    }
    /** Internal views keyed by normalized id, for the algorithms. */
    internalOut() {
        return this.outEdges;
    }
    internalNodeIds() {
        return this.nodeIds();
    }
    internalKeyOf(id) {
        return this.key(id);
    }
    internalIdOf(key) {
        return this.nodesByKey.get(key);
    }
}
exports.DirectedGraph = DirectedGraph;
/** Builds a graph from an edge list; edge `from -> to` means `from` runs first. */
function graphFromEdges(edges) {
    const g = new DirectedGraph();
    for (const e of edges)
        g.addEdge(e.from, e.to);
    return g;
}
/** Builds a graph from a dependency map: key depends on each of its values. */
function graphFromDependencies(deps) {
    const g = new DirectedGraph();
    for (const [node, requirements] of Object.entries(deps)) {
        g.addNode(node);
        for (const req of requirements)
            g.addEdge(req, node); // req runs before node
    }
    return g;
}

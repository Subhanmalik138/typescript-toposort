import {
  DirectedGraph,
  graphFromDependencies,
  graphFromEdges,
} from "../src/graph";

describe("DirectedGraph", () => {
  it("adds nodes and edges, ignoring duplicates", () => {
    const g = new DirectedGraph();
    g.addEdge("a", "b").addEdge("a", "b").addEdge("b", "c");
    expect(g.nodeCount).toBe(3);
    expect(g.edgeCount).toBe(2);
    expect(g.hasEdge("a", "b")).toBe(true);
    expect(g.hasEdge("b", "a")).toBe(false);
  });

  it("reports successors, predecessors, and degrees", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "a", to: "c" },
      { from: "b", to: "c" },
    ]);
    expect(new Set(g.successors("a"))).toEqual(new Set(["b", "c"]));
    expect(new Set(g.predecessors("c"))).toEqual(new Set(["a", "b"]));
    expect(g.inDegree("a")).toBe(0);
    expect(g.outDegree("a")).toBe(2);
  });

  it("supports numeric node ids", () => {
    const g = graphFromEdges([{ from: 1, to: 2 }]);
    expect(g.hasNode(1)).toBe(true);
    expect(g.successors(1)).toEqual([2]);
  });

  it("builds from a dependency map with reversed edges", () => {
    const g = graphFromDependencies({ app: ["db", "api"], api: ["db"] });
    expect(g.hasEdge("db", "app")).toBe(true);
    expect(g.hasEdge("api", "app")).toBe(true);
    expect(g.hasEdge("app", "db")).toBe(false);
  });

  it("keeps isolated nodes added without edges", () => {
    const g = new DirectedGraph().addNode("lonely");
    expect(g.nodeCount).toBe(1);
    expect(g.edgeCount).toBe(0);
  });
});

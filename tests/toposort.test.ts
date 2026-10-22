import { DirectedGraph, graphFromEdges } from "../src/graph";
import {
  CycleError,
  findCycle,
  hasCycle,
  isDAG,
  topologicalSort,
  topologicalSortDFS,
} from "../src/toposort";

/** Asserts the order is valid: every edge's `from` appears before its `to`. */
function assertValidOrder(g: DirectedGraph, order: (string | number)[]): void {
  expect(new Set(order).size).toBe(g.nodeCount);
  const pos = new Map(order.map((id, i) => [String(id), i]));
  for (const { from, to } of g.edges()) {
    expect(pos.get(String(from))!).toBeLessThan(pos.get(String(to))!);
  }
}

describe("topologicalSort (Kahn)", () => {
  it("sorts a simple diamond", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "a", to: "c" },
      { from: "b", to: "d" },
      { from: "c", to: "d" },
    ]);
    assertValidOrder(g, topologicalSort(g));
  });

  it("is deterministic regardless of insertion order", () => {
    const edges = [
      { from: "m", to: "z" },
      { from: "a", to: "z" },
      { from: "b", to: "m" },
    ];
    const g1 = graphFromEdges(edges);
    const g2 = graphFromEdges([...edges].reverse());
    expect(topologicalSort(g1)).toEqual(topologicalSort(g2));
  });

  it("honours a custom comparator", () => {
    const g = graphFromEdges([
      { from: "b", to: "z" },
      { from: "a", to: "z" },
    ]);
    const desc = topologicalSort(g, { compare: (x, y) => String(y).localeCompare(String(x)) });
    expect(desc.slice(0, 2)).toEqual(["b", "a"]);
  });

  it("handles a long chain and disconnected components", () => {
    const edges = Array.from({ length: 500 }, (_, i) => ({
      from: `n${i}`,
      to: `n${i + 1}`,
    }));
    const g = graphFromEdges(edges);
    g.addNode("lonely");
    const order = topologicalSort(g);
    assertValidOrder(g, order);
    expect(order[0]).toBe("lonely"); // lexicographically first, in-degree 0
  });

  it("returns an empty order for an empty graph", () => {
    expect(topologicalSort(new DirectedGraph())).toEqual([]);
  });

  it("throws CycleError carrying the cycle path", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "b", to: "c" },
      { from: "c", to: "a" },
    ]);
    try {
      topologicalSort(g);
      fail("expected CycleError");
    } catch (err) {
      expect(err).toBeInstanceOf(CycleError);
      const cycle = (err as CycleError).cycle.map(String);
      expect(cycle[0]).toBe(cycle[cycle.length - 1]); // closed loop
      expect(new Set(cycle)).toEqual(new Set(["a", "b", "c"]));
    }
  });

  it("detects a self-loop as a cycle", () => {
    const g = new DirectedGraph().addEdge("a", "a");
    expect(() => topologicalSort(g)).toThrow(CycleError);
    expect(findCycle(g)).toEqual(["a", "a"]);
  });
});

describe("topologicalSortDFS", () => {
  it("produces a valid order on a DAG", () => {
    const g = graphFromEdges([
      { from: "compile", to: "test" },
      { from: "compile", to: "lint" },
      { from: "test", to: "package" },
      { from: "lint", to: "package" },
    ]);
    assertValidOrder(g, topologicalSortDFS(g));
  });

  it("survives a 50k-node chain without stack overflow", () => {
    const g = new DirectedGraph();
    const n = 50000;
    for (let i = 0; i < n; i++) g.addEdge(i, i + 1);
    const order = topologicalSortDFS(g);
    expect(order).toHaveLength(n + 1);
    expect(order[0]).toBe(0);
  });

  it("throws CycleError on a cycle", () => {
    const g = graphFromEdges([
      { from: "x", to: "y" },
      { from: "y", to: "x" },
    ]);
    expect(() => topologicalSortDFS(g)).toThrow(CycleError);
  });
});

describe("cycle helpers", () => {
  it("findCycle returns null for a DAG", () => {
    const g = graphFromEdges([{ from: "a", to: "b" }]);
    expect(findCycle(g)).toBeNull();
    expect(hasCycle(g)).toBe(false);
    expect(isDAG(g)).toBe(true);
  });

  it("findCycle returns a real cycle path", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "b", to: "c" },
      { from: "c", to: "b" },
      { from: "c", to: "d" },
    ]);
    const cycle = findCycle(g)!.map(String);
    expect(cycle[0]).toBe(cycle[cycle.length - 1]);
    expect(new Set(cycle)).toEqual(new Set(["b", "c"]));
    expect(hasCycle(g)).toBe(true);
    expect(isDAG(g)).toBe(false);
  });
});

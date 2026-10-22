import { graphFromEdges } from "../src/graph";
import {
  longestChainDepths,
  transitiveDependencies,
  transitiveDependents,
} from "../src/analysis";
import { computeLevels } from "../src/levels";
import { CycleError } from "../src/toposort";

describe("computeLevels", () => {
  it("groups a diamond into three parallel levels", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "a", to: "c" },
      { from: "b", to: "d" },
      { from: "c", to: "d" },
    ]);
    const levels = computeLevels(g);
    expect(levels).toEqual([["a"], ["b", "c"], ["d"]]);
  });

  it("puts independent chains in the same level", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "x", to: "y" },
    ]);
    const levels = computeLevels(g);
    expect(levels).toHaveLength(2);
    expect(new Set(levels[0])).toEqual(new Set(["a", "x"]));
    expect(new Set(levels[1])).toEqual(new Set(["b", "y"]));
  });

  it("throws CycleError on a cyclic graph", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "b", to: "a" },
    ]);
    expect(() => computeLevels(g)).toThrow(CycleError);
  });
});

describe("transitive queries", () => {
  const g = graphFromEdges([
    { from: "db", to: "api" },
    { from: "api", to: "app" },
    { from: "cache", to: "api" },
    { from: "db", to: "worker" },
  ]);

  it("finds all transitive dependents", () => {
    expect(new Set(transitiveDependents(g, "db"))).toEqual(
      new Set(["api", "app", "worker"])
    );
  });

  it("finds all transitive dependencies", () => {
    expect(new Set(transitiveDependencies(g, "app"))).toEqual(
      new Set(["api", "db", "cache"])
    );
  });

  it("rejects unknown nodes", () => {
    expect(() => transitiveDependents(g, "nope")).toThrow(/unknown node/);
  });
});

describe("longestChainDepths", () => {
  it("measures critical-path depth per node", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "b", to: "c" },
      { from: "a", to: "c" },
    ]);
    const depths = longestChainDepths(g);
    expect(depths.get("a")).toBe(2);
    expect(depths.get("b")).toBe(1);
    expect(depths.get("c")).toBe(0);
  });

  it("refuses cyclic graphs", () => {
    const g = graphFromEdges([
      { from: "a", to: "b" },
      { from: "b", to: "a" },
    ]);
    expect(() => longestChainDepths(g)).toThrow(/cycle/);
  });
});

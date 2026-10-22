#!/usr/bin/env node
/**
 * CLI: sort a dependency graph described by a simple edge-list file.
 *
 * Usage:
 *   toposort <file> [--levels] [--dfs]
 *
 * File format (one edge per line, comments with #):
 *   A -> B        # A runs before B
 *
 *   toposort order.txt           # prints a valid topological order
 *   toposort order.txt --levels  # prints parallel execution levels
 *   toposort order.txt --dfs     # use the iterative DFS variant
 */
import { readFileSync } from "fs";
import {
  CycleError,
  DirectedGraph,
  computeLevels,
  findCycle,
  topologicalSort,
  topologicalSortDFS,
} from "./index";

function parseFile(path: string): DirectedGraph {
  const graph = new DirectedGraph();
  const text = readFileSync(path, "utf8");
  text.split("\n").forEach((raw, i) => {
    const line = raw.split("#")[0].trim();
    if (!line) return;
    const match = line.match(/^(.+?)\s*->\s*(.+)$/);
    if (!match) {
      console.error(`error: line ${i + 1}: expected "A -> B", got "${raw.trim()}"`);
      process.exit(2);
    }
    graph.addEdge(match[1].trim(), match[2].trim());
  });
  return graph;
}

function main(): void {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: toposort <file> [--levels] [--dfs]");
    process.exit(2);
  }

  let graph: DirectedGraph;
  try {
    graph = parseFile(file);
  } catch (err) {
    console.error(`error: cannot read "${file}": ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    if (args.includes("--levels")) {
      const levels = computeLevels(graph);
      levels.forEach((level, i) => {
        console.log(`level ${i}: ${level.join(", ")}`);
      });
    } else if (args.includes("--dfs")) {
      console.log(topologicalSortDFS(graph).join(" -> "));
    } else {
      console.log(topologicalSort(graph).join(" -> "));
    }
  } catch (err) {
    if (err instanceof CycleError) {
      const cycle = findCycle(graph)!;
      console.error(`error: dependency cycle: ${cycle.join(" -> ")}`);
      process.exit(3);
    }
    throw err;
  }
}

main();

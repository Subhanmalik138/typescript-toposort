# typescript-toposort

A small, sharp TypeScript toolkit for dependency graphs: deterministic topological sorting, cycle detection that tells you *where* the cycle is, parallel execution levels, and transitive dependency analysis. The kind of thing that quietly powers build systems, task schedulers, and package managers.

## Why this exists

Ordering tasks by dependency is everywhere — CI pipelines, database migrations, plugin loading, course prerequisites. A plain DFS sort usually stops at "there's a cycle somewhere". This library answers the follow-up questions too: which nodes form the cycle, which steps can run in parallel, and what's the critical-path depth of every node.

## Quick start

```bash
npm install
npm run build
```

```ts
import {
  graphFromDependencies,
  topologicalSort,
  computeLevels,
  CycleError,
} from "./dist/index";

const graph = graphFromDependencies({
  app: ["api", "db"],
  api: ["db"],
  worker: ["db"],
});

try {
  console.log(topologicalSort(graph)); // [ 'db', 'api', 'worker', 'app' ]
  console.log(computeLevels(graph));   // [ [ 'db' ], [ 'api', 'worker' ], [ 'app' ] ]
} catch (err) {
  if (err instanceof CycleError) {
    console.error("blocked by cycle:", err.cycle.join(" -> "));
  }
}
```

## CLI

Sort an edge-list file directly (edge `A -> B` means A runs before B):

```bash
npm run cli -- examples/build-order.txt
npm run cli -- examples/build-order.txt --levels   # parallel execution levels
npm run cli -- examples/build-order.txt --dfs      # iterative-DFS variant
```

```text
$ npm run cli -- examples/build-order.txt --levels
level 0: compile-assets
level 1: compile, lint
level 2: test
level 3: package
```

A cyclic input exits with code 3 and prints the concrete cycle path.

## API

| Export | What it does |
|---|---|
| `DirectedGraph` | Mutable graph; string or numeric node ids; duplicate edges are no-ops |
| `topologicalSort(graph, options?)` | Kahn's algorithm, O(V + E); throws `CycleError` on cycles |
| `topologicalSortDFS(graph)` | Iterative DFS variant — no recursion, safe on 50k+ deep chains |
| `findCycle(graph)` / `hasCycle(graph)` / `isDAG(graph)` | Cycle queries; `findCycle` returns one concrete path |
| `computeLevels(graph)` | Maximally parallel groups (level 0 = no prerequisites) |
| `transitiveDependencies` / `transitiveDependents` | Full upstream/downstream reachability |
| `longestChainDepths(graph)` | Longest dependency chain ending at each node (critical-path depth) |
| `CycleError` | Error carrying the offending `cycle` path |
| `graphFromEdges` / `graphFromDependencies` | Convenient graph builders |

## Design decisions

1. **Deterministic output.** Real topological order isn't unique, but non-deterministic tools are painful to debug. Ties are broken by a configurable comparator (numeric-then-lexicographic by default), so the same graph always yields the same order regardless of insertion order.
2. **Two sort algorithms, not one.** Kahn's algorithm is the default: iterative, O(V + E), and cycle detection falls out naturally (any unplaced node is in or behind a cycle). The iterative DFS variant exists for very deep chains — recursion would overflow the call stack at tens of thousands of nodes.
3. **Cycles are reported, not just detected.** `CycleError` carries the concrete cycle path (`a -> b -> c -> a`) and the CLI prints it, because "cycle detected" without the path is useless in a 500-node migration graph.
4. **Node ids stay flexible.** The graph normalizes ids internally (`Map<string, Set<string>>` for O(1) edge checks) but preserves the original `string | number` values, so API output reads naturally.
5. **Levels are maximally parallel.** `computeLevels` is a layered Kahn variant: everything in one level has all prerequisites in earlier levels, so a scheduler can fan the whole level out to workers safely.

## Running tests

```bash
npm test
```

25 tests cover sorting validity on diamonds and long chains, determinism under insertion reordering, cycle-path reporting (including self-loops), the 50k-node iterative-DFS stack-safety case, level grouping, transitive reachability, and critical-path depths.

## Tech stack

TypeScript 5 (strict mode), ts-jest for tests, zero runtime dependencies.

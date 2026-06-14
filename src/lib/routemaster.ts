// RouteMaster pathfinding logic
// Grid cells: 0 walkable, 1 obstacle, 2 target
// Movement: 4-directional. Goal: shortest path visiting all targets from start.

export type Cell = [number, number]; // [row, col]
export interface RouteInput {
  grid: number[][];
  start: Cell;
  targets: Cell[];
}
export interface RouteOutput {
  total_steps: number;
  path: Cell[];
  target_reached: boolean;
  execution_time_ms: number;
}

// BFS shortest path between two cells. Returns path inclusive of both ends, or null.
function bfs(grid: number[][], start: Cell, end: Cell): Cell[] | null {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const [sr, sc] = start;
  const [er, ec] = end;
  if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) return null;
  if (er < 0 || er >= rows || ec < 0 || ec >= cols) return null;
  if (grid[sr][sc] === 1 || grid[er][ec] === 1) return null;
  if (sr === er && sc === ec) return [[sr, sc]];

  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: (Cell | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue: Cell[] = [[sr, sc]];
  visited[sr][sc] = true;
  const dirs: Cell[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr][nc]) continue;
      if (grid[nr][nc] === 1) continue;
      visited[nr][nc] = true;
      parent[nr][nc] = [r, c];
      if (nr === er && nc === ec) {
        // reconstruct
        const path: Cell[] = [];
        let cur: Cell | null = [nr, nc];
        while (cur) {
          path.push(cur);
          cur = parent[cur[0]][cur[1]];
        }
        return path.reverse();
      }
      queue.push([nr, nc]);
    }
  }
  return null;
}

// Visit all targets. For small target counts (<=8), try all permutations to find true optimum.
// Otherwise use nearest-neighbor heuristic on BFS distances.
export function solveRoute(input: RouteInput): RouteOutput {
  const t0 = performance.now();
  const { grid, start, targets } = input;

  if (!targets || targets.length === 0) {
    return {
      total_steps: 0,
      path: [start],
      target_reached: true,
      execution_time_ms: +(performance.now() - t0).toFixed(3),
    };
  }

  // Precompute BFS paths between every pair (start + targets)
  const points: Cell[] = [start, ...targets];
  const n = points.length;
  const pathCache: (Cell[] | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) { pathCache[i][j] = [points[i]]; continue; }
      pathCache[i][j] = bfs(grid, points[i], points[j]);
    }
  }

  // Check reachability
  for (let j = 1; j < n; j++) {
    if (!pathCache[0][j]) {
      return {
        total_steps: 0,
        path: [start],
        target_reached: false,
        execution_time_ms: +(performance.now() - t0).toFixed(3),
      };
    }
  }

  const targetIdxs = Array.from({ length: targets.length }, (_, i) => i + 1);
  let bestOrder: number[] = [];
  let bestCost = Infinity;

  if (targets.length <= 8) {
    // permutations
    const permute = (arr: number[], start = 0) => {
      if (start === arr.length) {
        let cost = 0;
        let prev = 0;
        for (const idx of arr) {
          const seg = pathCache[prev][idx];
          if (!seg) { cost = Infinity; break; }
          cost += seg.length - 1;
          prev = idx;
        }
        if (cost < bestCost) { bestCost = cost; bestOrder = [...arr]; }
        return;
      }
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(arr, start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    };
    permute([...targetIdxs]);
  } else {
    // nearest neighbor
    const remaining = new Set(targetIdxs);
    let cur = 0;
    let cost = 0;
    while (remaining.size) {
      let bestN = -1, bestD = Infinity;
      for (const j of remaining) {
        const seg = pathCache[cur][j];
        if (!seg) continue;
        const d = seg.length - 1;
        if (d < bestD) { bestD = d; bestN = j; }
      }
      if (bestN < 0) break;
      bestOrder.push(bestN);
      cost += bestD;
      cur = bestN;
      remaining.delete(bestN);
    }
    bestCost = cost;
  }

  // Stitch full path
  const fullPath: Cell[] = [start];
  let prev = 0;
  for (const idx of bestOrder) {
    const seg = pathCache[prev][idx]!;
    for (let k = 1; k < seg.length; k++) fullPath.push(seg[k]);
    prev = idx;
  }

  return {
    total_steps: fullPath.length - 1,
    path: fullPath,
    target_reached: true,
    execution_time_ms: +(performance.now() - t0).toFixed(3),
  };
}

export function validateInput(raw: unknown): { ok: true; value: RouteInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Input must be a JSON object" };
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.grid)) return { ok: false, error: "'grid' must be a 2D array" };
  const grid = o.grid as unknown[];
  if (!grid.length || !Array.isArray(grid[0])) return { ok: false, error: "'grid' must be non-empty 2D array" };
  const cols = (grid[0] as unknown[]).length;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== cols) return { ok: false, error: "All grid rows must have equal length" };
    for (const v of row) if (v !== 0 && v !== 1 && v !== 2) return { ok: false, error: "Grid values must be 0, 1, or 2" };
  }
  if (!Array.isArray(o.start) || o.start.length !== 2) return { ok: false, error: "'start' must be [row, col]" };
  if (!Array.isArray(o.targets)) return { ok: false, error: "'targets' must be an array of [row, col]" };
  for (const t of o.targets) {
    if (!Array.isArray(t) || t.length !== 2) return { ok: false, error: "Each target must be [row, col]" };
  }
  return { ok: true, value: { grid: o.grid as number[][], start: o.start as Cell, targets: o.targets as Cell[] } };
}
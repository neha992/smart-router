import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Copy, RotateCcw, Package, MapPin, AlertTriangle, CheckCircle2, Clock, Footprints } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { solveRoute, validateInput, type RouteInput, type RouteOutput } from "@/lib/routemaster";

const SAMPLE: RouteInput = {
  grid: [
    [0, 0, 0, 0, 1, 0, 0, 0],
    [1, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 2, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 1, 0, 1],
    [0, 0, 0, 0, 2, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 2],
  ],
  start: [0, 0],
  targets: [[4, 2], [6, 4], [7, 7]],
};

const RouteMaster = () => {
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE, null, 2));
  const [input, setInput] = useState<RouteInput>(SAMPLE);
  const [output, setOutput] = useState<RouteOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pathSet = useMemo(() => {
    const map = new Map<string, number>();
    output?.path.forEach((c, i) => map.set(`${c[0]},${c[1]}`, i));
    return map;
  }, [output]);

  const handleRun = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const v = validateInput(parsed);
      if (v.ok === false) {
        setError(v.error); setOutput(null); toast.error(v.error); return;
      }
      setInput(v.value);
      const result = solveRoute(v.value);
      setOutput(result);
      setError(null);
      if (result.target_reached) toast.success(`Path found in ${result.total_steps} steps`);
      else toast.error("One or more targets unreachable");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg); setOutput(null); toast.error(msg);
    }
  };

  const handleReset = () => {
    setJsonText(JSON.stringify(SAMPLE, null, 2));
    setInput(SAMPLE);
    setOutput(null);
    setError(null);
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast.success("Output JSON copied");
  };

  const rows = input.grid.length;
  const cols = input.grid[0]?.length ?? 0;
  const startKey = `${input.start[0]},${input.start[1]}`;
  const targetKeys = new Set(input.targets.map(t => `${t[0]},${t[1]}`));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-xl sticky top-0 z-50 bg-background/70">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center">
              <Package className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-none">RouteMaster</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Warehouse Order Picker · BFS Pathfinding</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">N×M Grid</span>
            <span className="px-2 py-1 rounded bg-muted">4-directional</span>
            <span className="px-2 py-1 rounded bg-muted">Multi-Target TSP</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input */}
        <section className="lg:col-span-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">Input JSON</h2>
              <Button size="sm" variant="ghost" onClick={handleReset}><RotateCcw className="w-3.5 h-3.5" /></Button>
            </div>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-xs min-h-[320px] resize-y"
              spellCheck={false}
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={handleRun} className="flex-1"><Play className="w-4 h-4" /> Calculate Route</Button>
            </div>
            {error && (
              <div className="mt-3 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Legend</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-muted border border-border" /> Walkable (0)</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-foreground/80" /> Obstacle / Shelf (1)</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-amber-400" /> Target Item (2)</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-emerald-500" /> Start</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-neon-cyan/60" /> Calculated Path</div>
            </div>
          </Card>
        </section>

        {/* Middle: Grid */}
        <section className="lg:col-span-5">
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">Warehouse Grid</h2>
              <span className="text-xs text-muted-foreground">{rows} × {cols}</span>
            </div>
            <div
              className="grid gap-[2px] mx-auto"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                maxWidth: `${Math.min(cols * 44, 480)}px`,
              }}
            >
              {input.grid.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const isStart = key === startKey;
                  const isTarget = targetKeys.has(key) || cell === 2;
                  const isObstacle = cell === 1;
                  const pathOrder = pathSet.get(key);
                  const onPath = pathOrder !== undefined && !isStart;
                  let cls = "bg-muted border border-border/40";
                  if (isObstacle) cls = "bg-foreground/80";
                  else if (onPath && !isTarget) cls = "bg-neon-cyan/40 border border-neon-cyan/60";
                  if (isTarget) cls = "bg-amber-400 border border-amber-500";
                  if (isStart) cls = "bg-emerald-500 border border-emerald-600";
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: onPath ? (pathOrder! * 0.02) : 0, duration: 0.2 }}
                      className={`aspect-square rounded-sm flex items-center justify-center text-[10px] font-bold ${cls}`}
                      title={`(${r}, ${c})`}
                    >
                      {isStart && <MapPin className="w-3 h-3 text-background" />}
                      {isTarget && !isStart && <Package className="w-3 h-3 text-background" />}
                      {onPath && !isTarget && <span className="text-foreground/60">·</span>}
                    </motion.div>
                  );
                })
              )}
            </div>
          </Card>
        </section>

        {/* Right: Output */}
        <section className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Footprints className="w-3.5 h-3.5" /> Steps</div>
              <p className="font-display text-2xl font-bold mt-1">{output?.total_steps ?? "—"}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Clock className="w-3.5 h-3.5" /> Time</div>
              <p className="font-display text-2xl font-bold mt-1">{output ? `${output.execution_time_ms}` : "—"}<span className="text-xs ml-1 text-muted-foreground">ms</span></p>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              {output?.target_reached ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-sm">All targets reached</span></>
              ) : output ? (
                <><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm">Targets unreachable</span></>
              ) : (
                <span className="text-sm text-muted-foreground">Run to see status</span>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">Output JSON</h3>
              <Button size="sm" variant="ghost" onClick={handleCopyOutput} disabled={!output}><Copy className="w-3.5 h-3.5" /></Button>
            </div>
            <pre className="text-[11px] font-mono bg-muted/40 p-3 rounded-md overflow-auto max-h-[360px] leading-relaxed">
{output ? JSON.stringify(output, null, 2) : "// Click Calculate Route"}
            </pre>
          </Card>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
        RouteMaster · BFS shortest-path · Multi-target order via permutation search (≤8 targets) or nearest-neighbor heuristic
      </footer>
    </div>
  );
};

export default RouteMaster;
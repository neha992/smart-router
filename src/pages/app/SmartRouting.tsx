import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, ShieldCheck, AlertTriangle, Brain, Cpu, Gauge,
  Radio, RefreshCw, TrendingUp, CircuitBoard, Play, Pause, CheckCircle2, XCircle,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, RadialBarChart, RadialBar, BarChart, Bar,
} from "recharts";
import { formatINR } from "@/lib/utils";

// ---------------- Types ----------------
interface Gateway {
  id: string;
  name: string;
  baseSuccess: number;     // 0-1
  baseLatency: number;     // ms
  baseFeePct: number;      // %
  settlementMin: number;   // minutes
  fraudShield: number;     // 0-1 higher = safer
  load: number;            // 0-1 server load (dynamic)
  online: boolean;
  liveSuccess: number;
  liveLatency: number;
}

interface LogEntry {
  id: string;
  ts: number;
  level: "info" | "warn" | "error" | "heal";
  msg: string;
}

interface SimTx {
  id: string;
  amount: number;
  priority: "high" | "medium" | "low";
  riskScore: number;
  attempts: { gateway: string; outcome: "success" | "fail"; reason?: string; latency: number }[];
  status: "routing" | "success" | "failed";
  finalGateway?: string;
  score?: number;
}

// ---------------- Initial Gateways ----------------
const INITIAL_GATEWAYS: Gateway[] = [
  { id: "rzp", name: "RazorPay",  baseSuccess: 0.978, baseLatency: 220, baseFeePct: 1.8, settlementMin: 2,  fraudShield: 0.92, load: 0.42, online: true, liveSuccess: 0.978, liveLatency: 220 },
  { id: "str", name: "Stripe",    baseSuccess: 0.971, baseLatency: 310, baseFeePct: 2.4, settlementMin: 4,  fraudShield: 0.95, load: 0.55, online: true, liveSuccess: 0.971, liveLatency: 310 },
  { id: "pyu", name: "PayU",      baseSuccess: 0.935, baseLatency: 410, baseFeePct: 1.4, settlementMin: 6,  fraudShield: 0.84, load: 0.61, online: true, liveSuccess: 0.935, liveLatency: 410 },
  { id: "cfr", name: "Cashfree",  baseSuccess: 0.965, baseLatency: 260, baseFeePct: 1.6, settlementMin: 3,  fraudShield: 0.88, load: 0.38, online: true, liveSuccess: 0.965, liveLatency: 260 },
  { id: "pyp", name: "Paypal",    baseSuccess: 0.958, baseLatency: 380, baseFeePct: 2.9, settlementMin: 5,  fraudShield: 0.97, load: 0.47, online: true, liveSuccess: 0.958, liveLatency: 380 },
];

// ---------------- Scoring Engine ----------------
/**
 * Weighted scoring 0–100. Higher is better.
 * Weights tuned per transaction priority and risk.
 */
function scoreGateway(g: Gateway, tx: { amount: number; priority: SimTx["priority"]; riskScore: number }) {
  if (!g.online) return { score: 0, breakdown: null as null | Record<string, number> };

  const successPts = g.liveSuccess * 100;                                  // 0–100
  const latencyPts = Math.max(0, 100 - g.liveLatency / 6);                  // <600ms ~ 0
  const settlePts  = Math.max(0, 100 - g.settlementMin * 8);                // faster better
  const costPts    = Math.max(0, 100 - g.baseFeePct * 25);                  // cheaper better
  const fraudPts   = g.fraudShield * 100;
  const loadPts    = (1 - g.load) * 100;

  let w = { success: 0.30, latency: 0.15, settle: 0.10, cost: 0.15, fraud: 0.20, load: 0.10 };
  if (tx.priority === "high")  w = { success: 0.30, latency: 0.30, settle: 0.15, cost: 0.05, fraud: 0.15, load: 0.05 };
  if (tx.priority === "low")   w = { success: 0.20, latency: 0.05, settle: 0.05, cost: 0.45, fraud: 0.15, load: 0.10 };
  if (tx.riskScore > 0.6)      w = { success: 0.25, latency: 0.10, settle: 0.10, cost: 0.05, fraud: 0.40, load: 0.10 };

  const score =
    successPts * w.success +
    latencyPts * w.latency +
    settlePts  * w.settle  +
    costPts    * w.cost    +
    fraudPts   * w.fraud   +
    loadPts    * w.load;

  return {
    score: Math.round(score * 10) / 10,
    breakdown: {
      Success: Math.round(successPts),
      Latency: Math.round(latencyPts),
      Settle:  Math.round(settlePts),
      Cost:    Math.round(costPts),
      Fraud:   Math.round(fraudPts),
      Load:    Math.round(loadPts),
    },
  };
}

// ---------------- ML-ish Failure Prediction ----------------
function predictFailure(g: Gateway) {
  // pseudo logistic combining load, latency, success drop
  const successDrop = Math.max(0, g.baseSuccess - g.liveSuccess);
  const latencyStress = Math.min(1, g.liveLatency / 800);
  const loadStress = g.load;
  const timeoutRisk   = Math.min(0.98, 0.15 * latencyStress + 0.45 * loadStress + 0.25 * successDrop * 10);
  const gatewayFail   = Math.min(0.98, 0.10 + 0.5 * successDrop * 12 + 0.25 * loadStress);
  const settleDelay   = Math.min(0.98, 0.10 + 0.4 * loadStress + 0.2 * (g.settlementMin / 10));
  const confidence    = 0.78 + 0.20 * (1 - loadStress); // model confidence
  return {
    timeoutRisk: Math.round(timeoutRisk * 100),
    gatewayFail: Math.round(gatewayFail * 100),
    settleDelay: Math.round(settleDelay * 100),
    confidence: Math.round(confidence * 100),
  };
}

// ---------------- Helpers ----------------
const randId = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const PRIORITY_STYLES: Record<SimTx["priority"], string> = {
  high:   "bg-red-500/15 text-red-300 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

// ---------------- Component ----------------
const SmartRouting = () => {
  const [gateways, setGateways] = useState<Gateway[]>(INITIAL_GATEWAYS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [txHistory, setTxHistory] = useState<SimTx[]>([]);
  const [throughput, setThroughput] = useState<{ t: string; ok: number; fail: number; tps: number }[]>(
    Array.from({ length: 12 }).map((_, i) => ({ t: `${i}s`, ok: 0, fail: 0, tps: 0 }))
  );
  const [running, setRunning] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<string>("rzp");
  const tickRef = useRef(0);

  // Add log helper
  const pushLog = (level: LogEntry["level"], msg: string) => {
    setLogs(prev => [{ id: randId(), ts: Date.now(), level, msg }, ...prev].slice(0, 60));
  };

  // --------- Live gateway telemetry (jitter, occasional outage) ---------
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setGateways(prev => prev.map(g => {
        // Random load fluctuation
        const load = clamp(g.load + (Math.random() - 0.5) * 0.12, 0.05, 0.98);
        // Latency drifts with load
        const liveLatency = clamp(g.baseLatency * (0.7 + load * 1.4) + (Math.random() - 0.5) * 60, 80, 1500);
        // Success rate degrades under heavy load
        const liveSuccess = clamp(g.baseSuccess - (load > 0.75 ? (load - 0.75) * 0.4 : 0) - Math.random() * 0.01, 0.5, 0.999);

        // Outage simulation: 0.6% chance for offline flip
        let online = g.online;
        if (g.online && Math.random() < 0.006) {
          online = false;
          pushLog("error", `${g.name} went OFFLINE — server downtime detected`);
        } else if (!g.online && Math.random() < 0.18) {
          online = true;
          pushLog("heal", `${g.name} recovered — back ONLINE`);
        }

        return { ...g, load, liveLatency, liveSuccess, online };
      }));
    }, 1500);
    return () => clearInterval(t);
  }, [running]);

  // --------- Demo transaction simulator ---------
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      tickRef.current += 1;
      const tx: SimTx = {
        id: "TX-" + randId(),
        amount: Math.round(500 + Math.random() * 95000),
        priority: (["high", "medium", "low"] as const)[Math.floor(Math.random() * 3)],
        riskScore: Math.round(Math.random() * 100) / 100,
        attempts: [],
        status: "routing",
      };

      // Rank gateways
      setGateways(currentGateways => {
        const ranked = currentGateways
          .map(g => ({ g, ...scoreGateway(g, tx) }))
          .sort((a, b) => b.score - a.score);

        // Try gateways in order until success (max 3 attempts = self-healing failover)
        let finalStatus: SimTx["status"] = "failed";
        let finalGw: Gateway | undefined;
        for (let i = 0; i < Math.min(3, ranked.length); i++) {
          const cand = ranked[i].g;
          // Effective success considering risk
          const adj = cand.liveSuccess - (tx.riskScore > 0.7 ? 0.10 : tx.riskScore > 0.4 ? 0.03 : 0);
          const ok = Math.random() < adj && cand.online;
          tx.attempts.push({
            gateway: cand.name,
            outcome: ok ? "success" : "fail",
            reason: !cand.online ? "OFFLINE" : !ok ? (Math.random() > 0.5 ? "TIMEOUT" : "DECLINED") : undefined,
            latency: Math.round(cand.liveLatency),
          });
          if (ok) { finalStatus = "success"; finalGw = cand; break; }
          if (i === 0) pushLog("warn", `${tx.id} failed on ${cand.name} — failing over to ${ranked[i + 1]?.g.name}`);
          else pushLog("warn", `${tx.id} retry on ${cand.name} unsuccessful`);
        }

        tx.status = finalStatus;
        tx.finalGateway = finalGw?.name;
        tx.score = ranked[0].score;
        if (finalStatus === "success") pushLog("info", `${tx.id} routed via ${finalGw!.name} • ${formatINR(tx.amount)} • score ${ranked[0].score}`);
        else pushLog("error", `${tx.id} FAILED after retries • ${formatINR(tx.amount)}`);

        setTxHistory(prev => [tx, ...prev].slice(0, 40));
        return currentGateways;
      });
    }, 2200);
    return () => clearInterval(t);
  }, [running]);

  // --------- Throughput series ---------
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setThroughput(prev => {
        const window = txHistory.slice(0, 6);
        const ok = window.filter(x => x.status === "success").length;
        const fail = window.filter(x => x.status === "failed").length;
        const next = [...prev.slice(1), { t: `${tickRef.current}s`, ok, fail, tps: ok + fail }];
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, [running, txHistory]);

  // ---------------- Derived ----------------
  const ranked = useMemo(() => {
    const dummyTx = { amount: 5000, priority: "medium" as const, riskScore: 0.3 };
    return gateways
      .map(g => ({ g, ...scoreGateway(g, dummyTx), pred: predictFailure(g) }))
      .sort((a, b) => b.score - a.score);
  }, [gateways]);

  const aiPick = ranked[0];
  const overallSuccess = txHistory.length
    ? Math.round((txHistory.filter(t => t.status === "success").length / txHistory.length) * 1000) / 10
    : 0;
  const avgLatency = txHistory.length
    ? Math.round(txHistory.reduce((s, t) => s + (t.attempts.reduce((a, b) => a + b.latency, 0) / Math.max(1, t.attempts.length)), 0) / txHistory.length)
    : 0;

  const selected = ranked.find(r => r.g.id === selectedGateway) ?? ranked[0];

  // ---------------- UI ----------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-neon-cyan/20 bg-gradient-to-br from-background via-card/40 to-background p-5">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(600px 200px at 10% 0%, hsl(var(--neon-cyan)/0.15), transparent), radial-gradient(600px 200px at 90% 100%, hsl(var(--neon-purple)/0.15), transparent)" }} />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CircuitBoard className="w-5 h-5 text-neon-cyan" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan/80">SmartSettle Core</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Routing Analyzer</h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Real-time AI scoring across {gateways.length} gateways with predictive failure detection & self-healing failover.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRunning(r => !r)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                running ? "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan" : "bg-muted/20 border-border/30 text-muted-foreground"
              }`}>
              {running ? <><Pause className="w-3.5 h-3.5"/>Live</> : <><Play className="w-3.5 h-3.5"/>Paused</>}
              {running && <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"/>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<Activity className="w-4 h-4"/>} label="Live TPS"
          value={`${throughput[throughput.length - 1]?.tps ?? 0}/s`} accent="neon-cyan"/>
        <KPI icon={<CheckCircle2 className="w-4 h-4"/>} label="Success Rate"
          value={`${overallSuccess}%`} accent="neon-green"/>
        <KPI icon={<Gauge className="w-4 h-4"/>} label="Avg Latency"
          value={`${avgLatency}ms`} accent="neon-blue"/>
        <KPI icon={<Brain className="w-4 h-4"/>} label="AI Pick"
          value={aiPick?.g.name ?? "—"} accent="neon-purple"/>
      </div>

      {/* AI Recommendation panel */}
      {aiPick && (
        <motion.div layout className="relative rounded-2xl border border-neon-purple/30 bg-gradient-to-r from-neon-purple/10 via-neon-cyan/5 to-transparent p-4 overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-neon-purple"/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-wider text-neon-purple font-semibold">AI Recommendation</span>
                <span className="text-[9px] text-muted-foreground">model confidence {aiPick.pred.confidence}%</span>
              </div>
              <p className="text-sm text-foreground">
                Route next transaction through <span className="font-bold text-neon-cyan">{aiPick.g.name}</span> —
                composite score <span className="font-mono text-neon-green">{aiPick.score}/100</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {aiPick.g.liveLatency.toFixed(0)}ms latency · {(aiPick.g.liveSuccess * 100).toFixed(1)}% success ·
                {" "}{aiPick.g.baseFeePct}% fee · settlement ~{aiPick.g.settlementMin} min
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gateway Health Grid */}
      <Section title="Gateway Health & Route Scores" icon={<Radio className="w-4 h-4 text-neon-cyan"/>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranked.map(({ g, score, pred }, i) => (
            <motion.button
              layout key={g.id}
              onClick={() => setSelectedGateway(g.id)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`text-left rounded-xl p-3 border backdrop-blur-md transition-all relative overflow-hidden ${
                selectedGateway === g.id ? "border-neon-cyan/60 bg-neon-cyan/5" : "border-border/30 bg-card/40 hover:border-border/60"
              } ${!g.online ? "opacity-60" : ""}`}>
              {/* score gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, hsl(var(--neon-green)) 0%, hsl(var(--neon-cyan)) ${score}%, transparent ${score}%)` }}/>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${g.online ? "bg-neon-green animate-pulse" : "bg-red-500"}`}/>
                  <span className="text-xs font-bold text-foreground">{g.name}</span>
                  {i === 0 && g.online && <span className="text-[8px] px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple font-semibold">AI PICK</span>}
                </div>
                <span className="font-mono text-sm font-bold text-neon-cyan">{score}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <Mini label="Success" value={`${(g.liveSuccess * 100).toFixed(1)}%`}/>
                <Mini label="Latency" value={`${g.liveLatency.toFixed(0)}ms`}/>
                <Mini label="Load" value={`${(g.load * 100).toFixed(0)}%`}/>
                <Mini label="Fee" value={`${g.baseFeePct}%`}/>
                <Mini label="Settle" value={`${g.settlementMin}m`}/>
                <Mini label="Shield" value={`${(g.fraudShield * 100).toFixed(0)}%`}/>
              </div>
              {/* prediction strip */}
              <div className="mt-2 pt-2 border-t border-border/20 flex items-center gap-2 text-[9px]">
                <span className="text-muted-foreground">Fail risk</span>
                <span className={`font-mono ${pred.gatewayFail > 40 ? "text-red-400" : pred.gatewayFail > 20 ? "text-amber-400" : "text-neon-green"}`}>
                  {pred.gatewayFail}%
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Live Throughput" icon={<TrendingUp className="w-4 h-4 text-neon-blue"/>}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={throughput}>
              <defs>
                <linearGradient id="okg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="failg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border)/0.2)" strokeDasharray="3 3"/>
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}/>
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}/>
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}/>
              <Area type="monotone" dataKey="ok" stroke="hsl(var(--neon-cyan))" strokeWidth={2} fill="url(#okg)"/>
              <Area type="monotone" dataKey="fail" stroke="#ef4444" strokeWidth={2} fill="url(#failg)"/>
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Gateway Load Heatmap" icon={<Cpu className="w-4 h-4 text-neon-purple"/>}>
          <div className="space-y-2 pt-1">
            {gateways.map(g => (
              <div key={g.id} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 truncate">{g.name}</span>
                <div className="flex-1 h-4 rounded-md bg-muted/15 overflow-hidden relative">
                  <motion.div
                    animate={{ width: `${g.load * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full ${g.load > 0.8 ? "bg-red-500/70" : g.load > 0.55 ? "bg-amber-400/70" : "bg-neon-green/70"}`}/>
                </div>
                <span className="text-[10px] font-mono w-10 text-right text-foreground">{(g.load*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Selected gateway ML predictions */}
      {selected && (
        <Section title={`ML Failure Forecast • ${selected.g.name}`} icon={<Brain className="w-4 h-4 text-neon-purple"/>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PredictionGauge label="Timeout Risk" value={selected.pred.timeoutRisk} color="hsl(0 84% 60%)"/>
            <PredictionGauge label="Gateway Failure" value={selected.pred.gatewayFail} color="hsl(38 92% 50%)"/>
            <PredictionGauge label="Settlement Delay" value={selected.pred.settleDelay} color="hsl(var(--neon-blue))"/>
          </div>
          {selected.breakdown && (
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={Object.entries(selected.breakdown).map(([k, v]) => ({ k, v }))}>
                  <CartesianGrid stroke="hsl(var(--border)/0.15)" strokeDasharray="3 3"/>
                  <XAxis dataKey="k" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}/>
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]}/>
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}/>
                  <Bar dataKey="v" fill="hsl(var(--neon-cyan))" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground text-center">Score component breakdown (out of 100)</p>
            </div>
          )}
        </Section>
      )}

      {/* Live Transactions + Failover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Live Transactions" icon={<Zap className="w-4 h-4 text-neon-cyan"/>}>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {txHistory.slice(0, 12).map(tx => (
                <motion.div key={tx.id}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0 }}
                  className="p-2 rounded-lg bg-muted/10 border border-border/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {tx.status === "success"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-neon-green shrink-0"/>
                        : tx.status === "failed"
                          ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0"/>
                          : <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0"/>}
                      <span className="font-mono text-[10px] text-foreground">{tx.id}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold uppercase ${PRIORITY_STYLES[tx.priority]}`}>{tx.priority}</span>
                    </div>
                    <span className="text-[10px] font-mono text-foreground">{formatINR(tx.amount)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 flex-wrap text-[9px]">
                    {tx.attempts.map((a, idx) => (
                      <span key={idx} className={`px-1.5 py-0.5 rounded ${a.outcome === "success" ? "bg-neon-green/15 text-neon-green" : "bg-red-500/15 text-red-300"}`}>
                        {a.gateway}{a.reason ? `·${a.reason}` : ""}·{a.latency}ms
                        {idx < tx.attempts.length - 1 && " →"}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {txHistory.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">Waiting for transactions…</p>
            )}
          </div>
        </Section>

        <Section title="System Logs & Failover Activity" icon={<ShieldCheck className="w-4 h-4 text-neon-green"/>}>
          <div className="space-y-1 max-h-80 overflow-y-auto font-mono text-[10px] pr-1">
            <AnimatePresence initial={false}>
              {logs.map(l => (
                <motion.div key={l.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className={`px-2 py-1 rounded border-l-2 ${
                    l.level === "error" ? "border-red-500 bg-red-500/5 text-red-300" :
                    l.level === "warn"  ? "border-amber-500 bg-amber-500/5 text-amber-200" :
                    l.level === "heal"  ? "border-neon-green bg-neon-green/5 text-neon-green" :
                                          "border-neon-cyan/50 bg-neon-cyan/5 text-foreground"
                  }`}>
                  <span className="text-muted-foreground mr-1">[{new Date(l.ts).toLocaleTimeString()}]</span>
                  {l.msg}
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No events yet…</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

// ---------------- Sub components ----------------
const KPI = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-md p-3 relative overflow-hidden">
    <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-30`} style={{ background: `hsl(var(--${accent}))` }}/>
    <div className="relative">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider`} style={{ color: `hsl(var(--${accent}))` }}>
        {icon}<span>{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground mt-1 truncate">{value}</p>
    </div>
  </motion.div>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-4">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h2>
    </div>
    {children}
  </div>
);

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded bg-muted/15 px-1.5 py-1">
    <p className="text-[8px] text-muted-foreground uppercase">{label}</p>
    <p className="text-[10px] font-mono text-foreground">{value}</p>
  </div>
);

const PredictionGauge = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="relative rounded-xl bg-muted/10 border border-border/20 p-3 flex items-center gap-3">
      <div className="w-20 h-20 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "hsl(var(--muted)/0.2)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-xs font-semibold mt-1 ${value > 60 ? "text-red-400" : value > 30 ? "text-amber-400" : "text-neon-green"}`}>
          {value > 60 ? "High" : value > 30 ? "Moderate" : "Low"}
        </p>
      </div>
    </div>
  );
};

export default SmartRouting;
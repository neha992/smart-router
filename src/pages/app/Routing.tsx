import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Clock, DollarSign, Play, ArrowRight, CheckCircle2, XCircle,
  Loader2, Timer, Info, HelpCircle, TrendingUp
} from "lucide-react";
import { runRouting, type RoutingResult, type Transaction, type Assignment, DEFAULT_CHANNELS } from "@/lib/routing-engine";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/hooks/usePayments";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

// Sample transactions used as a fallback demo when the user has no real payments yet
const sampleTransactions: Transaction[] = [
  { tx_id: "TXN-A1", amount: 15000, arrival_time: 0, max_delay: 3, priority: 3, risk_score: 0.2 },
  { tx_id: "TXN-A2", amount: 45000, arrival_time: 1, max_delay: 5, priority: 2, risk_score: 0.5 },
  { tx_id: "TXN-A3", amount: 8000, arrival_time: 1, max_delay: 2, priority: 3, risk_score: 0.8 },
  { tx_id: "TXN-A4", amount: 3200, arrival_time: 2, max_delay: 10, priority: 1, risk_score: 0.1 },
  { tx_id: "TXN-A5", amount: 72000, arrival_time: 3, max_delay: 4, priority: 3, risk_score: 0.3 },
];

type TxStatus = "pending" | "processing" | "success" | "failed";

interface LiveTx {
  assignment: Assignment;
  status: TxStatus;
  progress: number;
}

const STATUS = {
  pending:    { icon: Timer,        color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Queued" },
  processing: { icon: Loader2,      color: "text-neon-cyan",  bg: "bg-neon-cyan/10",  label: "Routing..." },
  success:    { icon: CheckCircle2, color: "text-neon-green", bg: "bg-neon-green/10", label: "Settled" },
  failed:     { icon: XCircle,      color: "text-red-400",    bg: "bg-red-400/10",    label: "Failed" },
};

// Plain-English explanation of why this route was picked
function explainRoute(a: Assignment): string {
  if (a.failed) return a.fail_reason || "No suitable channel available";
  const ch = a.channel_name;
  if (ch === "FAST") return "Picked FAST — high priority, needs quick settlement";
  if (ch === "BULK") return "Picked BULK — large amount, lowest fees";
  if (ch === "STANDARD") return "Picked STANDARD — best balance of cost and speed";
  return "Best available route";
}

const Routing = () => {
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [running, setRunning] = useState(false);
  const [liveTxns, setLiveTxns] = useState<LiveTx[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mode, setMode] = useState<"real" | "demo">("real");
  const { payments, createPayment } = usePayments();
  const { createNotification } = useNotifications();

  // Build Transaction[] from the user's most recent real payments
  const realTransactions = useMemo<Transaction[]>(() => {
    const recent = payments.slice(0, 8);
    if (recent.length === 0) return [];
    const t0 = new Date(recent[recent.length - 1].created_at).getTime();
    return recent.map((p, idx) => {
      const arrival = Math.max(
        0,
        Math.round((new Date(p.created_at).getTime() - t0) / 60000) // minutes since first
      );
      const amt = Number(p.amount);
      const priority = amt > 20000 ? 3 : amt > 5000 ? 2 : 1;
      const risk = p.risk_score != null ? Math.min(1, Number(p.risk_score) / 100) : 0.2;
      return {
        tx_id: `PAY-${(p.id || "").slice(0, 4).toUpperCase() || idx}`,
        amount: amt,
        arrival_time: arrival,
        max_delay: priority === 3 ? 3 : priority === 2 ? 6 : 10,
        priority,
        risk_score: risk,
      };
    });
  }, [payments]);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setLiveTxns([]);
    setIsAnimating(false);

    const useReal = mode === "real" && realTransactions.length > 0;
    const txns = useReal ? realTransactions : sampleTransactions;

    setTimeout(async () => {
      const r = runRouting(txns);
      setResult(r);
      setRunning(false);

      const live: LiveTx[] = r.assignments.map(a => ({
        assignment: a, status: "pending", progress: 0,
      }));
      setLiveTxns(live);
      setIsAnimating(true);

      // Only persist new settlement records when running the demo set,
      // so analyzing your real payments doesn't duplicate them.
      if (!useReal) {
        for (const a of r.assignments) {
          if (!a.failed) {
            try {
              await createPayment({
                amount: a.amount,
                currency: "INR",
                recipient: `Settlement-${a.channel_name}`,
                gateway: a.channel_name || "auto",
                fee: a.total_cost,
                type: "settlement",
              });
            } catch { /* ignore */ }
          }
        }
      }

      // Create notification
      const successCount = r.assignments.filter(a => !a.failed).length;
      const failedCount = r.assignments.filter(a => a.failed).length;
      try {
        await createNotification({
          type: "settlement",
          title: useReal ? "Routing Analysis Complete" : "Routing Simulation Complete",
          message: `${successCount} routed successfully, ${failedCount} failed. Total cost: ${formatINR(r.total_system_cost_estimate, 2)}`,
        });
      } catch { /* ignore */ }

      toast.success(
        useReal
          ? `Analyzed ${txns.length} real payments: ${successCount} optimal, ${failedCount} risky`
          : `Demo done: ${successCount} settled, ${failedCount} failed`
      );
    }, 1200);
  }, [createPayment, createNotification, mode, realTransactions]);

  // Animate transaction status progression
  useEffect(() => {
    if (!isAnimating || liveTxns.length === 0) return;
    const timers: NodeJS.Timeout[] = [];
    liveTxns.forEach((_, idx) => {
      timers.push(setTimeout(() => {
        setLiveTxns(prev => prev.map((t, i) => i === idx ? { ...t, status: "processing", progress: 50 } : t));
      }, 400 + idx * 600));
      timers.push(setTimeout(() => {
        setLiveTxns(prev => prev.map((t, i) => i === idx ? {
          ...t, status: t.assignment.failed ? "failed" : "success", progress: 100,
        } : t));
      }, 1000 + idx * 600));
    });
    return () => timers.forEach(clearTimeout);
  }, [isAnimating, liveTxns.length]);

  const chIcon = (name: string) => {
    if (name === "FAST") return <Zap className="w-3.5 h-3.5 text-neon-blue" />;
    if (name === "STANDARD") return <Clock className="w-3.5 h-3.5 text-neon-cyan" />;
    return <DollarSign className="w-3.5 h-3.5 text-neon-purple" />;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header with help */}
      <div className="flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-foreground">
          Smart Routing
        </motion.h1>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/20 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How it works
        </button>
      </div>

      {/* Mode toggle: real payments vs demo */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/10 border border-border/20">
        <button
          onClick={() => setMode("real")}
          className={`py-2 rounded-lg text-xs font-medium transition-colors ${
            mode === "real" ? "bg-neon-cyan/20 text-neon-cyan" : "text-muted-foreground"
          }`}
        >
          My Payments {realTransactions.length > 0 && `(${realTransactions.length})`}
        </button>
        <button
          onClick={() => setMode("demo")}
          className={`py-2 rounded-lg text-xs font-medium transition-colors ${
            mode === "demo" ? "bg-neon-purple/20 text-neon-purple" : "text-muted-foreground"
          }`}
        >
          Demo (5 sample)
        </button>
      </div>
      {mode === "real" && realTransactions.length === 0 && (
        <p className="text-[11px] text-yellow-400/90 px-1">
          No payments yet — send a payment first or switch to Demo to see how routing works.
        </p>
      )}

      {/* Explanation panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-neon-blue/5 border border-neon-blue/20 p-4 space-y-2 overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">What is Smart Routing?</p>
                <p>
                  When you send a payment, the system automatically picks the <strong className="text-foreground">best payment channel</strong> (like Stripe, PayPal, etc.) based on cost, speed, and risk — so you save money and get faster settlements.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center p-2 rounded-lg bg-muted/10">
                    <Zap className="w-4 h-4 text-neon-blue mx-auto mb-1" />
                    <p className="font-medium text-foreground text-[10px]">FAST</p>
                    <p className="text-[9px]">High fee, instant</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/10">
                    <Clock className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
                    <p className="font-medium text-foreground text-[10px]">STANDARD</p>
                    <p className="text-[9px]">Medium fee & speed</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/10">
                    <DollarSign className="w-4 h-4 text-neon-purple mx-auto mb-1" />
                    <p className="font-medium text-foreground text-[10px]">BULK</p>
                    <p className="text-[9px]">Cheapest, slower</p>
                  </div>
                </div>
                <p>Click <strong className="text-foreground">Run Simulation</strong> below to see how 5 sample payments get routed automatically.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment channels overview */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Available Payment Channels</p>
        <div className="grid grid-cols-3 gap-2">
          {DEFAULT_CHANNELS.map(ch => {
            const stat = result?.channel_stats[ch.id];
            return (
              <div key={ch.id} className="p-3 rounded-xl bg-muted/10 border border-border/20 text-center">
                <div className="flex justify-center mb-1">{chIcon(ch.name)}</div>
                <p className="text-xs font-bold text-foreground">{ch.name}</p>
                <p className="text-[9px] text-muted-foreground">Fee ₹{ch.fee} · {ch.latency} slots</p>
                {stat && (
                  <div className="mt-1.5">
                    <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-neon-cyan rounded-full" initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stat.utilization, 100)}%` }} transition={{ duration: 1 }} />
                    </div>
                    <p className="text-[8px] text-muted-foreground mt-0.5">{stat.count} payments routed</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={runSimulation}
        disabled={running || (mode === "real" && realTransactions.length === 0)}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-cyan text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {running ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing routes...</>
        ) : (
          <><Play className="w-4 h-4" /> {mode === "real" ? "Analyze My Payments" : "Run Demo Simulation"}</>
        )}
      </button>

      {/* Loading */}
      {running && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Finding the cheapest & fastest routes for 5 payments...</p>
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-xl bg-muted/10 border border-border/20">
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {liveTxns.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Summary cards */}
            {result && (
              <>
                <p className="text-xs font-semibold text-foreground">Simulation Results</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-neon-green/5 border border-neon-green/20">
                    <CheckCircle2 className="w-4 h-4 text-neon-green mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-neon-green">{liveTxns.filter(t => t.status === "success").length}</p>
                    <p className="text-[9px] text-muted-foreground">Settled</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-400/5 border border-red-400/20">
                    <XCircle className="w-4 h-4 text-red-400 mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-red-400">{liveTxns.filter(t => t.status === "failed").length}</p>
                    <p className="text-[9px] text-muted-foreground">Failed</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
                    <TrendingUp className="w-4 h-4 text-neon-cyan mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-neon-cyan">{formatINR(result.total_system_cost_estimate)}</p>
                    <p className="text-[9px] text-muted-foreground">Total Cost</p>
                  </div>
                </div>
              </>
            )}

            {/* Transaction cards */}
            <p className="text-xs font-semibold text-foreground pt-1">Payment Routing Details</p>
            {liveTxns.map((tx, i) => {
              const cfg = STATUS[tx.status];
              const Icon = cfg.icon;
              const a = tx.assignment;
              return (
                <motion.div
                  key={a.tx_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3 rounded-xl bg-muted/10 border border-border/20"
                >
                  {/* Header: ID, amount, status */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-foreground">{a.tx_id}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatINR(a.amount)}</span>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                      <Icon className={`w-3 h-3 ${tx.status === "processing" ? "animate-spin" : ""}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Route visualization: Source → Channel → Destination */}
                  <div className="flex items-center gap-1 mb-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-muted/20 text-muted-foreground">Sender</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      a.failed ? "bg-red-400/10 text-red-400" : "bg-neon-cyan/10 text-neon-cyan"
                    }`}>
                      {a.failed ? "No Route Found" : a.channel_name}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                    <span className="px-2 py-0.5 rounded bg-muted/20 text-muted-foreground">Recipient</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${tx.status === "failed" ? "bg-red-400" : tx.status === "success" ? "bg-neon-green" : "bg-neon-cyan"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${tx.progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  {/* Details */}
                  {!a.failed && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-[10px] text-foreground/80">
                        💡 {explainRoute(a)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        Cost: {formatINR(a.total_cost, 2)} · Priority: P{a.priority} · Risk: {(a.risk_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  {a.failed && (
                    <p className="text-[10px] text-red-400 mt-1.5">⚠️ {a.fail_reason}</p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Routing;

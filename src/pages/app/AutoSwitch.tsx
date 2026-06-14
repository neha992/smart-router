import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle, XCircle, ArrowRight, Zap, Clock, AlertTriangle, Play } from "lucide-react";

interface GatewayStatus {
  id: string;
  name: string;
  status: "active" | "degraded" | "down";
  successRate: number;
  latency: number;
  fee: number;
}

interface RetryLog {
  id: string;
  txId: string;
  originalGateway: string;
  failedAt: string;
  retriedVia: string;
  status: "success" | "retrying" | "failed";
  timestamp: number;
}

const initialGateways: GatewayStatus[] = [
  { id: "gw1", name: "RazorPay", status: "active", successRate: 98.2, latency: 120, fee: 1.8 },
  { id: "gw2", name: "Stripe", status: "active", successRate: 97.5, latency: 180, fee: 2.1 },
  { id: "gw3", name: "PayU", status: "active", successRate: 95.0, latency: 250, fee: 1.2 },
  { id: "gw4", name: "Cashfree", status: "active", successRate: 96.8, latency: 140, fee: 1.5 },
];

const AutoSwitch = () => {
  const [gateways, setGateways] = useState<GatewayStatus[]>(initialGateways);
  const [retryLogs, setRetryLogs] = useState<RetryLog[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);

  const simulateFailover = useCallback(() => {
    setSimulating(true);
    setRetryLogs([]);

    // Step 1: Mark a gateway as down
    setTimeout(() => {
      setGateways(prev => prev.map(g =>
        g.id === "gw1" ? { ...g, status: "down" as const, successRate: 0 } : g
      ));
      setRetryLogs(prev => [...prev, {
        id: "r1",
        txId: "TXN-8842",
        originalGateway: "RazorPay",
        failedAt: new Date().toLocaleTimeString(),
        retriedVia: "—",
        status: "retrying",
        timestamp: Date.now(),
      }]);
    }, 800);

    // Step 2: Auto-switch to next best
    setTimeout(() => {
      setRetryLogs(prev => prev.map(r =>
        r.id === "r1" ? { ...r, retriedVia: "Cashfree", status: "success" as const } : r
      ));
    }, 2200);

    // Step 3: Another transaction fails on degraded gateway
    setTimeout(() => {
      setGateways(prev => prev.map(g =>
        g.id === "gw3" ? { ...g, status: "degraded" as const, successRate: 72, latency: 450 } : g
      ));
      setRetryLogs(prev => [...prev, {
        id: "r2",
        txId: "TXN-8843",
        originalGateway: "PayU",
        failedAt: new Date().toLocaleTimeString(),
        retriedVia: "—",
        status: "retrying",
        timestamp: Date.now(),
      }]);
    }, 3200);

    // Step 4: Retry succeeds
    setTimeout(() => {
      setRetryLogs(prev => prev.map(r =>
        r.id === "r2" ? { ...r, retriedVia: "Stripe", status: "success" as const } : r
      ));
    }, 4500);

    // Step 5: Recovery
    setTimeout(() => {
      setGateways(prev => prev.map(g =>
        g.id === "gw1" ? { ...g, status: "active" as const, successRate: 98.2 } :
        g.id === "gw3" ? { ...g, status: "active" as const, successRate: 95.0, latency: 250 } : g
      ));
      setSimulating(false);
    }, 6000);
  }, []);

  const statusColor = (s: string) =>
    s === "active" ? "text-neon-green" : s === "degraded" ? "text-yellow-400" : "text-red-400";
  const statusBg = (s: string) =>
    s === "active" ? "bg-neon-green/15" : s === "degraded" ? "bg-yellow-400/15" : "bg-red-400/15";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-lg font-bold text-foreground mb-1">Auto-Switch & Retry</h1>
        <p className="text-xs text-muted-foreground">When a gateway fails, transactions are instantly rerouted to the next best option.</p>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={simulateFailover}
          disabled={simulating}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {simulating ? (
            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Play className="w-4 h-4" /> Simulate Failover</>
          )}
        </button>
        <button
          onClick={() => setAutoRetryEnabled(!autoRetryEnabled)}
          className={`px-4 py-3 rounded-xl border text-xs font-medium transition-colors ${
            autoRetryEnabled ? "border-neon-green/50 bg-neon-green/10 text-neon-green" : "border-border/30 text-muted-foreground"
          }`}
        >
          {autoRetryEnabled ? "✓ Auto-Retry ON" : "Auto-Retry OFF"}
        </button>
      </div>

      {/* Gateway Health */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gateway Health</h2>
        {gateways.map(gw => (
          <motion.div
            key={gw.id}
            layout
            className="p-3 rounded-xl bg-muted/10 border border-border/20 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${statusBg(gw.status)}`}>
              {gw.status === "active" ? <CheckCircle className={`w-4 h-4 ${statusColor(gw.status)}`} /> :
               gw.status === "degraded" ? <AlertTriangle className={`w-4 h-4 ${statusColor(gw.status)}`} /> :
               <XCircle className={`w-4 h-4 ${statusColor(gw.status)}`} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{gw.name}</span>
                <span className={`text-[9px] font-medium uppercase ${statusColor(gw.status)}`}>{gw.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Success: {gw.successRate}% · Latency: {gw.latency}ms · Fee: {gw.fee}%
              </p>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{
              backgroundColor: gw.status === "active" ? "hsl(var(--neon-green))" :
                               gw.status === "degraded" ? "#facc15" : "#f87171"
            }} />
          </motion.div>
        ))}
      </div>

      {/* Retry Logs */}
      <AnimatePresence>
        {retryLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Failover Log</h2>
            {retryLogs.map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-xl border ${
                  log.status === "success" ? "bg-neon-green/5 border-neon-green/20" :
                  log.status === "retrying" ? "bg-yellow-400/5 border-yellow-400/20" :
                  "bg-red-400/5 border-red-400/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{log.txId}</span>
                  <span className={`text-[9px] font-medium uppercase ${
                    log.status === "success" ? "text-neon-green" :
                    log.status === "retrying" ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {log.status === "retrying" && <RefreshCw className="w-3 h-3 inline animate-spin mr-1" />}
                    {log.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="text-red-400 line-through">{log.originalGateway}</span>
                  {log.retriedVia !== "—" && (
                    <>
                      <ArrowRight className="w-3 h-3 text-neon-cyan" />
                      <span className="text-neon-green font-medium">{log.retriedVia}</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How Auto-Switch Works</h2>
        {[
          { icon: AlertTriangle, title: "Detect Failure", desc: "Gateway returns error or latency exceeds threshold" },
          { icon: RefreshCw, title: "Smart Reroute", desc: "Instantly select next best gateway by success rate & cost" },
          { icon: CheckCircle, title: "Confirm & Log", desc: "Transaction completes via fallback; event logged for audit" },
        ].map((step, i) => (
          <div key={step.title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/10 border border-border/15">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center flex-shrink-0">
              <step.icon className="w-4 h-4 text-neon-purple" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{step.title}</p>
              <p className="text-[10px] text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoSwitch;

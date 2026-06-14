import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, Shield, Zap, Settings } from "lucide-react";

interface Alert {
  id: string;
  type: "downtime" | "slow" | "switch" | "fraud" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
  severity: "critical" | "warning" | "info" | "success";
}

const mockAlerts: Alert[] = [
  { id: "a1", type: "downtime", title: "Gateway Down: PayU", message: "PayU is experiencing an outage. All transactions auto-routed to Stripe.", time: "2 min ago", read: false, severity: "critical" },
  { id: "a2", type: "switch", title: "Auto-Switch Triggered", message: "TXN-8842 rerouted from RazorPay → Cashfree due to timeout (>500ms).", time: "5 min ago", read: false, severity: "warning" },
  { id: "a3", type: "fraud", title: "Fraud Alert: Suspicious Transaction", message: "TXN-9021 (₹12,500) flagged for unusual pattern. Review required.", time: "12 min ago", read: false, severity: "critical" },
  { id: "a4", type: "slow", title: "High Latency: Stripe", message: "Stripe response time increased to 450ms (threshold: 300ms). Monitoring.", time: "18 min ago", read: true, severity: "warning" },
  { id: "a5", type: "success", title: "Settlement Batch Complete", message: "47 transactions settled successfully via FAST channel. Total: ₹234,500.", time: "30 min ago", read: true, severity: "success" },
  { id: "a6", type: "switch", title: "Failover Recovery", message: "PayU is back online. Traffic gradually shifting back from fallback gateways.", time: "45 min ago", read: true, severity: "info" },
  { id: "a7", type: "slow", title: "Processing Delay", message: "BULK channel processing delayed by 3 time units due to high volume.", time: "1 hr ago", read: true, severity: "warning" },
  { id: "a8", type: "success", title: "Cost Optimization Applied", message: "AI rerouted 12 low-priority transactions to BULK, saving ₹42.80.", time: "2 hr ago", read: true, severity: "success" },
];

const alertRules = [
  { label: "Gateway Downtime", enabled: true, desc: "Alert when a gateway goes offline" },
  { label: "Slow Processing", enabled: true, desc: "Alert when latency exceeds 300ms" },
  { label: "Auto-Switch Events", enabled: true, desc: "Alert on automatic gateway failover" },
  { label: "Fraud Detection", enabled: true, desc: "Alert on suspicious transactions" },
  { label: "Settlement Completion", enabled: false, desc: "Alert when batch settlements finish" },
];

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [rules, setRules] = useState(alertRules);

  const filtered = filter === "all" ? alerts :
    filter === "unread" ? alerts.filter(a => !a.read) :
    alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));

  const getIcon = (type: string) => {
    switch (type) {
      case "downtime": return XCircle;
      case "slow": return Clock;
      case "switch": return RefreshCw;
      case "fraud": return Shield;
      case "success": return CheckCircle;
      default: return Bell;
    }
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case "critical": return "text-red-400 bg-red-400/15";
      case "warning": return "text-yellow-400 bg-yellow-400/15";
      case "success": return "text-neon-green bg-neon-green/15";
      default: return "text-neon-cyan bg-neon-cyan/15";
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neon-cyan" />
            <h1 className="text-lg font-bold text-foreground">Smart Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-400/20 text-red-400 text-[10px] font-bold">{unreadCount}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Real-time notifications for gateway events, failures, and optimizations.</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Alert Rules Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alert Rules</h2>
            {rules.map((rule, i) => (
              <div key={rule.label} className="p-3 rounded-xl bg-muted/10 border border-border/15 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">{rule.label}</p>
                  <p className="text-[10px] text-muted-foreground">{rule.desc}</p>
                </div>
                <button
                  onClick={() => setRules(prev => prev.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r))}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                    rule.enabled ? "bg-neon-green" : "bg-muted/40"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-background shadow transition-transform ${
                    rule.enabled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "downtime", label: "Downtime" },
          { key: "switch", label: "Switches" },
          { key: "fraud", label: "Fraud" },
          { key: "slow", label: "Slow" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              filter === f.key ? "bg-neon-cyan/20 text-neon-cyan" : "bg-muted/10 text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="ml-auto px-3 py-1.5 rounded-lg text-[10px] font-medium text-neon-blue">
            Mark all read
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map(alert => {
            const Icon = getIcon(alert.type);
            const colors = getSeverityColor(alert.severity);
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a))}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  alert.read ? "bg-muted/5 border-border/15" : "bg-muted/15 border-border/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{alert.title}</span>
                      {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{alert.message}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-1">{alert.time}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-xs">No alerts found</div>
        )}
      </div>
    </div>
  );
};

export default SmartAlerts;

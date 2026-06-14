import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, Activity, CheckCircle2, XCircle, Clock,
  ArrowUpRight, ArrowDownRight, HelpCircle, Download
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { usePayments } from "@/hooks/usePayments";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

const Analytics = () => {
  const { payments, loading } = usePayments();
  const [showHelp, setShowHelp] = useState(false);

  // Use only real DB data
  const total = payments.length;
  const success = payments.filter(p => p.status === "success").length;
  const failed = payments.filter(p => p.status === "failed").length;
  const pending = payments.filter(p => p.status === "pending" || p.status === "processing").length;
  const volume = payments.reduce((s, p) => s + Number(p.amount), 0);
  const fees = payments.reduce((s, p) => s + Number(p.fee), 0);
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "0";
  const avgAmount = total > 0 ? (volume / total) : 0;

  // Gateway distribution
  const gwMap: Record<string, { count: number; volume: number }> = {};
  payments.forEach(p => {
    if (!gwMap[p.gateway]) gwMap[p.gateway] = { count: 0, volume: 0 };
    gwMap[p.gateway].count++;
    gwMap[p.gateway].volume += Number(p.amount);
  });
  const gwPieData = Object.entries(gwMap).map(([name, d]) => ({ name, value: d.volume, count: d.count }));

  // Status data for bar
  const statusData = [
    { name: "✅ Successful", count: success, fill: "#22c55e" },
    { name: "❌ Failed", count: failed, fill: "#ef4444" },
    { name: "⏳ Pending", count: pending, fill: "#f59e0b" },
  ];

  // Export CSV
  const handleExport = () => {
    if (payments.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = "ID,Amount,Currency,Recipient,Gateway,Fee,Status,Date\n";
    const rows = payments.map(p =>
      `${p.id},${p.amount},${p.currency},${p.recipient},${p.gateway},${p.fee},${p.status},${p.created_at}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported!");
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-foreground">
          📊 Analytics
        </motion.h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(!showHelp)} className="p-2 rounded-lg bg-muted/20 text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="p-2 rounded-lg bg-muted/20 text-muted-foreground">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help panel */}
      {showHelp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground space-y-2"
        >
          <p className="font-semibold text-foreground">📖 How to read this page</p>
          <ul className="space-y-1 list-disc pl-4">
            <li><strong>Total Volume</strong> = Total money you've sent through the system</li>
            <li><strong>Success Rate</strong> = % of payments that went through successfully</li>
            <li><strong>Avg per Transaction</strong> = Average amount per payment</li>
            <li><strong>Total Fees</strong> = Sum of all gateway fees charged</li>
            <li>Charts below show which gateways you use most and how your payments perform</li>
          </ul>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && payments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-muted/10 border border-border/30 p-8 text-center"
        >
          <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No payments yet</p>
          <p className="text-xs text-muted-foreground">Send your first payment to see analytics here</p>
        </motion.div>
      )}

      {/* Key stats — 2x2 grid, simple and clear */}
      {total > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: DollarSign,
                label: "Total Volume",
                value: formatINR(volume),
                sub: `${total} transaction${total !== 1 ? "s" : ""}`,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: TrendingUp,
                label: "Success Rate",
                value: `${successRate}%`,
                sub: `${success} of ${total} succeeded`,
                color: Number(successRate) >= 80 ? "text-green-500" : "text-yellow-500",
                bg: Number(successRate) >= 80 ? "bg-green-500/10" : "bg-yellow-500/10",
              },
              {
                icon: Activity,
                label: "Avg per Transaction",
                value: formatINR(avgAmount),
                sub: "average amount",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: DollarSign,
                label: "Total Fees Paid",
                value: formatINR(fees, 2),
                sub: total > 0 ? `~${formatINR(fees / total, 2)} per txn` : "",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-muted/10 border border-border/20"
              >
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-[9px] text-muted-foreground/70">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick status summary — visual progress bar with plain labels */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl bg-muted/10 border border-border/20 p-4"
          >
            <h3 className="text-xs font-semibold text-foreground mb-1">Payment Results</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              How your {total} payment{total !== 1 ? "s" : ""} turned out
            </p>
            <div className="h-3 bg-muted/20 rounded-full overflow-hidden flex">
              {success > 0 && <div className="bg-green-500 h-full transition-all" style={{ width: `${(success / total) * 100}%` }} />}
              {failed > 0 && <div className="bg-red-500 h-full transition-all" style={{ width: `${(failed / total) * 100}%` }} />}
              {pending > 0 && <div className="bg-yellow-500 h-full transition-all" style={{ width: `${(pending / total) * 100}%` }} />}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {success} Successful
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {failed} Failed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                {pending} In Progress
              </span>
            </div>
          </motion.div>

          {/* Status Breakdown Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-muted/10 border border-border/20 p-4"
          >
            <h3 className="text-xs font-semibold text-foreground mb-1">Status Breakdown</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Number of payments by outcome</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={100} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(value: number) => [`${value} payments`, ""]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gateway Distribution */}
          {gwPieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl bg-muted/10 border border-border/20 p-4"
            >
              <h3 className="text-xs font-semibold text-foreground mb-1">Where your money goes</h3>
              <p className="text-[10px] text-muted-foreground mb-3">Volume split by payment gateway</p>
              <div className="flex items-center gap-4">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={gwPieData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="value" paddingAngle={3}>
                        {gwPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        formatter={(value: number) => [formatINR(value), "Volume"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {gwPieData.map((gw, i) => (
                    <div key={gw.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-foreground font-medium truncate block">{gw.name}</span>
                        <span className="text-[9px] text-muted-foreground">{gw.count} txn{gw.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-[10px] font-medium text-foreground">{formatINR(gw.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2"
          >
            <span className="text-base">💡</span>
            <div>
              <p className="text-[11px] font-medium text-foreground">Quick Tip</p>
              <p className="text-[10px] text-muted-foreground">
                {Number(successRate) >= 90
                  ? "Your success rate is great! Keep using auto-routing for the best results."
                  : Number(successRate) >= 70
                  ? "Consider using auto-routing to improve your success rate."
                  : "Try switching gateways or using smaller amounts to improve success rates."}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Analytics;

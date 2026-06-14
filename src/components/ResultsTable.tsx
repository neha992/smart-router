import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Download } from "lucide-react";
import type { RoutingResult } from "@/lib/routing-engine";
import { formatINR } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface ResultsTableProps {
  result: RoutingResult;
}

const ResultsTable = ({ result }: ResultsTableProps) => {
  const { assignments, total_system_cost_estimate, channel_stats } = result;
  const failed = assignments.filter(a => a.failed);
  const succeeded = assignments.filter(a => !a.failed);

  const handleCSVDownload = () => {
    const headers = ["tx_id", "channel", "start_time", "end_time", "channel_fee", "delay_penalty", "sla_penalty", "risk_penalty", "total_cost", "status"];
    const rows = assignments.map(a => [
      a.tx_id,
      a.channel_name || "N/A",
      a.start_time ?? "N/A",
      a.end_time ?? "N/A",
      a.channel_fee,
      a.delay_penalty,
      a.sla_penalty,
      a.risk_penalty,
      a.total_cost,
      a.failed ? "FAILED" : "OK",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartsettle_results.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Total Cost</p>
          <p className="font-display text-2xl font-black neon-glow-cyan">{formatINR(total_system_cost_estimate)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Routed</p>
          <p className="font-display text-2xl font-black neon-glow-blue">{succeeded.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Failed</p>
          <p className="font-display text-2xl font-black text-destructive">{failed.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Channels Used</p>
          <p className="font-display text-2xl font-black neon-glow-purple">{Object.values(channel_stats).filter(s => s.count > 0).length}</p>
        </div>
      </div>

      {/* Channel Utilization */}
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-bold mb-4 neon-glow-blue">Channel Utilization</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(channel_stats).map(([id, stats]) => {
            const label = id === "Channel_F" ? "FAST" : id === "Channel_S" ? "STANDARD" : "BULK";
            const ch = id === "Channel_F" ? 50000 : id === "Channel_S" ? 100000 : 500000;
            const liqPct = Math.round((stats.liquidity_used / ch) * 100);
            return (
              <div key={id} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <p className="font-display font-bold text-sm mb-2">{label}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Transactions</span><span className="font-bold">{stats.count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fees</span><span className="font-bold">{formatINR(stats.total_fee, 2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Liquidity Used</span><span className="font-bold">{liqPct}%</span></div>
                  <div className="w-full bg-muted/50 rounded-full h-2 mt-1">
                    <div className="h-2 rounded-full bg-neon-cyan transition-all" style={{ width: `${Math.min(liqPct, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold neon-glow-cyan">Transaction Details</h3>
          <button onClick={handleCSVDownload} className="btn-neon-outline flex items-center gap-2 px-3 py-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>
        </div>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-xs">TX ID</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Channel</TableHead>
                <TableHead className="text-xs">Start</TableHead>
                <TableHead className="text-xs">Fee</TableHead>
                <TableHead className="text-xs">Delay</TableHead>
                <TableHead className="text-xs">SLA</TableHead>
                <TableHead className="text-xs">Risk</TableHead>
                <TableHead className="text-xs">Total</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map(a => (
                <TableRow key={a.tx_id} className="border-border/30 text-xs">
                  <TableCell className="font-mono font-bold">{a.tx_id}</TableCell>
                  <TableCell>{formatINR(a.amount)}</TableCell>
                  <TableCell>{a.channel_name || "—"}</TableCell>
                  <TableCell>{a.start_time ?? "—"}</TableCell>
                  <TableCell>{formatINR(a.channel_fee)}</TableCell>
                  <TableCell>{formatINR(a.delay_penalty)}</TableCell>
                  <TableCell>{formatINR(a.sla_penalty)}</TableCell>
                  <TableCell>{formatINR(a.risk_penalty)}</TableCell>
                  <TableCell className="font-bold">{formatINR(a.total_cost)}</TableCell>
                  <TableCell>
                    {a.failed ? (
                      <span className="flex items-center gap-1 text-destructive" title={a.fail_reason}>
                        <AlertTriangle className="w-3 h-3" /> Failed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-neon-green">
                        <CheckCircle className="w-3 h-3" /> OK
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Failed Transaction Warnings */}
      {failed.length > 0 && (
        <div className="glass-card p-4 border-destructive/30">
          <h4 className="font-display font-bold text-sm text-destructive flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Failed Transactions
          </h4>
          <div className="space-y-1">
            {failed.map(a => (
              <p key={a.tx_id} className="text-xs text-muted-foreground">
                <span className="font-mono font-bold text-foreground">{a.tx_id}</span> — {a.fail_reason || "Could not be scheduled"} (penalty: {formatINR(a.total_cost)})
              </p>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsTable;

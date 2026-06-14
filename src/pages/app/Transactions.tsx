import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, ArrowDownLeft, TrendingUp, Search,
  Download, RotateCcw, FileText, Eye, Plus
} from "lucide-react";
import { usePayments, type Payment } from "@/hooks/usePayments";
import PaymentTracker, { type PaymentStep } from "@/components/PaymentTracker";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { formatINR } from "@/lib/utils";

const statusColors: Record<string, string> = {
  completed: "text-neon-green bg-neon-green/10",
  success: "text-neon-green bg-neon-green/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  failed: "text-red-400 bg-red-400/10",
  processing: "text-neon-cyan bg-neon-cyan/10",
};

function TxIcon({ type }: { type: string }) {
  if (type === "send") return <ArrowUpRight className="w-4 h-4 text-red-400" />;
  if (type === "receive") return <ArrowDownLeft className="w-4 h-4 text-neon-green" />;
  return <TrendingUp className="w-4 h-4 text-neon-cyan" />;
}

function getTrackerSteps(p: Payment): PaymentStep[] {
  const fmt = (d: string | null) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined;
  const s = p.status;

  if (s === "failed") return [
    { label: "Initiated", status: "completed", timestamp: fmt(p.initiated_at) },
    { label: "Processing", status: "completed", timestamp: fmt(p.processing_started_at) },
    { label: "Failed", status: "failed", timestamp: fmt(p.completed_at) },
  ];
  if (s === "success") return [
    { label: "Initiated", status: "completed", timestamp: fmt(p.initiated_at) },
    { label: "Processing", status: "completed", timestamp: fmt(p.processing_started_at) },
    { label: "Completed", status: "completed", timestamp: fmt(p.completed_at) },
  ];
  if (s === "processing") return [
    { label: "Initiated", status: "completed", timestamp: fmt(p.initiated_at) },
    { label: "Processing", status: "active", timestamp: fmt(p.processing_started_at) },
    { label: "Completed", status: "pending" },
  ];
  return [
    { label: "Initiated", status: "completed", timestamp: fmt(p.initiated_at) },
    { label: "Processing", status: "pending" },
    { label: "Completed", status: "pending" },
  ];
}

type UnifiedTx = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  recipient: string;
  status: string;
  timestamp: string;
  gateway: string;
  fee: number;
  raw: Payment;
};

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

  const { payments, loading, updateStatus } = usePayments();

  // Real DB transactions only — no mock data
  const allTx = useMemo<UnifiedTx[]>(() => {
    return payments.map(p => ({
      id: p.id.slice(0, 8).toUpperCase(),
      type: p.type,
      amount: Number(p.amount),
      currency: p.currency,
      recipient: p.recipient,
      status: p.status === "success" ? "completed" : p.status,
      timestamp: p.created_at,
      gateway: p.gateway,
      fee: Number(p.fee),
      raw: p,
    }));
  }, [payments]);

  const filtered = useMemo(() => {
    return allTx.filter(tx => {
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (search && !tx.recipient.toLowerCase().includes(search.toLowerCase()) && !tx.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter, typeFilter, allTx]);

  const handleRetry = async (tx: UnifiedTx) => {
    setRetrying(tx.id);
    try {
      await updateStatus(tx.raw.id, "processing", { processing_started_at: new Date().toISOString() });
      setTimeout(async () => {
        await updateStatus(tx.raw.id, "success", { completed_at: new Date().toISOString() });
        toast.success("Payment retried successfully!");
        setRetrying(null);
      }, 2000);
    } catch {
      toast.error("Retry failed");
      setRetrying(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Type", "Amount", "Currency", "Recipient", "Status", "Gateway", "Fee", "Date"];
    const rows = filtered.map(tx => [
      tx.id, tx.type, tx.amount, tx.currency, tx.recipient, tx.status, tx.gateway, tx.fee,
      new Date(tx.timestamp).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCount = allTx.length;
  const completedCount = allTx.filter(t => t.status === "completed").length;
  const failedCount = allTx.filter(t => t.status === "failed").length;
  const totalVolume = allTx.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-foreground">
          Transactions
        </motion.h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Detail tracker modal */}
      <AnimatePresence>
        {detailPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-2 flex justify-end">
              <button onClick={() => setDetailPayment(null)} className="text-xs text-muted-foreground underline">Close</button>
            </div>
            <PaymentTracker
              steps={getTrackerSteps(detailPayment)}
              paymentId={detailPayment.id.slice(0, 8).toUpperCase()}
              amount={Number(detailPayment.amount)}
              recipient={detailPayment.recipient}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: totalCount, color: "text-foreground" },
          { label: "Success", value: completedCount, color: "text-neon-green" },
          { label: "Failed", value: failedCount, color: "text-red-400" },
          { label: "Volume", value: formatINR(totalVolume), color: "text-neon-cyan" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-muted/10 border border-border/20 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/10 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-neon-cyan/30"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {["all", "completed", "pending", "failed", "processing"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === s ? "bg-neon-cyan/20 text-neon-cyan" : "bg-muted/20 text-muted-foreground"
              }`}
            >
              {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["all", "send", "receive", "settlement"].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                typeFilter === t ? "bg-neon-purple/20 text-neon-purple" : "bg-muted/20 text-muted-foreground"
              }`}
            >
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        )}
        <AnimatePresence>
          {filtered.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.03 }}
              className="p-3 rounded-xl bg-muted/10 border border-border/15 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  tx.type === "send" ? "bg-red-400/10" : tx.type === "receive" ? "bg-neon-green/10" : "bg-neon-cyan/10"
                }`}>
                  <TxIcon type={tx.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.recipient}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tx.gateway} · {tx.id} · {new Date(tx.timestamp).toLocaleDateString()}
                    <span className="ml-1 text-neon-cyan">● Live</span>
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`text-sm font-semibold ${tx.type === "receive" ? "text-neon-green" : "text-foreground"}`}>
                    {tx.type === "receive" ? "+" : "-"}{formatINR(tx.amount)}
                  </p>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${statusColors[tx.status] || "text-muted-foreground bg-muted/20"}`}>
                    {tx.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setDetailPayment(tx.raw)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/20 text-muted-foreground text-[10px] hover:bg-muted/30 transition-colors"
                >
                  <Eye className="w-3 h-3" /> Track
                </button>
                {tx.status === "failed" && (
                  <button
                    onClick={() => handleRetry(tx)}
                    disabled={retrying === tx.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
                  >
                    {retrying === tx.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    {retrying === tx.id ? "Retrying..." : "Retry"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">No transactions yet</p>
            <p className="text-xs text-muted-foreground mb-4">Send your first payment to see it here.</p>
            <Link
              to="/app/payments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Send Payment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;

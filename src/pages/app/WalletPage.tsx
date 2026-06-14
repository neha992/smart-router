import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, ArrowDownLeft, TrendingUp, Download, Upload,
  Trophy, Award, Eye, EyeOff, Filter, Search, Plus, Minus, X
} from "lucide-react";
import {
  mockWallet, mockTransactions, mockBadges, mockSettlements,
  type RecentTransaction
} from "@/lib/mock-data";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

function TxIcon({ type }: { type: RecentTransaction["type"] }) {
  if (type === "send") return <ArrowUpRight className="w-4 h-4 text-red-400" />;
  if (type === "receive") return <ArrowDownLeft className="w-4 h-4 text-neon-green" />;
  return <TrendingUp className="w-4 h-4 text-neon-cyan" />;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const WalletPage = () => {
  const [tab, setTab] = useState<"transactions" | "settlements" | "rewards">("transactions");
  const [typeFilter, setTypeFilter] = useState<"all" | "send" | "receive" | "settlement">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [actionAmount, setActionAmount] = useState("");

  const filteredTx = useMemo(() => {
    let list = mockTransactions;
    if (typeFilter !== "all") list = list.filter(t => t.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(t => t.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.recipient.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.gateway.toLowerCase().includes(q)
      );
    }
    return list;
  }, [typeFilter, statusFilter, searchQuery]);

  const availableBalance = mockWallet.balance;
  const lockedBalance = mockSettlements
    .filter(s => s.status !== "completed")
    .reduce((sum, s) => sum + s.amount, 0);

  const handleAddMoney = () => {
    if (!actionAmount || parseFloat(actionAmount) <= 0) return;
    toast.success(`${formatINR(parseFloat(actionAmount))} added to wallet`);
    setActionAmount("");
    setShowAddMoney(false);
  };

  const handleWithdraw = () => {
    if (!actionAmount || parseFloat(actionAmount) <= 0) return;
    if (parseFloat(actionAmount) > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success(`${formatINR(parseFloat(actionAmount))} withdrawal initiated`);
    setActionAmount("");
    setShowWithdraw(false);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-neon-blue/15 to-neon-cyan/15 border border-border/30 p-5"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">Available Balance</p>
          <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-muted-foreground">
            {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        <p className="font-display text-3xl font-black text-foreground text-center">
          {balanceVisible ? formatINR(availableBalance, 2) : "••••••"}
        </p>

        {/* Available vs Locked */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 rounded-lg bg-background/30">
            <p className="text-[10px] text-muted-foreground">Available</p>
            <p className="text-xs font-bold text-neon-green">
              {balanceVisible ? formatINR(availableBalance) : "••••"}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30">
            <p className="text-[10px] text-muted-foreground">Locked</p>
            <p className="text-xs font-bold text-yellow-400">
              {balanceVisible ? formatINR(lockedBalance) : "••••"}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-3 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Total Saved</p>
            <p className="font-semibold text-neon-green">{formatINR(mockWallet.savings)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Pending</p>
            <p className="font-semibold text-yellow-400">{mockWallet.pendingSettlements} settlements</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { setShowAddMoney(true); setShowWithdraw(false); }}
            className="flex-1 py-2.5 rounded-xl bg-neon-green/20 text-neon-green text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Money
          </button>
          <button
            onClick={() => { setShowWithdraw(true); setShowAddMoney(false); }}
            className="flex-1 py-2.5 rounded-xl bg-red-400/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Minus className="w-3.5 h-3.5" /> Withdraw
          </button>
        </div>
      </motion.div>

      {/* Add Money / Withdraw Modal */}
      <AnimatePresence>
        {(showAddMoney || showWithdraw) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">
                {showAddMoney ? "Add Money" : "Withdraw Funds"}
              </h3>
              <button onClick={() => { setShowAddMoney(false); setShowWithdraw(false); setActionAmount(""); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">₹</span>
              <input
                type="number"
                value={actionAmount}
                onChange={e => setActionAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
              />
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map(amt => (
                  <button
                  key={amt}
                  onClick={() => setActionAmount(String(amt))}
                  className="px-2 py-1 rounded-md bg-muted/20 text-[10px] text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  {formatINR(amt)}
                </button>
              ))}
            </div>
            <button
              onClick={showAddMoney ? handleAddMoney : handleWithdraw}
              disabled={!actionAmount || parseFloat(actionAmount) <= 0}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 ${
                showAddMoney
                  ? "bg-neon-green/20 text-neon-green"
                  : "bg-red-400/20 text-red-400"
              }`}
            >
              {showAddMoney ? "Add to Wallet" : "Withdraw"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/20 rounded-xl">
        {(["transactions", "settlements", "rewards"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
              tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/10 border border-border/20 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {(["all", "send", "receive", "settlement"] as const).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  typeFilter === f ? "bg-neon-cyan/20 text-neon-cyan" : "bg-muted/20 text-muted-foreground"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {(["all", "completed", "pending", "failed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  statusFilter === f ? "bg-neon-purple/20 text-neon-purple" : "bg-muted/20 text-muted-foreground"
                }`}
              >
                {f === "all" ? "All Status" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          {filteredTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            filteredTx.map(tx => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/15"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  tx.type === "send" ? "bg-red-400/10" : tx.type === "receive" ? "bg-neon-green/10" : "bg-neon-cyan/10"
                }`}>
                  <TxIcon type={tx.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.recipient}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-muted-foreground">{tx.gateway}</p>
                    <span className={`text-[8px] px-1 py-0.5 rounded ${
                      tx.status === "completed" ? "bg-neon-green/10 text-neon-green" :
                      tx.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                      tx.status === "failed" ? "bg-red-400/10 text-red-400" :
                      "bg-neon-cyan/10 text-neon-cyan"
                    }`}>{tx.status}</span>
                    <span className="text-[9px] text-muted-foreground/60">{formatTime(tx.timestamp)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    tx.type === "receive" ? "text-neon-green" : "text-foreground"
                  }`}>
                    {tx.type === "receive" ? "+" : "-"}{formatINR(tx.amount)}
                  </p>
                  {tx.fee > 0 && <p className="text-[9px] text-muted-foreground">Fee: {formatINR(tx.fee)}</p>}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {tab === "settlements" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {mockSettlements.map(s => (
            <div key={s.id} className="p-3 rounded-xl bg-muted/10 border border-border/15">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    s.channel === "FAST" ? "bg-neon-blue/20 text-neon-blue" :
                    s.channel === "STANDARD" ? "bg-neon-cyan/20 text-neon-cyan" :
                    "bg-neon-purple/20 text-neon-purple"
                  }`}>{s.channel}</span>
                  <span className="text-xs text-muted-foreground">{s.id}</span>
                </div>
                <span className={`text-[10px] font-medium ${
                  s.status === "completed" ? "text-neon-green" :
                  s.status === "processing" ? "text-neon-cyan" :
                  "text-yellow-400"
                }`}>{s.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{formatINR(s.amount)}</p>
                <p className="text-[10px] text-muted-foreground">ETA: {s.estimatedTime}</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">Fee: {formatINR(s.fee)}</p>
                <p className="text-[10px] text-neon-green">Saved: {formatINR(s.savings)}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {tab === "rewards" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="text-center py-3">
            <Trophy className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">{mockBadges.filter(b => b.earned).length}/{mockBadges.length} Badges Earned</p>
          </div>
          {mockBadges.map(badge => (
            <div key={badge.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
              badge.earned ? "bg-neon-cyan/5 border-neon-cyan/20" : "bg-muted/5 border-border/15"
            }`}>
              <span className="text-2xl">{badge.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{badge.name}</p>
                <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                {!badge.earned && (
                  <div className="mt-1.5 w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan rounded-full" style={{ width: `${badge.progress}%` }} />
                  </div>
                )}
              </div>
              {badge.earned && <Award className="w-4 h-4 text-neon-cyan" />}
              {!badge.earned && <span className="text-[10px] text-muted-foreground">{badge.progress}%</span>}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default WalletPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Search, Sparkles, FileBarChart, RefreshCw, Bell, Eye, EyeOff,
  TrendingUp, ArrowRight, CheckCircle2, AlertTriangle, Repeat,
  Zap, Clock, ShieldCheck, ChevronRight, Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatINR } from "@/lib/utils";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const quickActions = [
  { icon: Send, label: "Send Money", color: "from-blue-500 to-indigo-600", path: "/app/payments" },
  { icon: Search, label: "Track Settle", color: "from-emerald-500 to-teal-600", path: "/app/transactions" },
  { icon: Activity, label: "Analyze Route", color: "from-purple-500 to-fuchsia-600", path: "/app/routing" },
  { icon: Sparkles, label: "Smart AI", color: "from-amber-500 to-orange-600", path: "/app/predictions" },
  { icon: FileBarChart, label: "Reports", color: "from-pink-500 to-rose-600", path: "/app/analytics" },
  { icon: RefreshCw, label: "Auto-Reroute", color: "from-cyan-500 to-sky-600", path: "/app/auto-switch" },
];

const liveTxns = [
  { amount: 12500, status: "Completed", gateway: "Razorpay", time: "2m ago", tone: "ok" as const },
  { amount: 7800, status: "Delay Risk", gateway: "PayU", time: "5m ago", tone: "warn" as const },
  { amount: 25000, status: "Auto Re-routed", gateway: "HDFC → ICICI", time: "8m ago", tone: "info" as const },
  { amount: 4200, status: "Completed", gateway: "UPI", time: "12m ago", tone: "ok" as const },
];

const insights = [
  { text: "Switch to ICICI for 30% faster settlement today.", tag: "Speed" },
  { text: "Avoid Gateway PayU between 6 PM – 8 PM (high delays).", tag: "Warning" },
  { text: "Smart routing can save you ₹12,000 this month.", tag: "Savings" },
];

const gateways = [
  { name: "Razorpay", score: 96, tone: "ok" as const },
  { name: "PayU", score: 90, tone: "ok" as const },
  { name: "HDFC", score: 82, tone: "warn" as const },
  { name: "Paytm", score: 71, tone: "warn" as const },
];

const toneRing = { ok: "stroke-emerald-500", warn: "stroke-amber-500", risky: "stroke-rose-500" };
const toneText = { ok: "text-emerald-500", warn: "text-amber-500", risky: "text-rose-500" };

function ScoreRing({ score, tone }: { score: number; tone: "ok" | "warn" | "risky" }) {
  const r = 22, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 56 56" className="-rotate-90 w-14 h-14">
        <circle cx="28" cy="28" r={r} className="stroke-muted/30" strokeWidth="5" fill="none" />
        <motion.circle
          cx="28" cy="28" r={r}
          className={toneRing[tone]} strokeWidth="5" fill="none" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${toneText[tone]}`}>{score}</span>
    </div>
  );
}

const AppHome = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const name = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "Friend";

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{greeting()},</p>
            <h1 className="text-base font-bold text-foreground">{name} 👋</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate("/app/notifications")} className="relative p-2.5 rounded-full bg-muted/20 hover:bg-muted/30">
            <Bell className="w-4 h-4 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>
      </motion.div>

      {/* Wallet / Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl"
        style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)" }}
      >
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-cyan-300/20 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-medium">Total Settled</p>
            <button onClick={() => setShowBalance(!showBalance)} className="p-1 rounded-full hover:bg-white/10">
              {showBalance ? <Eye className="w-4 h-4 text-white/80" /> : <EyeOff className="w-4 h-4 text-white/80" />}
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={String(showBalance)}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="text-3xl font-black tracking-tight">
              {showBalance ? "₹2,45,000" : "••••••"}
            </motion.p>
          </AnimatePresence>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Pending", value: "₹18,000", icon: Clock },
              { label: "Saved Today", value: "₹5,200", icon: TrendingUp },
              { label: "Success", value: "98.2%", icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5">
                <s.icon className="w-3.5 h-3.5 text-white/70 mb-1" />
                <p className="text-sm font-bold text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl bg-card border border-border/30 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 px-1">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 py-2 rounded-2xl hover:bg-muted/20 transition-colors active:scale-95">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-md`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Auto-Reroute alert */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
        className="rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Repeat className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Payment rerouted successfully</p>
          <p className="text-[11px] text-muted-foreground">₹25,000 switched HDFC → ICICI for safer route</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.div>

      {/* Live Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-foreground">Live Transactions</h2>
          <button onClick={() => navigate("/app/transactions")} className="text-xs text-indigo-400 font-medium">See all</button>
        </div>
        <div className="space-y-2">
          {liveTxns.map((t, i) => {
            const cfg = t.tone === "ok"
              ? { bg: "bg-emerald-500/10", color: "text-emerald-500", icon: CheckCircle2, dot: "✅" }
              : t.tone === "warn"
              ? { bg: "bg-amber-500/10", color: "text-amber-500", icon: AlertTriangle, dot: "⚠️" }
              : { bg: "bg-cyan-500/10", color: "text-cyan-400", icon: Repeat, dot: "🔄" };
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/30 hover:border-border/60 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                  <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{formatINR(t.amount)}</p>
                    <p className={`text-[11px] font-medium ${cfg.color}`}>{t.status}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-[11px] text-muted-foreground truncate">via {t.gateway}</p>
                    <p className="text-[10px] text-muted-foreground">{t.time}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="relative">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="absolute inset-0 blur-md bg-purple-400/40 rounded-full" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Smart AI Insights</h2>
        </div>
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <motion.button key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
              onClick={() => navigate("/app/predictions")}
              className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 hover:border-purple-400/40 transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-purple-300/80 font-bold mb-0.5">{ins.tag}</p>
                <p className="text-xs text-foreground leading-snug">{ins.text}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settlement Health */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Settlement Health
          </h2>
          <button onClick={() => navigate("/app/routing")} className="text-xs text-indigo-400 font-medium">Analyze</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {gateways.map((g, i) => (
            <motion.div key={g.name}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/30">
              <ScoreRing score={g.score} tone={g.tone} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{g.name}</p>
                <p className={`text-[10px] font-medium ${toneText[g.tone]}`}>
                  {g.tone === "ok" ? "Healthy" : g.tone === "warn" ? "Watch" : "Risky"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppHome;
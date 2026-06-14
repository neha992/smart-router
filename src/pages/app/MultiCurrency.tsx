import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, ArrowRight, TrendingUp, TrendingDown, RefreshCw, DollarSign, Zap } from "lucide-react";

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.0, flag: "🇺🇸" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.12, flag: "🇮🇳" },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 149.50, flag: "🇯🇵" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67, flag: "🇦🇪" },
];

const routingByPair = [
  { from: "USD", to: "INR", bestGateway: "RazorPay", fee: "0.8%", time: "~2s", savings: "₹1.20" },
  { from: "USD", to: "EUR", bestGateway: "Stripe", fee: "1.1%", time: "~3s", savings: "₹0.90" },
  { from: "EUR", to: "GBP", bestGateway: "Stripe", fee: "0.9%", time: "~2s", savings: "₹0.75" },
  { from: "USD", to: "JPY", bestGateway: "Cashfree", fee: "1.3%", time: "~4s", savings: "₹0.60" },
  { from: "INR", to: "AED", bestGateway: "PayU", fee: "1.0%", time: "~3s", savings: "₹0.85" },
];

const MultiCurrency = () => {
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("INR");
  const [amount, setAmount] = useState("1000");

  const from = currencies.find(c => c.code === fromCurrency)!;
  const to = currencies.find(c => c.code === toCurrency)!;
  const converted = (parseFloat(amount || "0") * to.rate / from.rate);
  const routing = routingByPair.find(r => r.from === fromCurrency && r.to === toCurrency);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-neon-blue" />
          <h1 className="text-lg font-bold text-foreground">Multi-Currency</h1>
        </div>
        <p className="text-xs text-muted-foreground">Route payments across currencies with optimal channel selection.</p>
      </motion.div>

      {/* Converter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-muted/10 border border-border/20 space-y-3">
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">From</label>
          <div className="flex gap-2">
            <select
              value={fromCurrency}
              onChange={e => setFromCurrency(e.target.value)}
              className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-28 bg-muted/20 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground text-right"
              placeholder="Amount"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={swap} className="w-8 h-8 rounded-full bg-neon-cyan/15 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-neon-cyan" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">To</label>
          <div className="flex gap-2">
            <select
              value={toCurrency}
              onChange={e => setToCurrency(e.target.value)}
              className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</option>
              ))}
            </select>
            <div className="w-28 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg px-3 py-2.5 text-sm text-neon-cyan text-right font-semibold">
              {converted.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pt-1">
          1 {from.code} = {(to.rate / from.rate).toFixed(4)} {to.code}
        </div>
      </motion.div>

      {/* Smart Route for this pair */}
      {routing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-gradient-to-r from-neon-blue/10 to-neon-cyan/10 border border-neon-blue/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-xs font-semibold text-foreground">Recommended Route</span>
          </div>
          <p className="text-sm font-bold text-foreground mb-2">
            {from.flag} {fromCurrency} → {to.flag} {toCurrency} via <span className="text-neon-cyan">{routing.bestGateway}</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs font-bold text-foreground">{routing.fee}</p>
              <p className="text-[9px] text-muted-foreground">Fee</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs font-bold text-foreground">{routing.time}</p>
              <p className="text-[9px] text-muted-foreground">Speed</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs font-bold text-neon-green">{routing.savings}</p>
              <p className="text-[9px] text-muted-foreground">Saved/txn</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Exchange Rates */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Exchange Rates</h2>
        {currencies.filter(c => c.code !== "USD").map(c => {
          const change = (Math.random() * 2 - 1).toFixed(2);
          const isUp = parseFloat(change) > 0;
          return (
            <div key={c.code} className="p-3 rounded-xl bg-muted/10 border border-border/15 flex items-center gap-3">
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{c.code}/{" "}USD</p>
                <p className="text-[10px] text-muted-foreground">{c.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">{c.rate.toFixed(2)}</p>
                <p className={`text-[9px] font-medium ${isUp ? "text-neon-green" : "text-red-400"}`}>
                  {isUp ? "↑" : "↓"} {change}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* All Routing Pairs */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optimal Routes by Currency Pair</h2>
        {routingByPair.map((r, i) => (
          <div key={i} className="p-3 rounded-xl bg-muted/10 border border-border/15 flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-medium text-foreground min-w-[80px]">
              {r.from} <ArrowRight className="w-3 h-3 text-neon-cyan" /> {r.to}
            </div>
            <div className="flex-1 text-[10px] text-muted-foreground">
              via <span className="text-neon-cyan font-medium">{r.bestGateway}</span> · {r.fee} fee · {r.time}
            </div>
            <span className="text-[10px] text-neon-green font-medium">{r.savings}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiCurrency;

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Clock, Zap, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const hourlyPrediction = [
  { hour: "6AM", success: 94, volume: 120 },
  { hour: "8AM", success: 97, volume: 340 },
  { hour: "10AM", success: 98, volume: 520 },
  { hour: "12PM", success: 96, volume: 610 },
  { hour: "2PM", success: 99, volume: 480 },
  { hour: "4PM", success: 97, volume: 390 },
  { hour: "6PM", success: 95, volume: 550 },
  { hour: "8PM", success: 93, volume: 680 },
  { hour: "10PM", success: 91, volume: 420 },
];

const gatewayForecast = [
  { name: "RazorPay", predicted: 98.5, current: 97.8, trend: "up" },
  { name: "Stripe", predicted: 96.2, current: 97.1, trend: "down" },
  { name: "PayU", predicted: 94.8, current: 93.5, trend: "up" },
  { name: "Cashfree", predicted: 97.1, current: 96.5, trend: "up" },
];

const recommendations = [
  { text: "Process bulk payments between 2-4 PM for highest success rate (99%)", impact: "high", savings: "₹320" },
  { text: "Switch INR transactions from Stripe to RazorPay to save 0.3% per txn", impact: "medium", savings: "₹180" },
  { text: "Avoid PayU for transactions > ₹5,000 during 8-10 PM (degraded performance)", impact: "high", savings: "₹450" },
  { text: "Batch INR settlements to reduce per-transaction overhead fees", impact: "low", savings: "₹95" },
];

const AIPredictions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-neon-cyan" />
          <h1 className="text-lg font-bold text-foreground">AI Predictions</h1>
        </div>
        <p className="text-xs text-muted-foreground">AI-powered insights to optimize payment timing and gateway selection.</p>
      </motion.div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(["today", "week", "month"] as const).map(p => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedPeriod === p ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "bg-muted/10 text-muted-foreground border border-border/20"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Best Time to Process */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/20">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-neon-green" />
          <span className="text-xs font-semibold text-foreground">Best Processing Window</span>
        </div>
        <p className="text-2xl font-bold text-neon-green mb-1">2:00 PM – 4:00 PM</p>
        <p className="text-[10px] text-muted-foreground">Predicted success rate: 99% · Avg latency: 95ms · Lowest fees</p>
      </motion.div>

      {/* Success Rate Prediction Chart */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Predicted Success Rate by Hour</h2>
        <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hourlyPrediction}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[88, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              />
              <Line type="monotone" dataKey="success" stroke="hsl(var(--neon-cyan))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--neon-cyan))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gateway Forecast */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gateway Performance Forecast</h2>
        {gatewayForecast.map(gw => (
          <div key={gw.name} className="p-3 rounded-xl bg-muted/10 border border-border/15 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground">{gw.name}</span>
                <span className={`text-[9px] font-medium ${gw.trend === "up" ? "text-neon-green" : "text-red-400"}`}>
                  {gw.trend === "up" ? "↑" : "↓"} {gw.trend === "up" ? "Improving" : "Declining"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span>Current: {gw.current}%</span>
                <ArrowRight className="w-3 h-3 text-neon-cyan" />
                <span className="text-foreground font-medium">Predicted: {gw.predicted}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted/20 flex items-center justify-center">
              <span className={`text-sm font-bold ${gw.trend === "up" ? "text-neon-green" : "text-red-400"}`}>
                {gw.predicted}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Recommendations */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Recommendations</h2>
        {recommendations.map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-3 rounded-xl border ${
              rec.impact === "high" ? "bg-neon-cyan/5 border-neon-cyan/20" :
              rec.impact === "medium" ? "bg-neon-blue/5 border-neon-blue/20" :
              "bg-muted/10 border-border/20"
            }`}
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-foreground leading-relaxed">{rec.text}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded ${
                    rec.impact === "high" ? "bg-neon-cyan/20 text-neon-cyan" :
                    rec.impact === "medium" ? "bg-neon-blue/20 text-neon-blue" :
                    "bg-muted/30 text-muted-foreground"
                  }`}>{rec.impact} impact</span>
                  <span className="text-[10px] text-neon-green font-medium">Save {rec.savings}/mo</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Volume Prediction */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Predicted Volume</h2>
        <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={hourlyPrediction}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              />
              <Bar dataKey="volume" fill="hsl(var(--neon-blue))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AIPredictions;

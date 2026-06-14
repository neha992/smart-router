import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { RoutingResult } from "@/lib/routing-engine";

const COLORS = ["hsl(210,100%,55%)", "hsl(270,60%,55%)", "hsl(185,100%,50%)", "hsl(0,84%,60%)"];
const CHANNEL_LABELS: Record<string, string> = { Channel_F: "FAST", Channel_S: "STANDARD", Channel_B: "BULK" };

interface CostChartsProps {
  result: RoutingResult;
}

const CostCharts = ({ result }: CostChartsProps) => {
  const pieData = Object.entries(result.channel_stats).map(([id, s]) => ({
    name: CHANNEL_LABELS[id] || id,
    value: s.count,
  }));
  const failedCount = result.assignments.filter(a => a.failed).length;
  if (failedCount > 0) pieData.push({ name: "FAILED", value: failedCount });

  const barData = Object.entries(result.channel_stats).map(([id, s]) => ({
    name: CHANNEL_LABELS[id] || id,
    fee: Math.round(s.total_fee * 100) / 100,
    delay: Math.round(s.total_delay_penalty * 100) / 100,
    sla: Math.round(s.total_sla_penalty * 100) / 100,
    risk: Math.round(s.total_risk_penalty * 100) / 100,
  }));

  const tooltipStyle = { background: "hsl(225,20%,10%)", border: "1px solid hsl(225,15%,25%)", borderRadius: "8px", color: "#fff" };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-6">
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-bold mb-4 neon-glow-blue">Transaction Distribution</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-bold mb-4 neon-glow-cyan">Cost Breakdown (₹)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={12} />
            <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="fee" name="Channel Fee" fill="hsl(210,100%,55%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="delay" name="Delay Penalty" fill="hsl(270,60%,55%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sla" name="SLA Penalty" fill="hsl(45,100%,55%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="risk" name="Risk Penalty" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default CostCharts;

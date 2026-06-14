import { motion } from "framer-motion";
import type { Assignment } from "@/lib/routing-engine";

const CHANNEL_COLORS: Record<string, string> = {
  Channel_F: "bg-neon-blue/20 border-neon-blue/50 text-neon-blue",
  Channel_S: "bg-neon-purple/20 border-neon-purple/50 text-neon-purple",
  Channel_B: "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan",
};
const CHANNEL_LABELS: Record<string, string> = {
  Channel_F: "FAST",
  Channel_S: "STANDARD",
  Channel_B: "BULK",
};

interface RoutingVisualizationProps {
  assignments: Assignment[];
}

const RoutingVisualization = ({ assignments }: RoutingVisualizationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <h3 className="font-display text-xl font-bold mb-6 neon-glow-blue">
        Routing Flow
      </h3>
      <div className="space-y-3">
        {assignments.map((a, i) => (
          <motion.div
            key={a.tx_id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-4"
          >
            <span className="font-mono text-sm text-foreground w-12 font-bold">{a.tx_id}</span>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-neon-blue/60 to-transparent relative">
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-cyan"
                animate={{ x: [0, 100, 200] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
            </div>
            {a.failed ? (
              <span className="text-xs px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50 text-destructive font-semibold">
                FAILED
              </span>
            ) : (
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${CHANNEL_COLORS[a.channel_id!] || ""}`}>
                {CHANNEL_LABELS[a.channel_id!] || a.channel_id} @ t={a.start_time}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RoutingVisualization;

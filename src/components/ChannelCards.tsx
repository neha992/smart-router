import { motion } from "framer-motion";
import { Zap, Clock, Package } from "lucide-react";
import { DEFAULT_CHANNELS } from "@/lib/routing-engine";
import { formatINR } from "@/lib/utils";

const icons = [Zap, Clock, Package];
const glowClasses = ["neon-border-blue", "neon-border-purple", "neon-border-cyan"];
const labels = ["FAST", "STANDARD", "BULK"];

const ChannelCards = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {DEFAULT_CHANNELS.map((ch, i) => {
        const Icon = icons[i];
        return (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`glass-card border ${glowClasses[i]} p-6 text-center transition-all duration-300`}
          >
            <Icon className="w-10 h-10 mx-auto mb-4 text-foreground" />
            <h3 className="font-display text-xl font-bold mb-4">{labels[i]}</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p>Speed: <span className="text-foreground font-semibold">{ch.latency} min</span></p>
              <p>Base Fee: <span className="text-foreground font-semibold">{formatINR(ch.fee)}</span></p>
              <p>Capacity: <span className="text-foreground font-semibold">{ch.capacity}</span></p>
              <p>Liquidity: <span className="text-foreground font-semibold">{formatINR(ch.liquidity)}</span></p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChannelCards;

import { motion } from "framer-motion";
import { Gauge, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface SimulationControlsProps {
  congestionMode: boolean;
  onCongestionChange: (v: boolean) => void;
  simulationSpeed: number;
  onSpeedChange: (v: number) => void;
}

const SimulationControls = ({ congestionMode, onCongestionChange, simulationSpeed, onSpeedChange }: SimulationControlsProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-5">
      <h3 className="font-display text-sm font-bold mb-4 neon-glow-cyan uppercase tracking-wider">Simulation Settings</h3>
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-neon-cyan" />
          <label className="text-sm font-semibold text-foreground">Congestion Mode</label>
          <Switch checked={congestionMode} onCheckedChange={onCongestionChange} />
          {congestionMode && <span className="text-xs text-yellow-400 font-semibold">FAST latency ×2</span>}
        </div>
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <Gauge className="w-4 h-4 text-neon-purple" />
          <label className="text-sm font-semibold text-foreground whitespace-nowrap">Speed</label>
          <Slider value={[simulationSpeed]} onValueChange={v => onSpeedChange(v[0])} min={200} max={2000} step={100} className="flex-1" />
          <span className="text-xs text-muted-foreground w-14 text-right">{simulationSpeed}ms</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SimulationControls;

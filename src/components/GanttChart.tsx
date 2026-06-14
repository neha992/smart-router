import { motion } from "framer-motion";
import type { Assignment } from "@/lib/routing-engine";
import { formatINR } from "@/lib/utils";

const CHANNEL_ORDER = ["Channel_F", "Channel_S", "Channel_B"];
const CHANNEL_LABELS: Record<string, string> = { Channel_F: "FAST", Channel_S: "STANDARD", Channel_B: "BULK" };
const CHANNEL_COLORS: Record<string, string> = {
  Channel_F: "bg-neon-blue",
  Channel_S: "bg-neon-purple",
  Channel_B: "bg-neon-cyan",
};

interface GanttChartProps {
  assignments: Assignment[];
}

const GanttChart = ({ assignments }: GanttChartProps) => {
  const scheduled = assignments.filter(a => !a.failed && a.start_time !== null && a.end_time !== null);
  if (scheduled.length === 0) return null;

  const maxTime = Math.max(...scheduled.map(a => a.end_time!)) + 1;
  const timeSlots = Array.from({ length: maxTime + 1 }, (_, i) => i);

  const rows = CHANNEL_ORDER.map(chId => ({
    chId,
    label: CHANNEL_LABELS[chId],
    tasks: scheduled.filter(a => a.channel_id === chId),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6">
      <h3 className="font-display text-xl font-bold mb-6 neon-glow-blue">Timeline / Gantt Chart</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Time header */}
          <div className="flex mb-1">
            <div className="w-28 shrink-0" />
            <div className="flex-1 flex">
              {timeSlots.map(t => (
                <div key={t} className="flex-1 text-center text-xs text-muted-foreground font-mono">t={t}</div>
              ))}
            </div>
          </div>

          {/* Channel rows */}
          {rows.map(({ chId, label, tasks }) => (
            <div key={chId} className="flex items-center mb-2">
              <div className="w-28 shrink-0 text-sm font-display font-bold text-foreground pr-3 text-right">{label}</div>
              <div className="flex-1 relative h-10 bg-muted/30 rounded-lg border border-border/50">
                {tasks.map((task, i) => {
                  const left = (task.start_time! / maxTime) * 100;
                  const width = ((task.end_time! - task.start_time!) / maxTime) * 100;
                  return (
                    <motion.div
                      key={task.tx_id}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }}
                      className={`absolute top-1 bottom-1 ${CHANNEL_COLORS[chId]} rounded-md flex items-center justify-center text-xs font-bold text-background origin-left cursor-default`}
                      title={`${task.tx_id}: t=${task.start_time}→${task.end_time}, ${formatINR(task.total_cost)}`}
                    >
                      <span className="truncate px-1">{task.tx_id}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GanttChart;

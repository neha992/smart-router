import { motion } from "framer-motion";
import { Download } from "lucide-react";
import type { RoutingResult } from "@/lib/routing-engine";
import { formatINR } from "@/lib/utils";

interface OutputSectionProps {
  result: RoutingResult;
}

const OutputSection = ({ result }: OutputSectionProps) => {
  const jsonOutput = JSON.stringify(
    {
      assignments: result.assignments.map(a => ({
        tx_id: a.tx_id,
        channel_id: a.channel_id,
        start_time: a.start_time,
        ...(a.failed ? { failed: true } : {}),
      })),
      total_system_cost_estimate: result.total_system_cost_estimate,
    },
    null,
    2
  );

  const handleDownload = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submission.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold neon-glow-blue">
          submission.json
        </h3>
        <button onClick={handleDownload} className="btn-neon-outline flex items-center gap-2 px-4 py-2 text-sm">
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
      <div className="bg-background/60 rounded-lg p-4 overflow-auto max-h-96 border border-border">
        <pre className="text-sm text-neon-cyan font-mono whitespace-pre">{jsonOutput}</pre>
      </div>
      <div className="mt-4 text-center">
        <p className="text-2xl font-display font-bold neon-glow-cyan">
          Total Cost: {formatINR(result.total_system_cost_estimate)}
        </p>
      </div>
    </motion.div>
  );
};

export default OutputSection;

import { motion } from "framer-motion";
import { Clock, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface PaymentStep {
  label: string;
  status: "pending" | "active" | "completed" | "failed";
  timestamp?: string;
}

interface PaymentTrackerProps {
  steps: PaymentStep[];
  paymentId?: string;
  amount?: number;
  recipient?: string;
}

const stepIcons = {
  pending: Clock,
  active: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const stepColors = {
  pending: "text-muted-foreground border-border/40 bg-muted/20",
  active: "text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10",
  completed: "text-neon-green border-neon-green/40 bg-neon-green/10",
  failed: "text-red-400 border-red-400/40 bg-red-400/10",
};

const lineColors = {
  pending: "bg-border/30",
  active: "bg-neon-cyan/40",
  completed: "bg-neon-green/50",
  failed: "bg-red-400/50",
};

export default function PaymentTracker({ steps, paymentId, amount, recipient }: PaymentTrackerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-muted/10 border border-border/20 p-5 space-y-4"
    >
      {/* Header */}
      {(paymentId || amount) && (
        <div className="flex items-center justify-between">
          <div>
            {paymentId && <p className="text-[10px] text-muted-foreground font-mono">{paymentId}</p>}
            {amount != null && (
              <p className="text-lg font-bold text-foreground">{formatINR(amount)}</p>
            )}
          </div>
          {recipient && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3" />
              <span>{recipient}</span>
            </div>
          )}
        </div>
      )}

      {/* Step tracker */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = stepIcons[step.status];
          return (
            <div key={step.label} className="flex items-center flex-1">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${stepColors[step.status]}`}
                >
                  <Icon className={`w-4 h-4 ${step.status === "active" ? "animate-spin" : ""}`} />
                </motion.div>
                <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{step.label}</span>
                {step.timestamp && (
                  <span className="text-[8px] text-muted-foreground">{step.timestamp}</span>
                )}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 mx-1.5">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.15 + 0.1, duration: 0.4 }}
                    className={`h-0.5 rounded-full origin-left ${lineColors[step.status]}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, Search, Plus, ArrowRight, ShieldAlert, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePayments, type Payment } from "@/hooks/usePayments";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

interface Dispute {
  id: string;
  payment_id: string;
  user_id: string;
  reason: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  open: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Open — Under Review" },
  investigating: { icon: Search, color: "text-blue-500", bg: "bg-blue-500/10", label: "Investigating" },
  resolved: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Resolved" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Rejected" },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const Disputes = () => {
  const { user } = useAuth();
  const { payments } = usePayments();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Eligible payments for disputes (successful ones — money sent but not received)
  const eligiblePayments = payments.filter(
    p => (p.status === "success" || p.status === "failed") && !disputes.some(d => d.payment_id === p.id)
  );

  const fetchDisputes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setDisputes(data as unknown as Dispute[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`${user.id}:disputes`, { config: { private: true } })
      .on("postgres_changes", { event: "*", schema: "public", table: "disputes", filter: `user_id=eq.${user.id}` }, () => fetchDisputes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchDisputes]);

  const handleSubmitDispute = async () => {
    if (!selectedPayment || !reason.trim()) {
      toast.error("Select a payment and describe the issue");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("disputes").insert({
        payment_id: selectedPayment,
        user_id: user!.id,
        reason: reason.trim(),
      } as any);
      if (error) throw error;

      // Also create a notification
      await supabase.from("notifications").insert({
        user_id: user!.id,
        type: "alert",
        title: "Dispute Filed",
        message: `Your dispute has been submitted and is under review.`,
      });

      toast.success("Dispute filed successfully! We'll review it shortly.");
      setShowCreate(false);
      setSelectedPayment("");
      setReason("");
      fetchDisputes();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const getPayment = (paymentId: string) => payments.find(p => p.id === paymentId);

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-foreground">
          🛡️ Disputes & Claims
        </motion.h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          File Dispute
        </button>
      </div>

      {/* Explainer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-primary/5 border border-primary/20 p-4"
      >
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Money sent but not received?</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              If you sent money and the recipient hasn't received it, file a dispute below.
              We'll investigate the transaction, check with the payment gateway, and resolve it.
              Most disputes are resolved within 24-48 hours.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Create dispute form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-muted/10 border border-border/30 p-4 space-y-3 overflow-hidden"
          >
            <h3 className="text-xs font-semibold text-foreground">File a New Dispute</h3>

            {/* Select payment */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Select the payment with an issue</label>
              {eligiblePayments.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/60 italic">No eligible payments found. Only completed or failed payments can be disputed.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {eligiblePayments.slice(0, 10).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPayment(p.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                        selectedPayment === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border/20 bg-background/30 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {formatINR(Number(p.amount))} → {p.recipient}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {p.gateway} · {p.status} · {formatTime(p.created_at)}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        selectedPayment === p.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">What went wrong?</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., I sent ₹500 to John but he hasn't received it after 2 hours..."
                className="w-full bg-background/50 border border-border/30 rounded-lg p-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/40 resize-none h-20"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitDispute}
              disabled={!selectedPayment || !reason.trim() || submitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Submit Dispute <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disputes list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted/10 animate-pulse" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-muted/10 border border-border/30 p-8 text-center"
        >
          <CheckCircle2 className="w-8 h-8 text-green-500/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No disputes</p>
          <p className="text-xs text-muted-foreground">All your payments are looking good! 🎉</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d, i) => {
            const payment = getPayment(d.payment_id);
            const cfg = statusConfig[d.status] || statusConfig.open;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-muted/10 border border-border/20 p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{cfg.label}</p>
                      <p className="text-[9px] text-muted-foreground">Filed {formatTime(d.created_at)}</p>
                    </div>
                  </div>
                  {payment && (
                    <span className="text-xs font-bold text-foreground">
                      {formatINR(Number(payment.amount))}
                    </span>
                  )}
                </div>

                {payment && (
                  <div className="text-[10px] text-muted-foreground bg-muted/10 rounded-lg p-2">
                    To: <span className="text-foreground">{payment.recipient}</span> · Via: <span className="text-foreground">{payment.gateway}</span>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">{d.reason}</p>

                {d.resolution_note && (
                  <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-2">
                    <p className="text-[10px] font-medium text-green-500">Resolution:</p>
                    <p className="text-[10px] text-muted-foreground">{d.resolution_note}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Disputes;

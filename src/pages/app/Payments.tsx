import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Download, ArrowRight, Check, Zap, Shield, DollarSign,
  RotateCcw, ChevronDown, Copy, CheckCircle2
} from "lucide-react";
import { mockGateways, currencies } from "@/lib/mock-data";
import { usePayments } from "@/hooks/usePayments";
import PaymentTracker, { type PaymentStep } from "@/components/PaymentTracker";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Payments = () => {
  const [tab, setTab] = useState<"send" | "receive">("send");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [showRouting, setShowRouting] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [trackerSteps, setTrackerSteps] = useState<PaymentStep[] | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [payLink, setPayLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const activePaymentAmount = useRef<number>(0);
  const activePaymentRecipient = useRef<string>("");
  const { user } = useAuth();
  const { refetch } = usePayments();

  const bestGateway = mockGateways.reduce((a, b) => {
    const scoreA = a.successRate * 0.5 - a.avgFee * 0.3 - a.avgResponseTime * 0.002;
    const scoreB = b.successRate * 0.5 - b.avgFee * 0.3 - b.avgResponseTime * 0.002;
    return scoreA > scoreB ? a : b;
  });

  const chosenGateway = manualOverride && selectedGateway
    ? mockGateways.find(g => g.id === selectedGateway)!
    : bestGateway;

  const savings = manualOverride && selectedGateway
    ? Math.max(0, (mockGateways.find(g => g.id === selectedGateway)?.avgFee ?? 0) - bestGateway.avgFee)
    : mockGateways.reduce((max, g) => Math.max(max, g.avgFee), 0) - bestGateway.avgFee;

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Handle sending money via backend
  const handleSend = async () => {
    if (!amount || !recipient) return;
    setProcessing(true);
    setPayLink(null);

    const fee = (parseFloat(amount) * chosenGateway.avgFee) / 100;
    activePaymentAmount.current = parseFloat(amount);
    activePaymentRecipient.current = recipient;

    // Step 1: Initiated
    setTrackerSteps([
      { label: "Initiated", status: "completed", timestamp: now() },
      { label: "Processing", status: "active" },
      { label: "Routed", status: "pending" },
      { label: "Completed", status: "pending" },
    ]);

    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          amount: parseFloat(amount),
          currency,
          recipient,
          gateway: chosenGateway.name,
          fee,
          type: "send",
        },
      });

      if (error) throw error;

      const result = data as {
        error?: string;
        fallback?: boolean;
        payment_id: string;
        status: string;
        risk_score?: number;
        failure_reason?: string;
        message: string;
      };

      // Handle structured errors returned as 200
      if (result.error || result.fallback) {
        throw new Error(result.error || "Payment processing failed");
      }

      setActivePaymentId(result.payment_id);

      // Step 2: Routed
      setTrackerSteps([
        { label: "Initiated", status: "completed", timestamp: now() },
        { label: "Processing", status: "completed", timestamp: now() },
        { label: "Routed", status: "completed", timestamp: now() },
        { label: result.status === "success" ? "Completed" : "Failed", status: "pending" },
      ]);

      await new Promise(r => setTimeout(r, 800));

      if (result.status === "success") {
        setTrackerSteps([
          { label: "Initiated", status: "completed", timestamp: now() },
          { label: "Processing", status: "completed", timestamp: now() },
          { label: "Routed", status: "completed", timestamp: now() },
          { label: "Completed", status: "completed", timestamp: now() },
        ]);
        toast.success(`${formatINR(Number(amount))} sent to ${recipient} successfully!`);
      } else {
        setTrackerSteps([
          { label: "Initiated", status: "completed", timestamp: now() },
          { label: "Processing", status: "completed", timestamp: now() },
          { label: "Routed", status: "completed", timestamp: now() },
          { label: "Failed", status: "failed", timestamp: now() },
        ]);
        toast.error(result.failure_reason || "Payment failed. You can retry.");
      }

      refetch();
    } catch (err) {
      console.error("Payment error:", err);
      setTrackerSteps([
        { label: "Initiated", status: "completed", timestamp: now() },
        { label: "Processing", status: "failed", timestamp: now() },
        { label: "Routed", status: "pending" },
        { label: "Completed", status: "pending" },
      ]);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle receive — generate a shareable payment link
  const handleReceive = () => {
    if (!amount) {
      toast.error("Enter an amount to generate a payment link.");
      return;
    }
    const link = `${window.location.origin}/pay?to=${encodeURIComponent(user?.email || "user")}&amount=${amount}&currency=${currency}`;
    setPayLink(link);
    toast.success("Payment link generated!");
  };

  const copyLink = () => {
    if (!payLink) return;
    navigator.clipboard.writeText(payLink);
    setLinkCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (tab === "send") {
      handleSend();
    } else {
      handleReceive();
    }
  };

  const cur = currencies.find(c => c.code === currency)!;

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
        {(["send", "receive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setTrackerSteps(null); setPayLink(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "send" ? <Send className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {t === "send" ? "Send Money" : "Request Money"}
          </button>
        ))}
      </div>

      {/* Payment Tracker (send only) */}
      <AnimatePresence>
        {trackerSteps && tab === "send" && (
          <PaymentTracker
            steps={trackerSteps}
            paymentId={activePaymentId ?? undefined}
            amount={activePaymentAmount.current}
            recipient={activePaymentRecipient.current}
          />
        )}
      </AnimatePresence>

      {/* Generated Payment Link (receive only) */}
      <AnimatePresence>
        {payLink && tab === "receive" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-neon-green" />
              <span className="text-xs font-semibold text-foreground">Payment Link Ready</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Share this link with anyone to request <strong className="text-foreground">{cur.symbol}{amount} {currency}</strong>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 rounded-lg bg-muted/20 text-[10px] text-muted-foreground truncate font-mono">
                {payLink}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neon-green/20 text-neon-green text-xs font-medium"
              >
                {linkCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {linkCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amount input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="rounded-2xl bg-muted/10 border border-border/30 p-5">
          <label className="text-xs text-muted-foreground mb-2 block">
            {tab === "send" ? "Amount to Send" : "Amount to Request"}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{cur.symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setShowRouting(!!e.target.value); }}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
            />
            <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30 text-xs text-muted-foreground">
              {currency} <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {currencies.slice(0, 4).map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  currency === c.code ? "bg-neon-cyan/20 text-neon-cyan" : "bg-muted/20 text-muted-foreground"
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient (send only) */}
        {tab === "send" && (
          <div className="rounded-2xl bg-muted/10 border border-border/30 p-5">
            <label className="text-xs text-muted-foreground mb-2 block">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Name, email, or phone number"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        )}

        {/* Smart Routing (send only) */}
        {showRouting && tab === "send" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-cyan" />
                <span className="text-xs font-semibold text-foreground">Best Route Auto-Selected</span>
              </div>
              <button onClick={() => setManualOverride(!manualOverride)} className="text-[10px] text-neon-cyan underline">
                {manualOverride ? "Use auto" : "Change"}
              </button>
            </div>

            {!manualOverride ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/20">
                <span className="text-xl">{bestGateway.logo}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{bestGateway.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {bestGateway.successRate}% success · {bestGateway.avgFee}% fee · {bestGateway.avgResponseTime}ms
                  </p>
                </div>
                <Check className="w-4 h-4 text-neon-green" />
              </div>
            ) : (
              <div className="space-y-2">
                {mockGateways.map(gw => (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedGateway(gw.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedGateway === gw.id
                        ? "border-neon-cyan bg-neon-cyan/10"
                        : "border-border/20 bg-background/30 hover:bg-muted/20"
                    }`}
                  >
                    <span className="text-lg">{gw.logo}</span>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-foreground">{gw.name}</p>
                      <p className="text-[10px] text-muted-foreground">{gw.successRate}% · {gw.avgFee}% fee</p>
                    </div>
                    {gw.id === bestGateway.id && (
                      <span className="text-[9px] bg-neon-green/20 text-neon-green px-1.5 py-0.5 rounded-full">Best</span>
                    )}
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      selectedGateway === gw.id ? "border-neon-cyan bg-neon-cyan" : "border-muted-foreground/30"
                    }`} />
                  </button>
                ))}
              </div>
            )}

            {savings > 0 && !manualOverride && (
              <div className="flex items-center gap-2 text-neon-green text-[11px]">
                <DollarSign className="w-3 h-3" />
                <span>Saving {savings.toFixed(1)}% vs highest-fee gateway</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Auto-retry notice (send only) */}
        {tab === "send" && amount && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/10 text-[11px] text-muted-foreground">
            <RotateCcw className="w-3 h-3" />
            <span>Auto-retry enabled — if payment fails, we'll try up to 3 times</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={tab === "send" ? (!amount || !recipient || processing) : !amount}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-cyan text-background font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
        >
          {processing ? (
            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {tab === "send" ? "Send Payment" : "Generate Payment Link"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.div>

      {/* Fraud Detection */}
      {amount && parseFloat(amount) > 10000 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3 flex items-start gap-2"
        >
          <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-yellow-400">High-Value Transaction</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Amounts over ₹10,000 may require extra verification for security.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Payments;

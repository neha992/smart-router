import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, ArrowRight, Upload, FileText, AlertTriangle } from "lucide-react";
import { type Transaction, parseCSV } from "@/lib/routing-engine";

interface TransactionInputProps {
  onTransactionsReady: (transactions: Transaction[]) => void;
}

const EMPTY_ROW: Transaction = { tx_id: "", amount: 0, arrival_time: 0, max_delay: 5, priority: 1, risk_score: 0 };

const SAMPLE_DATA: Transaction[] = [
  { tx_id: "T1", amount: 50000, arrival_time: 0, max_delay: 5, priority: 3, risk_score: 0.2 },
  { tx_id: "T2", amount: 200000, arrival_time: 5, max_delay: 15, priority: 1, risk_score: 0.1 },
  { tx_id: "T3", amount: 10000, arrival_time: 2, max_delay: 8, priority: 2, risk_score: 0.8 },
  { tx_id: "T4", amount: 75000, arrival_time: 1, max_delay: 4, priority: 3, risk_score: 0.3 },
  { tx_id: "T5", amount: 30000, arrival_time: 3, max_delay: 10, priority: 1, risk_score: 0.5 },
  { tx_id: "T6", amount: 45000, arrival_time: 0, max_delay: 6, priority: 2, risk_score: 0.9 },
  { tx_id: "T7", amount: 120000, arrival_time: 4, max_delay: 12, priority: 1, risk_score: 0.05 },
  { tx_id: "T8", amount: 8000, arrival_time: 2, max_delay: 3, priority: 3, risk_score: 0.6 },
];

const TransactionInput = ({ onTransactionsReady }: TransactionInputProps) => {
  const [rows, setRows] = useState<Transaction[]>([
    { tx_id: "T1", amount: 50000, arrival_time: 0, max_delay: 5, priority: 3, risk_score: 0.2 },
  ]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"manual" | "upload">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, { ...EMPTY_ROW, tx_id: `T${prev.length + 1}` }]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index: number, field: keyof Transaction, value: string | number) => {
    setRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: field === "tx_id" ? value : Number(value) } : row
      )
    );
  }, []);

  const loadSample = useCallback(() => setRows([...SAMPLE_DATA]), []);

  const handleSubmit = useCallback(() => {
    const valid = rows.filter(r => r.tx_id && r.amount > 0);
    if (valid.length > 0) onTransactionsReady(valid);
  }, [rows, onTransactionsReady]);

  const handleCSVUpload = useCallback((file: File) => {
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text.trim()) { setCsvError("File is empty"); return; }
        const parsed = parseCSV(text);
        if (parsed.length === 0) { setCsvError("No valid transactions found"); return; }
        const invalid = parsed.filter(t => !t.tx_id || t.amount <= 0);
        if (invalid.length > 0) setCsvError(`${invalid.length} rows had issues but valid ones were loaded`);
        const valid = parsed.filter(t => t.tx_id && t.amount > 0);
        if (valid.length > 0) {
          setRows(valid);
          setActiveTab("manual");
        }
      } catch {
        setCsvError("Failed to parse CSV. Check format: tx_id,amount,arrival_time,max_delay,priority,risk_score");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleCSVUpload(file);
  }, [handleCSVUpload]);

  const isValid = rows.some(r => r.tx_id && r.amount > 0);
  const inputClass = "bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 md:p-8">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab("manual")}
          className={`font-display text-sm font-bold px-4 py-2 rounded-lg transition-all ${activeTab === "manual" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40" : "text-muted-foreground hover:text-foreground"}`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`font-display text-sm font-bold px-4 py-2 rounded-lg transition-all ${activeTab === "upload" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Upload className="w-3.5 h-3.5 inline mr-1.5" />CSV Upload
        </button>
        <div className="flex-1" />
        {activeTab === "manual" && (
          <button onClick={loadSample} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 transition-all">
            <Sparkles className="w-3 h-3" /> Load Sample
          </button>
        )}
      </div>

      {activeTab === "upload" && (
        <div className="mb-6">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neon-cyan/30 rounded-xl p-10 text-center cursor-pointer transition-all duration-300 hover:border-neon-cyan/60 hover:bg-neon-cyan/5"
          >
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVUpload(f); }} />
            <Upload className="w-10 h-10 mx-auto mb-3 text-neon-cyan/60" />
            <p className="text-foreground font-semibold">Drag & drop transactions.csv</p>
            <p className="text-muted-foreground text-sm mt-1">Required columns: tx_id, amount, arrival_time, max_delay, priority, risk_score</p>
          </div>
          {csvError && (
            <div className="flex items-center gap-2 mt-3 text-sm text-yellow-400">
              <AlertTriangle className="w-4 h-4" /> {csvError}
            </div>
          )}
        </div>
      )}

      {activeTab === "manual" && (
        <>
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.6fr_0.8fr_36px] gap-2 mb-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>TX ID</span>
            <span>Amount (₹)</span>
            <span>Arrival</span>
            <span>Max Delay</span>
            <span>Priority</span>
            <span>Risk Score</span>
            <span />
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
            <AnimatePresence initial={false}>
              {rows.map((row, i) => (
                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.6fr_0.8fr_36px] gap-2">
                  <input value={row.tx_id} onChange={e => updateRow(i, "tx_id", e.target.value)} placeholder="TX ID" className={inputClass} />
                  <input type="number" value={row.amount || ""} onChange={e => updateRow(i, "amount", e.target.value)} placeholder="Amount" className={inputClass} />
                  <input type="number" value={row.arrival_time} onChange={e => updateRow(i, "arrival_time", e.target.value)} placeholder="Arrival" className={inputClass} />
                  <input type="number" value={row.max_delay} onChange={e => updateRow(i, "max_delay", e.target.value)} placeholder="Max Delay" className={inputClass} />
                  <input type="number" value={row.priority} onChange={e => updateRow(i, "priority", e.target.value)} placeholder="Pri" min={1} max={3} className={inputClass} />
                  <input type="number" value={row.risk_score} onChange={e => updateRow(i, "risk_score", e.target.value)} placeholder="Risk" min={0} max={1} step={0.1} className={inputClass} />
                  <button onClick={() => removeRow(i)} className="flex items-center justify-center text-destructive/60 hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 h-[38px]" disabled={rows.length <= 1}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <button onClick={addRow} className="flex items-center gap-1.5 text-sm font-semibold text-neon-cyan hover:text-neon-cyan/80 transition-colors">
              <Plus className="w-4 h-4" /> Add Row
            </button>
            <button onClick={handleSubmit} disabled={!isValid} className="btn-neon flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Run Smart Routing <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      <p className="text-muted-foreground text-xs mt-3 text-center">
        {rows.length} transaction{rows.length !== 1 ? "s" : ""} loaded
      </p>
    </motion.div>
  );
};

export default TransactionInput;

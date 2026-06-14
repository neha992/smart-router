import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ParticleBackground from "@/components/ParticleBackground";
import TransactionInput from "@/components/TransactionInput";
import ChannelCards from "@/components/ChannelCards";
import RoutingVisualization from "@/components/RoutingVisualization";
import CostCharts from "@/components/CostCharts";
import OutputSection from "@/components/OutputSection";
import GanttChart from "@/components/GanttChart";
import ResultsTable from "@/components/ResultsTable";
import SimulationControls from "@/components/SimulationControls";
import { runRouting, type RoutingResult, type Transaction } from "@/lib/routing-engine";

const Dashboard = () => {
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [congestionMode, setCongestionMode] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(800);

  const handleTransactionsReady = useCallback((transactions: Transaction[]) => {
    setIsProcessing(true);
    setResult(null);
    setTimeout(() => {
      const r = runRouting(transactions, { congestionMode });
      setResult(r);
      setIsProcessing(false);
    }, simulationSpeed);
  }, [congestionMode, simulationSpeed]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-border/30 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-[10px] font-bold text-background">S+</div>
                <span className="font-display text-base font-bold text-foreground">CSV Simulator</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button onClick={() => navigate("/app")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Open App
                  </button>
                  <button onClick={signOut} className="btn-neon-outline text-xs px-3 py-1.5">Sign Out</button>
                </>
              ) : (
                <button onClick={() => navigate("/login")} className="btn-neon text-xs px-4 py-1.5 flex items-center gap-1">
                  <LogIn className="w-3 h-3" /> Login
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="container mx-auto px-6 py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold neon-glow-blue mb-3">
              Transaction Routing Simulator
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Upload a CSV file or enter transactions manually to simulate intelligent multi-channel routing with dynamic fees, risk scoring, and SLA enforcement.
            </p>
          </motion.div>
        </section>

        {/* Channels */}
        <section className="container mx-auto px-6 py-6">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="font-display text-xl font-bold text-center mb-6 neon-glow-cyan">
            Settlement Channels
          </motion.h2>
          <ChannelCards />
        </section>

        {/* Controls */}
        <section className="container mx-auto px-6 py-4 max-w-4xl">
          <SimulationControls
            congestionMode={congestionMode}
            onCongestionChange={setCongestionMode}
            simulationSpeed={simulationSpeed}
            onSpeedChange={setSimulationSpeed}
          />
        </section>

        {/* Input */}
        <section className="container mx-auto px-6 py-8 max-w-5xl">
          <TransactionInput onTransactionsReady={handleTransactionsReady} />
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-6">
              <div className="inline-flex items-center gap-3 glass-card px-6 py-3">
                <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                <span className="text-neon-cyan text-sm font-semibold">Running simulation...</span>
              </div>
            </motion.div>
          )}
        </section>

        {/* Results */}
        {result && (
          <section className="container mx-auto px-6 py-12 space-y-10">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="font-display text-2xl font-bold text-center neon-glow-blue">
              Routing Results
            </motion.h2>
            <ResultsTable result={result} />
            <GanttChart assignments={result.assignments} />
            <RoutingVisualization assignments={result.assignments} />
            <CostCharts result={result} />
            <OutputSection result={result} />
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-border/30 mt-16">
          <div className="container mx-auto px-6 py-8 text-center text-muted-foreground text-sm">
            <p className="font-display">SmartSettle++</p>
            <p className="text-xs">CSV-based Transaction Routing Simulator</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;

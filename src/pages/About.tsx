import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Shield, BarChart3, Clock, Users, Code } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";

const features = [
  { icon: Zap, title: "Smart Routing", description: "Greedy priority-based scheduler optimizes cost across FAST, STANDARD, and BULK channels in real-time.", color: "neon-border-blue" },
  { icon: Shield, title: "Risk Management", description: "High-risk transactions (score > 0.7) are automatically blocked from BULK channels. Regulatory limits enforced.", color: "neon-border-purple" },
  { icon: BarChart3, title: "Cost Optimization", description: "Dynamic fees adjust based on channel load. Total cost includes fees, delay penalties, SLA violations, and risk surcharges.", color: "neon-border-cyan" },
  { icon: Clock, title: "SLA Enforcement", description: "Priority-based deadlines ensure critical transactions settle within strict time windows.", color: "neon-border-green" },
  { icon: Users, title: "Multi-Channel", description: "Three settlement channels with different fee structures, capacities, latencies, and liquidity pools.", color: "neon-border-blue" },
  { icon: Code, title: "Full-Stack", description: "Built with React, TypeScript, Framer Motion, Recharts, and Lovable Cloud for auth and data persistence.", color: "neon-border-purple" },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10">
        <nav className="border-b border-border/50 backdrop-blur-md">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <span className="font-display text-xl font-bold neon-glow-blue cursor-pointer" onClick={() => navigate("/")}>
              SmartSettle++
            </span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/" className="hover:text-foreground transition-colors">Home</a>
              <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
              <a href="/login" className="hover:text-foreground transition-colors">Login</a>
            </div>
          </div>
        </nav>

        <section className="container mx-auto px-6 py-16 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-8 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="font-display text-4xl md:text-5xl font-black neon-glow-blue mb-4">About SmartSettle++</h1>
            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
              SmartSettle++ is an intelligent payment routing and settlement simulation engine. It demonstrates how modern fintech systems can optimize transaction costs while respecting real-world constraints like channel capacity, liquidity limits, regulatory rules, and risk scoring.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className={`glass-card p-6 h-full ${f.color}`}>
                  <f.icon className="w-6 h-6 text-neon-cyan mb-3" />
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <div className="glass-card p-8 text-center">
              <h2 className="font-display text-2xl font-bold neon-glow-cyan mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-neon-cyan">1</span>
                  </div>
                  <p className="text-muted-foreground">Enter transactions manually or upload a CSV file with amount, priority, and risk scores.</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-neon-cyan">2</span>
                  </div>
                  <p className="text-muted-foreground">The routing engine assigns each transaction to the optimal channel based on constraints and cost.</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-neon-cyan">3</span>
                  </div>
                  <p className="text-muted-foreground">View results with interactive charts, Gantt timelines, and download the schedule as CSV.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <footer className="border-t border-border/50 mt-8">
          <div className="container mx-auto px-6 py-8 text-center text-muted-foreground text-sm">
            <p className="font-display">SmartSettle++</p>
            <p>Advanced Payment Routing & Settlement Optimizer — Hackathon 2026</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default About;

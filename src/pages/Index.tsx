import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Zap, ArrowLeftRight, Wallet, ShieldCheck, ChevronRight, Check
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ParticleBackground from "@/components/ParticleBackground";

const stats = [
  { value: "$12.4M+", label: "Transactions Processed" },
  { value: "99.2%", label: "Success Rate" },
  { value: "$48K+", label: "Fees Saved" },
  { value: "148ms", label: "Avg Latency" },
];

const coreFeatures = [
  {
    icon: ArrowLeftRight,
    title: "Send & Receive",
    description: "Transfer money instantly to anyone, anywhere. Secure, fast, and tracked every step of the way.",
    color: "from-neon-blue to-neon-cyan",
    path: "/app/payments",
  },
  {
    icon: Wallet,
    title: "Smart Wallet",
    description: "Manage your balance, view history, and keep track of all your payments in one clean dashboard.",
    color: "from-neon-purple to-neon-blue",
    path: "/app/wallet",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
    description: "Every transaction is encrypted and monitored. Dispute resolution built-in for complete peace of mind.",
    color: "from-neon-cyan to-neon-green",
    path: "/app/disputes",
  },
];

const pricingPlans = [
  { name: "Starter", price: "Free", features: ["Up to 1K transactions/mo", "Basic wallet", "Payment tracking", "Email alerts"], highlighted: false },
  { name: "Pro", price: "$49/mo", features: ["Unlimited transactions", "Advanced analytics", "Priority support", "Dispute management"], highlighted: true },
  { name: "Enterprise", price: "Custom", features: ["Custom integrations", "Dedicated support", "SLA guarantees", "White-label option"], highlighted: false },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-border/30 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-xs font-bold text-background">
                S+
              </div>
              <span className="font-display text-lg font-bold text-foreground">SmartSettle++</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="/about" className="hover:text-foreground transition-colors">About</a>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <button onClick={() => navigate("/app")} className="btn-neon text-xs px-5 py-2">
                  Open Dashboard <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                    Sign In
                  </button>
                  <button onClick={() => navigate("/login")} className="btn-neon text-xs px-5 py-2 flex items-center gap-1.5">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="container mx-auto px-6 pt-20 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan text-xs font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Simple & Secure Payments
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="neon-glow-blue">Send Money</span>
              <br />
              <span className="text-foreground">Receive Money</span>
              <br />
              <span className="bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent">Track Everything</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
              A clean, easy-to-use payment dashboard for everyone. Send funds, receive payments, 
              check your wallet, and stay on top of every transaction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate(user ? "/app" : "/login")} className="btn-neon flex items-center gap-2 text-base px-8 py-4">
                {user ? "Open Dashboard" : "Start Free"} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Stats Bar */}
        <section className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 md:p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="font-display text-2xl md:text-3xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Core Features */}
        <section id="features" className="container mx-auto px-6 py-20">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need in <span className="neon-glow-cyan">One Place</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              SmartSettle++ makes managing your money simple, secure, and straightforward.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {coreFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate(feature.path)}
                className="glass-card p-6 group hover:neon-border-cyan transition-all duration-300 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-background" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-neon-cyan font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="container mx-auto px-6 py-20">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How <span className="neon-glow-blue">SmartSettle++</span> Works
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Send", description: "Enter the recipient, amount, and choose a payment method. Confirm in one tap." },
              { step: "02", title: "Track", description: "Watch your payment move from pending to completed with a clear progress tracker." },
              { step: "03", title: "Settle", description: "Funds arrive safely. View your updated balance and transaction history anytime." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="font-display text-5xl font-black text-neon-cyan/20 mb-4">{item.step}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container mx-auto px-6 py-20">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent <span className="neon-glow-cyan">Pricing</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 relative ${plan.highlighted ? "neon-border-cyan" : ""}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-neon-cyan text-background text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="font-display text-3xl font-black text-foreground mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(user ? "/app" : "/login")}
                  className={plan.highlighted ? "btn-neon w-full text-sm py-3" : "btn-neon-outline w-full text-sm py-3"}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-10 md:p-16 text-center neon-border-blue"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Join thousands of users sending and receiving money the smart way.
            </p>
            <button onClick={() => navigate(user ? "/app" : "/login")} className="btn-neon text-base px-10 py-4 inline-flex items-center gap-2">
              {user ? "Go to Dashboard" : "Start Free — No Card Required"} <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 mt-8">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-xs font-bold text-background">S+</div>
                  <span className="font-display text-sm font-bold text-foreground">SmartSettle++</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Simple, secure payment management for everyone.
                </p>
              </div>
              {[
                { title: "Product", links: ["Payments", "Wallet", "Transactions", "Disputes"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
              ].map(col => (
                <div key={col.title}>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-border/20 pt-6 text-center text-xs text-muted-foreground">
              © 2026 SmartSettle++. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;

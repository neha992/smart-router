import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, ArrowLeftRight, BarChart3, Bell, Wallet, Route,
  ListOrdered, Settings, Menu, X, User, ShieldAlert, CircuitBoard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import AIChatbot from "@/components/AIChatbot";

const navItems = [
  { path: "/app", icon: Home, label: "Home" },
  { path: "/app/payments", icon: ArrowLeftRight, label: "Payments" },
  { path: "/app/transactions", icon: ListOrdered, label: "Transactions" },
  { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/app/routing", icon: Route, label: "Routing" },
  { path: "/app/smart-routing", icon: CircuitBoard, label: "Smart Routing" },
  { path: "/app/notifications", icon: Bell, label: "Alerts" },
  { path: "/app/wallet", icon: Wallet, label: "Wallet" },
  { path: "/app/disputes", icon: ShieldAlert, label: "Disputes" },
  { path: "/app/settings", icon: Settings, label: "Settings" },
];

const mobileNavItems = [
  { path: "/app", icon: Home, label: "Home" },
  { path: "/app/payments", icon: ArrowLeftRight, label: "Pay" },
  { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/app/notifications", icon: Bell, label: "Alerts" },
  { path: "/app/wallet", icon: Wallet, label: "Wallet" },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);

  // Desktop sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border/20">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-xs font-bold text-background">
          S+
        </div>
        <span className="font-display text-sm font-bold text-foreground">SmartSettle++</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-neon-cyan/10 text-neon-cyan"
                  : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-cyan"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border/20">
        <button
          onClick={() => { navigate("/app/profile"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-xs font-bold text-background">
            {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {profile?.display_name || user?.email?.split("@")[0]}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-60 border-r border-border/20 bg-card/50 backdrop-blur-xl flex-shrink-0 sticky top-0 h-screen">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-60 bg-card border-r border-border/30"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted/30">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              )}
              {isMobile && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-[10px] font-bold text-background">
                    S+
                  </div>
                  <span className="font-display text-xs font-bold text-foreground">SmartSettle++</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/app/notifications")}
                className="relative p-2 rounded-full hover:bg-muted/50 transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-neon-cyan rounded-full" />
              </button>
              <button
                onClick={() => navigate("/app/profile")}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground"
              >
                {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto ${isMobile ? "pb-20" : ""}`}>
          <div className="max-w-4xl mx-auto px-4 py-5">
            <Outlet />
          </div>
        </main>

        {/* Floating AI Assistant */}
        <AIChatbot />

        {/* Bottom navigation (mobile only) */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/30 safe-area-bottom">
            <div className="max-w-lg mx-auto flex items-center justify-around py-2">
              {mobileNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
                  >
                    {active && (
                      <motion.div
                        layoutId="bottomNav"
                        className="absolute -top-0.5 w-8 h-0.5 bg-neon-cyan rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        active ? "text-neon-cyan" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-[10px] transition-colors ${
                        active ? "text-neon-cyan font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default AppLayout;

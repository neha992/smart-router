import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, LogOut, Shield, Moon, Sun, Lock, ChevronRight,
  Info, Zap, Bell, Globe, Palette, Database, Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [pinLock, setPinLock] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    document.documentElement.classList.toggle("light", !newValue);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/smartsettle-project.zip";
    link.download = "smartsettle-project.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", action: () => navigate("/app/profile") },
        { icon: Shield, label: "Security Settings", action: () => {} },
        { icon: Lock, label: "PIN Lock", toggle: true, value: pinLock, onChange: () => setPinLock(!pinLock) },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: darkMode ? Moon : Sun, label: "Dark Mode", toggle: true, value: darkMode, onChange: toggleDarkMode },
        { icon: Bell, label: "Push Notifications", toggle: true, value: pushNotifications, onChange: () => setPushNotifications(!pushNotifications) },
        { icon: Zap, label: "Auto-Retry Failed Payments", toggle: true, value: autoRetry, onChange: () => setAutoRetry(!autoRetry) },
      ],
    },
    {
      title: "App",
      items: [
        { icon: Database, label: "Simulation Engine", action: () => navigate("/dashboard") },
        { icon: Info, label: "About SmartSettle++", action: () => navigate("/about") },
        { icon: Download, label: "Download Project Code", action: handleDownload },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-foreground">
        Settings
      </motion.h1>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate("/app/profile")}
        className="flex items-center gap-3 p-4 rounded-2xl bg-muted/10 border border-border/20 cursor-pointer hover:bg-muted/20 transition-colors"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-lg font-bold text-background">
          {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {profile?.display_name || user?.email?.split("@")[0]}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      {/* Currency selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-4 rounded-2xl bg-muted/10 border border-border/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Default Currency</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["USD", "EUR", "GBP", "INR", "JPY"].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCurrency(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCurrency === c
                  ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                  : "bg-muted/20 text-muted-foreground border border-transparent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Setting sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (si + 1) * 0.05 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h2>
          <div className="rounded-2xl bg-muted/10 border border-border/20 overflow-hidden divide-y divide-border/10">
            {section.items.map(item => (
              <button
                key={item.label}
                onClick={item.toggle ? item.onChange : item.action}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/10 transition-colors"
              >
                <item.icon className="w-[18px] h-[18px] text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground text-left">{item.label}</span>
                {item.toggle ? (
                  <div className={`w-10 h-[22px] rounded-full transition-colors relative ${
                    item.value ? "bg-neon-cyan" : "bg-muted/50"
                  }`}>
                    <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-background shadow transition-transform ${
                      item.value ? "translate-x-[22px]" : "translate-x-[3px]"
                    }`} />
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </motion.button>

      <p className="text-center text-[10px] text-muted-foreground/50 pt-2 pb-4">
        SmartSettle++ v2.0 · Smart Payment Router Dashboard
      </p>
    </div>
  );
};

export default SettingsPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, LogOut, Shield, Moon, Sun, Lock, ChevronRight,
  Info, Zap, ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [pinLock, setPinLock] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: Shield, label: "Security Settings", action: () => {} },
    { icon: Lock, label: "PIN Lock", toggle: true, value: pinLock, onChange: () => setPinLock(!pinLock) },
    { icon: darkMode ? Moon : Sun, label: "Dark Mode", toggle: true, value: darkMode, onChange: () => setDarkMode(!darkMode) },
    { icon: Zap, label: "Simulation Engine", action: () => navigate("/") },
    { icon: Info, label: "About SmartSettle++", action: () => navigate("/about") },
  ];

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-4"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center mb-3">
          <User className="w-10 h-10 text-background" />
        </div>
        <h1 className="text-lg font-bold text-foreground">
          {profile?.display_name || user?.email?.split("@")[0]}
        </h1>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </motion.div>

      {/* Savings card */}
      <div className="rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/20 p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Total Money Saved</p>
        <p className="font-display text-2xl font-black text-neon-green">₹12,450.30</p>
        <p className="text-[10px] text-muted-foreground mt-1">Through smart routing optimization</p>
      </div>

      {/* Menu items */}
      <div className="space-y-1">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={item.toggle ? item.onChange : item.action}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/10 transition-colors"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground text-left">{item.label}</span>
            {item.toggle ? (
              <div className={`w-9 h-5 rounded-full transition-colors relative ${
                item.value ? "bg-neon-cyan" : "bg-muted/50"
              }`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
                  item.value ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>

      <p className="text-center text-[10px] text-muted-foreground/50 pt-4">
        SmartSettle++ v2.0 · Hackathon 2026
      </p>
    </div>
  );
};

export default Profile;

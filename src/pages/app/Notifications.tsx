import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CreditCard, TrendingUp, AlertTriangle, Sparkles, Check, Trash2, Plus, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function getIcon(type: string) {
  switch (type) {
    case "payment": return CreditCard;
    case "settlement": return TrendingUp;
    case "alert": return AlertTriangle;
    case "suggestion": return Sparkles;
    default: return Bell;
  }
}

function getColor(type: string) {
  switch (type) {
    case "payment": return "bg-neon-cyan/10 text-neon-cyan";
    case "settlement": return "bg-neon-green/10 text-neon-green";
    case "alert": return "bg-yellow-400/10 text-yellow-400";
    case "suggestion": return "bg-neon-purple/10 text-neon-purple";
    default: return "bg-muted/20 text-muted-foreground";
  }
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SAMPLE_NOTIFICATIONS = [
  { type: "payment", title: "Payment Received", message: "You received ₹2,500 from Alice Johnson via Stripe" },
  { type: "alert", title: "Gateway Degraded", message: "PayU success rate dropped below 97%. Consider alternative routing." },
  { type: "suggestion", title: "Cost Saving Tip", message: "Batch settling 3 pending transactions could save ₹210 in fees" },
  { type: "settlement", title: "Settlement Complete", message: "STL-001 (₹45,000) has been settled via FAST channel" },
];

const Notifications = () => {
  const { notifications, loading, unreadCount, markAllRead, markRead, deleteNotification, createNotification } = useNotifications();
  const [filter, setFilter] = useState<string>("all");
  const [seeding, setSeeding] = useState(false);

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  const seedSampleNotifications = async () => {
    setSeeding(true);
    try {
      for (const n of SAMPLE_NOTIFICATIONS) {
        await createNotification(n);
      }
      toast.success("Sample notifications created!");
    } catch {
      toast.error("Failed to create notifications");
    }
    setSeeding(false);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    toast("Notification deleted");
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-[10px] font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-neon-cyan flex items-center gap-1">
              <Check className="w-3 h-3" /> Read all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["all", "payment", "settlement", "alert", "suggestion"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-neon-cyan/20 text-neon-cyan" : "bg-muted/20 text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-xl bg-muted/10 border border-border/20 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-48" />
            </div>
          ))}
        </div>
      )}

      {/* Notification list */}
      {!loading && (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((n) => {
              const Icon = getIcon(n.type);
              const colorClass = getColor(n.type);
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  layout
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    n.read
                      ? "bg-muted/5 border-border/10"
                      : "bg-muted/15 border-border/30"
                  }`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                    className="p-1 rounded hover:bg-red-400/10 text-muted-foreground/40 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No notifications yet</p>
          <button
            onClick={seedSampleNotifications}
            disabled={seeding}
            className="px-4 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-xs font-medium flex items-center gap-2 mx-auto"
          >
            {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Add sample notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;

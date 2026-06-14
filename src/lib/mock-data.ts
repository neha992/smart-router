// Mock data for the fintech app simulation

export interface WalletData {
  balance: number;
  currency: string;
  savings: number;
  pendingSettlements: number;
}

export interface RecentTransaction {
  id: string;
  type: "send" | "receive" | "settlement";
  amount: number;
  currency: string;
  recipient: string;
  status: "completed" | "pending" | "failed" | "processing";
  timestamp: string;
  gateway: string;
  fee: number;
}

export interface Gateway {
  id: string;
  name: string;
  successRate: number;
  avgFee: number;
  avgResponseTime: number;
  status: "active" | "degraded" | "down";
  logo: string;
}

export interface Settlement {
  id: string;
  amount: number;
  channel: string;
  status: "pending" | "processing" | "completed";
  estimatedTime: string;
  createdAt: string;
  fee: number;
  savings: number;
}

export interface Notification {
  id: string;
  type: "payment" | "settlement" | "alert" | "suggestion";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
}

export const mockWallet: WalletData = {
  balance: 84250.75,
  currency: "INR",
  savings: 12450.30,
  pendingSettlements: 3,
};

export const mockGateways: Gateway[] = [
  { id: "gw1", name: "RazorPay", successRate: 98.5, avgFee: 1.2, avgResponseTime: 120, status: "active", logo: "⚡" },
  { id: "gw2", name: "Stripe", successRate: 99.1, avgFee: 2.9, avgResponseTime: 95, status: "active", logo: "💳" },
  { id: "gw3", name: "PayU", successRate: 96.8, avgFee: 0.8, avgResponseTime: 180, status: "degraded", logo: "🏦" },
  { id: "gw4", name: "CCAvenue", successRate: 94.2, avgFee: 1.5, avgResponseTime: 250, status: "active", logo: "🔄" },
];

export const mockTransactions: RecentTransaction[] = [
  { id: "TXN001", type: "send", amount: 2500, currency: "INR", recipient: "Alice Johnson", status: "completed", timestamp: "2026-04-03T10:30:00Z", gateway: "Stripe", fee: 72.5 },
  { id: "TXN002", type: "receive", amount: 15000, currency: "INR", recipient: "Bob Smith Corp", status: "completed", timestamp: "2026-04-03T09:15:00Z", gateway: "RazorPay", fee: 0 },
  { id: "TXN003", type: "settlement", amount: 45000, currency: "INR", recipient: "HDFC Settlement", status: "pending", timestamp: "2026-04-03T08:00:00Z", gateway: "PayU", fee: 360 },
  { id: "TXN004", type: "send", amount: 890, currency: "INR", recipient: "Cloud Services Inc", status: "completed", timestamp: "2026-04-02T18:45:00Z", gateway: "Stripe", fee: 25.81 },
  { id: "TXN005", type: "receive", amount: 7200, currency: "INR", recipient: "Freelance Payment", status: "completed", timestamp: "2026-04-02T14:20:00Z", gateway: "RazorPay", fee: 0 },
  { id: "TXN006", type: "send", amount: 3100, currency: "INR", recipient: "Marketing Agency", status: "failed", timestamp: "2026-04-02T11:00:00Z", gateway: "CCAvenue", fee: 0 },
  { id: "TXN007", type: "settlement", amount: 22000, currency: "INR", recipient: "SBI Settlement", status: "processing", timestamp: "2026-04-01T16:30:00Z", gateway: "PayU", fee: 176 },
  { id: "TXN008", type: "send", amount: 560, currency: "INR", recipient: "Jane Doe", status: "completed", timestamp: "2026-04-01T09:10:00Z", gateway: "RazorPay", fee: 6.72 },
];

export const mockSettlements: Settlement[] = [
  { id: "STL001", amount: 45000, channel: "FAST", status: "pending", estimatedTime: "15 mins", createdAt: "2026-04-03T08:00:00Z", fee: 225, savings: 45 },
  { id: "STL002", amount: 22000, channel: "STANDARD", status: "processing", estimatedTime: "2 hrs", createdAt: "2026-04-01T16:30:00Z", fee: 22, savings: 88 },
  { id: "STL003", amount: 18500, channel: "BULK", status: "pending", estimatedTime: "6 hrs", createdAt: "2026-04-03T07:00:00Z", fee: 3.7, savings: 185 },
  { id: "STL004", amount: 67000, channel: "FAST", status: "completed", estimatedTime: "Done", createdAt: "2026-04-02T10:00:00Z", fee: 335, savings: 67 },
  { id: "STL005", amount: 9800, channel: "STANDARD", status: "completed", estimatedTime: "Done", createdAt: "2026-04-02T08:00:00Z", fee: 9.8, savings: 39.2 },
];

export const mockNotifications: Notification[] = [
  { id: "n1", type: "payment", title: "Payment Received", message: "₹15,000 received from Bob Smith Corp via RazorPay", timestamp: "2026-04-03T09:15:00Z", read: false },
  { id: "n2", type: "suggestion", title: "AI Recommendation", message: "Switch TXN003 from PayU to Stripe to save ₹120 in fees", timestamp: "2026-04-03T08:30:00Z", read: false },
  { id: "n3", type: "settlement", title: "Settlement Processing", message: "STL002 (₹22,000) is now being processed via STANDARD channel", timestamp: "2026-04-03T07:45:00Z", read: false },
  { id: "n4", type: "alert", title: "⚠️ Gateway Degraded", message: "PayU success rate dropped to 96.8%. Consider routing through Stripe.", timestamp: "2026-04-03T07:00:00Z", read: true },
  { id: "n5", type: "payment", title: "Payment Sent", message: "₹2,500 sent to Alice Johnson via Stripe", timestamp: "2026-04-03T10:30:00Z", read: true },
  { id: "n6", type: "alert", title: "🚨 Failed Transaction", message: "TXN006 to Marketing Agency failed via CCAvenue. Auto-retry initiated.", timestamp: "2026-04-02T11:05:00Z", read: true },
  { id: "n7", type: "suggestion", title: "Cost Savings Alert", message: "Batch settling 3 pending transactions could save ₹210 in fees", timestamp: "2026-04-02T09:00:00Z", read: true },
];

export const mockBadges: Badge[] = [
  { id: "b1", name: "First Transaction", description: "Complete your first payment", icon: "🎯", earned: true, progress: 100 },
  { id: "b2", name: "Cost Saver", description: "Save ₹1,000 in routing fees", icon: "💰", earned: true, progress: 100 },
  { id: "b3", name: "Speed Demon", description: "Process 100 FAST channel settlements", icon: "⚡", earned: false, progress: 72 },
  { id: "b4", name: "Bulk Master", description: "Route ₹1M through BULK channel", icon: "📦", earned: false, progress: 45 },
  { id: "b5", name: "Zero Failures", description: "Achieve 7 days with 0 failed transactions", icon: "🛡️", earned: false, progress: 85 },
  { id: "b6", name: "Multi-Currency Pro", description: "Transact in 5 different currencies", icon: "🌍", earned: true, progress: 100 },
];

export const mockAnalyticsData = {
  dailyVolume: [
    { date: "Mar 28", volume: 125000, transactions: 42 },
    { date: "Mar 29", volume: 189000, transactions: 58 },
    { date: "Mar 30", volume: 145000, transactions: 51 },
    { date: "Mar 31", volume: 210000, transactions: 67 },
    { date: "Apr 01", volume: 178000, transactions: 55 },
    { date: "Apr 02", volume: 195000, transactions: 62 },
    { date: "Apr 03", volume: 167000, transactions: 48 },
  ],
  gatewayPerformance: [
    { name: "RazorPay", success: 98.5, volume: 450000, fees: 5400 },
    { name: "Stripe", success: 99.1, volume: 380000, fees: 11020 },
    { name: "PayU", success: 96.8, volume: 290000, fees: 2320 },
    { name: "CCAvenue", success: 94.2, volume: 120000, fees: 1800 },
  ],
  costSavings: [
    { month: "Jan", saved: 1850, total: 8200 },
    { month: "Feb", saved: 2100, total: 9400 },
    { month: "Mar", saved: 3200, total: 12800 },
    { month: "Apr", saved: 5300, total: 15600 },
  ],
  successByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    rate: 94 + Math.random() * 6,
    volume: Math.floor(2000 + Math.random() * 8000),
  })),
};

export const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.5 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 150.2 },
];

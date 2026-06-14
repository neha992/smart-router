import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import About from "./pages/About.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppHome from "./pages/app/AppHome.tsx";
import Payments from "./pages/app/Payments.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import Notifications from "./pages/app/Notifications.tsx";
import WalletPage from "./pages/app/WalletPage.tsx";
import Routing from "./pages/app/Routing.tsx";
import SmartRouting from "./pages/app/SmartRouting.tsx";
import Profile from "./pages/app/Profile.tsx";
import Transactions from "./pages/app/Transactions.tsx";
import SettingsPage from "./pages/app/SettingsPage.tsx";
import AutoSwitch from "./pages/app/AutoSwitch.tsx";
import AIPredictions from "./pages/app/AIPredictions.tsx";
import MultiCurrency from "./pages/app/MultiCurrency.tsx";
import SmartAlerts from "./pages/app/SmartAlerts.tsx";
import Disputes from "./pages/app/Disputes.tsx";
import RouteMaster from "./pages/RouteMaster.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/routemaster" element={<RouteMaster />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Fintech App Routes */}
            <Route path="/app" element={
              <ProtectedRoute><AppLayout /></ProtectedRoute>
            }>
              <Route index element={<AppHome />} />
              <Route path="payments" element={<Payments />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="routing" element={<Routing />} />
              <Route path="smart-routing" element={<SmartRouting />} />
              <Route path="auto-switch" element={<AutoSwitch />} />
              <Route path="predictions" element={<AIPredictions />} />
              <Route path="multi-currency" element={<MultiCurrency />} />
              <Route path="smart-alerts" element={<SmartAlerts />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

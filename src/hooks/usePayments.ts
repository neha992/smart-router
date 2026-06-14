import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  recipient: string;
  gateway: string;
  fee: number;
  status: string;
  type: string;
  risk_score: number | null;
  failure_reason: string | null;
  initiated_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPayments(data as unknown as Payment[]);
    setLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`${user.id}:payments`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${user.id}` },
        () => fetchPayments()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchPayments]);

  const createPayment = async (data: {
    amount: number;
    currency: string;
    recipient: string;
    gateway: string;
    fee: number;
    type: string;
  }) => {
    if (!user) return null;
    const { data: row, error } = await supabase
      .from("payments")
      .insert({ ...data, user_id: user.id, status: "pending" })
      .select()
      .single();
    if (error) throw error;
    return row as unknown as Payment;
  };

  const updateStatus = async (id: string, status: string, extra?: Record<string, unknown>) => {
    const { error } = await supabase
      .from("payments")
      .update({ status, ...extra })
      .eq("id", id);
    if (error) throw error;
  };

  const stats = {
    total: payments.length,
    success: payments.filter(p => p.status === "success").length,
    failed: payments.filter(p => p.status === "failed").length,
    pending: payments.filter(p => p.status === "pending" || p.status === "processing").length,
    totalVolume: payments.reduce((s, p) => s + Number(p.amount), 0),
    totalFees: payments.reduce((s, p) => s + Number(p.fee), 0),
    successRate: payments.length > 0
      ? ((payments.filter(p => p.status === "success").length / payments.length) * 100).toFixed(1)
      : "0",
  };

  return { payments, loading, stats, createPayment, updateStatus, refetch: fetchPayments };
}

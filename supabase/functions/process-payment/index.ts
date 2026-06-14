import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { amount, currency, recipient, gateway, fee, type } = body;

    // Validate inputs
    if (!amount || amount <= 0 || !recipient || !gateway || !type) {
      return new Response(JSON.stringify({ error: "Invalid payment data" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Create payment record as pending
    const { data: payment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount,
        currency: currency || "USD",
        recipient,
        gateway,
        fee: fee || 0,
        type,
        status: "pending",
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create payment", fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Move to processing
    const { error: procError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "processing",
        processing_started_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (procError) {
      console.error("Processing error:", procError);
      await supabaseAdmin.from("payments")
        .update({ status: "failed", failure_reason: "Processing error", completed_at: new Date().toISOString() })
        .eq("id", payment.id);
      return new Response(JSON.stringify({ payment_id: payment.id, status: "failed", failure_reason: "Processing error", message: "Payment failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Simulate gateway routing + risk check
    const riskScore = amount > 10000 ? Math.random() * 40 + 60 : Math.random() * 30;
    const isHighRisk = riskScore > 80;
    const successChance = isHighRisk ? 0.5 : 0.92;
    const isSuccess = Math.random() < successChance;

    const finalRisk = Math.round(riskScore);

    if (isSuccess) {
      const { error: successError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "success",
          risk_score: finalRisk,
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (successError) {
        console.error("Finalize error:", successError);
        // Don't fail — payment was actually processed, just couldn't update status
        // Try one more time
        await supabaseAdmin.from("payments")
          .update({ status: "success", risk_score: finalRisk, completed_at: new Date().toISOString() })
          .eq("id", payment.id);
      }

      // Create success notification (best-effort, don't fail on this)
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: user.id,
          type: "payment",
          title: "Payment Sent",
          message: `$${amount} sent to ${recipient} via ${gateway}`,
        });
      } catch (e) {
        console.error("Notification error:", e);
      }

      return new Response(JSON.stringify({
        payment_id: payment.id,
        status: "success",
        risk_score: finalRisk,
        message: "Payment completed successfully",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const failureReason = isHighRisk ? "High risk score - additional verification needed" : "Gateway timeout";

      await supabaseAdmin.from("payments")
        .update({
          status: "failed",
          risk_score: finalRisk,
          failure_reason: failureReason,
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: user.id,
          type: "alert",
          title: "Payment Failed",
          message: `$${amount} to ${recipient} failed: ${failureReason}`,
        });
      } catch (e) {
        console.error("Notification error:", e);
      }

      return new Response(JSON.stringify({
        payment_id: payment.id,
        status: "failed",
        risk_score: finalRisk,
        failure_reason: failureReason,
        message: "Payment failed",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

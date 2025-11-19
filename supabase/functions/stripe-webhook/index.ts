import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.11.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe signature");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentRecordId = paymentIntent.metadata.payment_record_id;

      if (paymentRecordId) {
        const amountPaid = paymentIntent.amount / 100;

        const { data: record } = await supabase
          .from("payment_records")
          .select("amount_paid, amount_due, late_fee_applied")
          .eq("id", paymentRecordId)
          .maybeSingle();

        if (record) {
          const totalPaid = (record.amount_paid || 0) + amountPaid;
          const totalDue = record.amount_due + record.late_fee_applied;

          let status = "pending";
          if (totalPaid >= totalDue) {
            status = "paid";
          } else if (totalPaid > 0) {
            status = "partial";
          }

          await supabase
            .from("payment_records")
            .update({
              amount_paid: totalPaid,
              status: status,
              paid_at: status === "paid" ? new Date().toISOString() : null,
            })
            .eq("id", paymentRecordId);

          if (status === "paid") {
            const { data: parentData } = await supabase
              .from("payment_records")
              .select("parent_id, payment_requests(team_id, title)")
              .eq("id", paymentRecordId)
              .maybeSingle();

            if (parentData) {
              await supabase.from("notifications").insert({
                user_id: parentData.parent_id,
                team_id: parentData.payment_requests.team_id,
                type: "payment_request",
                title: "Payment Received",
                message: `Your payment for "${parentData.payment_requests.title}" has been processed successfully.`,
              });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

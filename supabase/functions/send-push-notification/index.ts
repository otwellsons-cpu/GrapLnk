import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, message, type } = await req.json();

    if (!userId || !title || !message) {
      throw new Error("Missing required fields");
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subError) throw subError;

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { type },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Length": payload.length.toString(),
              TTL: "86400",
            },
            body: payload,
          });

          if (!response.ok && (response.status === 404 || response.status === 410)) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }

          return response.ok;
        } catch (error) {
          console.error("Error sending push:", error);
          return false;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        total: subscriptions.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
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

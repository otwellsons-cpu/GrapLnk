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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { teamId, subject, message } = await req.json();

    if (!teamId || !subject || !message) {
      throw new Error("Missing required fields");
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || membership.role !== "coach") {
      throw new Error("Only coaches can send blast messages");
    }

    const { data: blastMessage, error: blastError } = await supabase
      .from("blast_messages")
      .insert({
        team_id: teamId,
        sent_by: user.id,
        subject,
        message,
      })
      .select()
      .single();

    if (blastError) throw blastError;

    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .neq("user_id", user.id);

    if (teamMembers && teamMembers.length > 0) {
      const notifications = teamMembers.map((member) => ({
        user_id: member.user_id,
        team_id: teamId,
        type: "blast_message",
        title: subject,
        message: message,
      }));

      await supabase.from("notifications").insert(notifications);

      for (const member of teamMembers) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: member.user_id,
              title: subject,
              message: message,
              type: "blast_message",
            }),
          });
        } catch (error) {
          console.error("Error sending push notification:", error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: blastMessage.id,
        recipientCount: teamMembers?.length || 0,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending blast message:", error);
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

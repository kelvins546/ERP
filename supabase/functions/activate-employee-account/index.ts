import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function hashToken(token: string) {
  const encoded = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return jsonResponse({ success: false, error: "Missing activation token." }, 400);
    }

    if (!password || typeof password !== "string") {
      return jsonResponse({ success: false, error: "Missing password." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { success: false, error: "Server is missing Supabase environment variables." },
        500,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const tokenHash = await hashToken(token);

    const inviteResult = await supabaseAdmin.rpc("get_employee_invite_by_token", {
      p_token_hash: tokenHash,
    });

    if (inviteResult.error) {
      return jsonResponse({ success: false, error: inviteResult.error.message }, 400);
    }

    const inviteRecord = Array.isArray(inviteResult.data)
      ? inviteResult.data[0]
      : inviteResult.data;

    if (!inviteRecord) {
      return jsonResponse({ success: false, error: "This activation link is invalid." }, 400);
    }

    if (inviteRecord.used_at) {
      return jsonResponse({ success: false, error: "This activation link was already used." }, 400);
    }

    const expiresAt = new Date(inviteRecord.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return jsonResponse({ success: false, error: "This activation link has expired." }, 400);
    }

    const createUserResult = await supabaseAdmin.auth.admin.createUser({
      email: inviteRecord.email,
      password,
      email_confirm: true,
      user_metadata: {
        employee_id: inviteRecord.employee_id,
      },
    });

    if (createUserResult.error) {
      return jsonResponse({ success: false, error: createUserResult.error.message }, 400);
    }

    const authUserId = createUserResult.data.user?.id;
    if (!authUserId) {
      return jsonResponse(
        { success: false, error: "Failed to finalize activation: missing auth user id." },
        500,
      );
    }

    const employeeUpdateResult = await supabaseAdmin
      .from("employees")
      .update({ auth_id: authUserId })
      .eq("id", inviteRecord.employee_id);

    if (employeeUpdateResult.error) {
      return jsonResponse({ success: false, error: employeeUpdateResult.error.message }, 400);
    }

    const consumeResult = await supabaseAdmin.rpc("consume_employee_invite", {
      p_token_hash: tokenHash,
    });

    if (consumeResult.error) {
      return jsonResponse({ success: false, error: consumeResult.error.message }, 400);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected activation error.";
    return jsonResponse({ success: false, error: message }, 500);
  }
});

import emailjs from "@emailjs/browser";
import { supabase } from "@/api/base44Client";

const INVITE_VALIDITY_DAYS = 7;

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomInviteToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashInviteToken(token) {
  const encoded = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}

function buildInviteLink(token) {
  const baseUrl = import.meta.env.VITE_BASE44_APP_BASE_URL || window.location.origin;
  const url = new URL("/activate-account", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

function getMissingEmailJsEnv() {
  const required = [
    "VITE_EMAILJS_SERVICE_ID",
    "VITE_EMAILJS_PUBLIC_KEY",
  ];

  const missing = required.filter((key) => !import.meta.env[key]);
  const hasTemplate = Boolean(
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID_INVITE ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  );

  if (!hasTemplate) {
    missing.push("VITE_EMAILJS_TEMPLATE_ID_INVITE (or VITE_EMAILJS_TEMPLATE_ID)");
  }

  return missing;
}

export async function createEmployeeInviteAndSendEmail({
  employeeId,
  email,
  toName,
  role,
  projectSiteName,
  departmentName,
  positionName,
}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Employee email is required to send an activation invite.");
  }

  const missingEnv = getMissingEmailJsEnv();
  if (missingEnv.length > 0) {
    throw new Error(
      `Missing EmailJS environment variables: ${missingEnv.join(", ")}`,
    );
  }

  const inviteToken = randomInviteToken();
  const inviteTokenHash = await hashInviteToken(inviteToken);
  const expiresAt = new Date(Date.now() + INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: inviteError } = await supabase.from("employee_auth_invites").insert([
    {
      employee_id: employeeId,
      email: normalizedEmail,
      invite_token_hash: inviteTokenHash,
      expires_at: expiresAt,
    },
  ]);

  if (inviteError) {
    throw new Error(`Failed to create invite token: ${inviteError.message}`);
  }

  const inviteLink = buildInviteLink(inviteToken);
  const resolvedRole = positionName || role || "";
  const assignmentItems = [
    projectSiteName ? `Project Site: ${projectSiteName}` : "",
    departmentName ? `Department: ${departmentName}` : "",
    resolvedRole ? `Position: ${resolvedRole}` : "",
  ].filter(Boolean);

  const templateParams = {
    to_email: normalizedEmail,
    recipient_email: normalizedEmail,
    email: normalizedEmail,
    to_name: toName || "Team Member",
    role: resolvedRole || "employee",
    project_site: projectSiteName || "",
    department: departmentName || "",
    position: resolvedRole || "",
    assignment_summary: assignmentItems.length
      ? `Assigned details: ${assignmentItems.join(" | ")}.`
      : "",
    invite_link: inviteLink,
    company_name: "Ark Industries",
    support_email: import.meta.env.VITE_SUPPORT_EMAIL || "support@arkindustries.com",
    expires_in_days: String(INVITE_VALIDITY_DAYS),
  };

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID_INVITE || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      },
    );
  } catch (error) {
    await supabase
      .from("employee_auth_invites")
      .delete()
      .eq("invite_token_hash", inviteTokenHash)
      .is("used_at", null);

    const reason = error?.text || error?.message || "Unknown EmailJS error";
    if (String(reason).toLowerCase().includes("insufficient authentication scopes")) {
      throw new Error(
        "Email provider authorization is incomplete. Reconnect your Gmail service in EmailJS and grant full send-email permissions, then try again.",
      );
    }
    if (String(reason).toLowerCase().includes("recipients address is empty")) {
      throw new Error(
        "EmailJS template recipient is not configured. Set the template 'To Email' to {{to_email}} and try again.",
      );
    }
    throw new Error(`Failed to send invite email: ${reason}`);
  }

  return { expiresAt };
}

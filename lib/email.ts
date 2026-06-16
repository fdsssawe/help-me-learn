import "server-only"

// Where admin/ops notifications are sent.
export const ADMIN_EMAIL = "zhovanukolexander@gmail.com"

// Minimal email sender via Resend's HTTP API (no SDK needed). Best-effort:
// if RESEND_API_KEY isn't set, or the request fails, we log and move on so a
// notification never breaks the user-facing action.
//
// Env:
//   RESEND_API_KEY  — required to actually send (https://resend.com)
//   EMAIL_FROM      — optional; defaults to Resend's shared sandbox sender,
//                     which can only deliver to your own Resend account email.
//                     Set a verified-domain address for general delivery.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped sending "${subject}" to ${to}`)
    return false
  }
  const from = process.env.EMAIL_FROM ?? "Lexora <onboarding@resend.dev>"
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}): ${await res.text()}`)
      return false
    }
    return true
  } catch (err) {
    console.error("[email] send threw", err)
    return false
  }
}

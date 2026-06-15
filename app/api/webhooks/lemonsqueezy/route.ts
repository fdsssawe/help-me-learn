import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

// Statuses that should keep Pro access. "cancelled" still has access until it expires.
const PRO_STATUSES = ["active", "on_trial", "cancelled", "past_due"]

type LemonEvent = {
  meta?: { event_name?: string; custom_data?: { user_id?: string } }
  data?: { id?: string | number; attributes?: Record<string, unknown> }
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 })

  const raw = await request.text()
  const signature = request.headers.get("x-signature") ?? ""
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
  const ok =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 })

  let event: LemonEvent
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 })
  }

  const name = event.meta?.event_name ?? ""
  const userId = event.meta?.custom_data?.user_id
  const attr = (event.data?.attributes ?? {}) as Record<string, unknown>

  if (userId && name.startsWith("subscription_")) {
    const status = typeof attr.status === "string" ? attr.status : undefined
    const pro = PRO_STATUSES.includes(status ?? "")
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: pro ? "pro" : "free",
          subscriptionStatus: status ?? null,
          lemonSubscriptionId: event.data?.id != null ? String(event.data.id) : undefined,
          lemonCustomerId: attr.customer_id != null ? String(attr.customer_id) : undefined,
          subscriptionRenewsAt: typeof attr.renews_at === "string" ? new Date(attr.renews_at) : null,
        },
      })
    } catch {
      // User not found — ack anyway so Lemon Squeezy doesn't retry forever.
    }
  }

  return NextResponse.json({ ok: true })
}

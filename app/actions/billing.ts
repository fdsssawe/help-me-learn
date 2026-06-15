"use server"

import { getCurrentUser } from "@/lib/dal"

// Builds the Lemon Squeezy hosted-checkout URL with the user prefilled, so the
// webhook can map the purchase back to them via custom data.
export async function getCheckoutUrl() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  const base = process.env.LEMONSQUEEZY_CHECKOUT_URL
  if (!base) throw new Error("Checkout isn't set up yet.")
  const url = new URL(base)
  if (user.email) url.searchParams.set("checkout[email]", user.email)
  url.searchParams.set("checkout[custom][user_id]", user.id)
  return url.toString()
}

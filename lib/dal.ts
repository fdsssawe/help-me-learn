import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

// The raw Supabase auth user (no DB hit). Cached per request.
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

// The app profile row, provisioned on first authenticated request.
// Supabase Auth owns identity; this mirrors it into our `User` table (keyed by
// the auth UID) so we can attach xp/streak/words/etc.
export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser()
  if (!authUser) return null

  // Hot path: a single read. Only the first-ever request for a user writes.
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (existing) return existing

  const meta = authUser.user_metadata ?? {}
  const name =
    (meta.name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    null
  const image = (meta.avatar_url as string | undefined) ?? null

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: {}, // race-safe if two first-requests land together
    create: {
      id: authUser.id,
      email: authUser.email ?? null,
      name,
      image,
    },
  })
})

// For Server Actions / data fetching: throws if not signed in.
export async function requireUserId() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user.id
}

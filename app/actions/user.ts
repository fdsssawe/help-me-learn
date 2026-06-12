"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/dal"
import { TARGET_LANGUAGES } from "@/lib/enrichment/languages"

// Set the user's native/translation language (the target meanings & examples use).
export async function setNativeLang(code: string) {
  const userId = await requireUserId()
  if (!TARGET_LANGUAGES.some((t) => t.code === code)) return
  await prisma.user.update({ where: { id: userId }, data: { nativeLang: code } })
  revalidatePath("/", "layout")
}

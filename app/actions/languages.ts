"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId as requireUser } from "@/lib/dal"

export async function getLanguages() {
  const userId = await requireUser()
  return prisma.language.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { words: true } } },
  })
}

export async function createLanguage(data: { name: string; emoji: string }) {
  const userId = await requireUser()
  const created = await prisma.language.create({ data: { ...data, userId } })
  revalidatePath("/vocabulary")
  revalidatePath("/quiz")
  return created
}

export async function deleteLanguage(id: string) {
  const userId = await requireUser()
  await prisma.word.updateMany({
    where: { languageId: id, userId },
    data: { languageId: null },
  })
  await prisma.language.deleteMany({ where: { id, userId } })
  revalidatePath("/vocabulary")
  revalidatePath("/quiz")
}

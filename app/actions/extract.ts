"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/dal"
import {
  addExtractedWords as addExtractedWordsLogic,
  type AddExtractedResult,
} from "@/lib/enrichment/extract"

// Save the user-confirmed subset of extracted words. The heavier extraction /
// dictionary lookup step lives in the /api/extract route (which sets a longer
// maxDuration); saving is quick (all lemmas are already cached by then).
export async function addExtractedWords(
  items: { headword: string; translation: string }[],
  languageId: string
): Promise<AddExtractedResult> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  const result = await addExtractedWordsLogic(user, items, languageId)
  if (result.added > 0) revalidatePath("/vocabulary")
  return result
}

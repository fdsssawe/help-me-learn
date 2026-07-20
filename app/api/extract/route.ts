import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/dal"
import { extractCandidates } from "@/lib/enrichment/extract"

// Dictionary lookups (kaikki) for a cold, word-dense image can take longer than
// the default serverless timeout, so give this route more headroom. OCR itself
// runs client-side, so no image is uploaded here — only a JSON token list.
export const maxDuration = 60

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: { tokens?: unknown; languageId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 })
  }

  const tokens = Array.isArray(body.tokens)
    ? body.tokens.filter((t): t is string => typeof t === "string")
    : []
  const languageId = typeof body.languageId === "string" ? body.languageId : ""
  if (!tokens.length || !languageId) return NextResponse.json({ candidates: [] })

  const candidates = await extractCandidates(user, tokens, languageId)
  return NextResponse.json({ candidates })
}

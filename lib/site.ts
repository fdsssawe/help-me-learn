// Centralized brand + site constants (used by metadata, sitemap, robots, manifest).
export const SITE_NAME = "Lexora"
export const SITE_TAGLINE = "Words that actually stick."
export const SITE_DESCRIPTION =
  "Lexora builds a vocabulary that lasts — auto-enriched dictionary entries, real example sentences, and smart cloze quizzes. Learn Italian and Spanish with translations in English or Ukrainian."

// Set NEXT_PUBLIC_SITE_URL in the environment (Vercel) to the production domain.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lexora.app"

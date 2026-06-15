// Free plan caps total saved words; Pro is unlimited. (Total cap, no daily limit.)
export const FREE_WORD_LIMIT = 200

// Only start showing the "X / 200 words" nudge once the user is this close,
// so new users aren't shown a limit they're nowhere near.
export const WORD_LIMIT_NUDGE_AT = 100

export function isPro(user: { plan: string }) {
  return user.plan === "pro"
}

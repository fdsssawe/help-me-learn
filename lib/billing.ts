// Free plan caps total saved words; Pro is unlimited. (Total cap, no daily limit.)
export const FREE_WORD_LIMIT = 200

export function isPro(user: { plan: string }) {
  return user.plan === "pro"
}

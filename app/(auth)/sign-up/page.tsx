"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleIcon } from "@/components/google-icon"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    setError("")
    setNotice("")
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (data.session) {
      router.push("/dashboard")
      router.refresh()
    } else {
      setNotice("Check your email to confirm your account, then sign in.")
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="card-elevated animate-pop w-full max-w-[420px] px-9 py-10">
      <h1 className="font-display text-[1.9rem] font-extrabold text-text mb-1.5 tracking-[-0.02em]">
        Create your account
      </h1>
      <p className="text-text-muted text-[0.9rem] mb-7">Start your language journey today.</p>

      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full mb-5 gap-2.5"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3 mb-5 text-text-muted text-[0.8rem]">
        <div className="flex-1 h-px bg-border" />
        or
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <Label htmlFor="name" className="mb-1.5 text-[0.85rem]">Your name</Label>
          <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email" className="mb-1.5 text-[0.85rem]">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password" className="mb-1.5 text-[0.85rem]">
            Password <span className="font-normal text-text-muted">(8+ characters)</span>
          </Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-error-bg text-error text-[0.875rem] font-medium">
            {error}
          </div>
        )}
        {notice && (
          <div className="px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-success-bg text-success text-[0.875rem] font-medium">
            {notice}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center mt-5 text-[0.875rem] text-text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary font-semibold no-underline">Sign in</Link>
      </p>
    </div>
  )
}

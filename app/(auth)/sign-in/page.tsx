"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const callbackUrl = params.get("callbackUrl") ?? "/dashboard"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError("Incorrect email or password.")
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    })
  }

  const labelCls = "block text-[0.85rem] font-semibold text-text-secondary mb-1.5"

  return (
    <div className="card-elevated animate-pop w-full max-w-[420px] px-9 py-10">
      <h1 className="font-display text-[1.9rem] font-extrabold text-text mb-1.5 tracking-[-0.02em]">
        Welcome back
      </h1>
      <p className="text-text-muted text-[0.9rem] mb-7">Continue your learning journey.</p>

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
          <label className={labelCls}>Email</label>
          <input className={`input${error ? " error" : ""}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input className={`input${error ? " error" : ""}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-error-bg text-error text-[0.875rem] font-medium">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center mt-5 text-[0.875rem] text-text-muted">
        No account yet?{" "}
        <Link href="/sign-up" className="text-primary font-semibold no-underline">Create one</Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="card-elevated w-[420px] h-[400px]" />}>
      <SignInForm />
    </Suspense>
  )
}

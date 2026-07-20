"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { GoogleIcon } from "@/components/google-icon"

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
          <Label htmlFor="email" className="mb-1.5 text-[0.85rem]">Email</Label>
          <Input id="email" error={!!error} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password" className="mb-1.5 text-[0.85rem]">Password</Label>
          <Input id="password" error={!!error} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
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

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="card-elevated w-full max-w-[420px] px-9 py-10">
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="mb-7 h-4 w-56" />
          <Skeleton className="mb-5 h-11 w-full" />
          <Skeleton className="mb-5 h-3 w-full" />
          <Skeleton className="mb-3.5 h-[70px] w-full" />
          <Skeleton className="mb-3.5 h-[70px] w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}

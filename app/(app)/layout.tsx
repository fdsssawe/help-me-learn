import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"
import { getCurrentUser } from "@/lib/dal"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <Nav
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          nativeLang: user.nativeLang,
          plan: user.plan,
          xp: user.xp,
          streak: user.streak,
        }}
      />
      <main className="flex-1 w-full">{children}</main>
    </div>
  )
}

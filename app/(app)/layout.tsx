import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"
import { getCurrentUser } from "@/lib/dal"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Nav user={{ name: user.name, email: user.email, image: user.image }} />
      <main style={{ flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "32px 24px 64px" }}>
        {children}
      </main>
    </div>
  )
}

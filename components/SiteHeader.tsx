import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { Avatar } from "./ui";
import { logout } from "@/app/actions/auth";

export async function SiteHeader() {
  const [user, repo] = await Promise.all([getCurrentUser(), getRepo()]);
  const myForest = user?.houseId ? `/house/${user.houseId}` : "/login";
  const links = [
    { href: myForest, label: "My Forest", emoji: "🌳" },
    { href: "/quests", label: "Quests", emoji: "🧭" },
    { href: "/wildlands", label: "All Houses", emoji: "🏞️" },
    ...(user ? [{ href: `/u/${user.handle}`, label: "Profile", emoji: "🪪" }] : []),
    ...(isAdmin(user) ? [{ href: "/admin", label: "Admin", emoji: "🛠️" }] : []),
  ];

  return (
    <>
      {repo.mode === "demo" && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-cream">
          🧪 Demo mode: sample data held in memory. Connect Supabase for permanent data (see README).
        </div>
      )}
      <header className="sticky top-0 z-30 border-b-2 border-ink/80 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-forest">
            <span aria-hidden className="text-2xl">🌳</span> Wildlands
          </Link>
          <nav aria-label="Main" className="ml-4 hidden gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-leaf-soft">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link href={`/u/${user.handle}`} className="hidden items-center gap-2 sm:flex" aria-label="Your profile">
                  <Avatar profile={user} size={34} />
                  <span className="text-sm font-semibold">{user.name.split(" ")[0]}</span>
                  <span className="pill bg-leaf">🌰 {user.totalSeeds}</span>
                </Link>
                <form action={logout}>
                  <button className="btn btn-ghost btn-sm" type="submit">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Join your house
              </Link>
            )}
          </div>
        </div>
      </header>
      {/* Phone navigation: thumb-friendly bar at the bottom of the screen. */}
      <nav aria-label="Main (mobile)" className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink/80 bg-cream/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-lg justify-around">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link href={l.href} className="flex min-w-14 flex-col items-center px-2 py-1.5 text-[11px] font-semibold">
                <span aria-hidden className="text-xl">
                  {l.emoji}
                </span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

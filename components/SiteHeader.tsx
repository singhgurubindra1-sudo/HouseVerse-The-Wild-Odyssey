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
        <div className="px-3 pt-2 text-center">
          <p className="pill mx-auto inline-flex text-[11px] font-semibold sm:text-xs">
            🧪 Demo mode: sample data held in memory. Connect Supabase for permanent data (see README).
          </p>
        </div>
      )}
      <header className="sticky top-2 z-30 mx-auto max-w-6xl px-3 pt-2">
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-forest">
            <span aria-hidden className="float text-2xl">
              🌳
            </span>{" "}
            Wildlands
          </Link>
          <nav aria-label="Main" className="ml-3 hidden gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-white/50 hover:shadow-sm">
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
      {/* Phone navigation: a floating glass dock at the bottom of the screen. */}
      <nav aria-label="Main (mobile)" className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <ul className="glass mx-auto flex max-w-lg justify-around rounded-3xl px-1 py-1">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link href={l.href} className="flex min-w-14 flex-col items-center rounded-2xl px-2 py-1.5 text-[11px] font-semibold active:bg-white/50">
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

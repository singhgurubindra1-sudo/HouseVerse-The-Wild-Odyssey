import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { demoLogin, demoSignup, googleLogin, passwordAuth } from "@/app/actions/auth";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";
import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "Join your house" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.houseId ? (user.onboarded ? `/house/${user.houseId}` : "/onboarding") : "/login/house");

  const repo = await getRepo();
  const houses = await repo.listHouses();

  if (isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader eyebrow="Step 1 of 3" title="Join your house">
          Sign in with your college Google account or your email. Next you&apos;ll pick your house.
        </PageHeader>
        {error && <Notice tone="error">{error}</Notice>}
        <form action={googleLogin} className="mt-4">
          <SubmitButton className="btn btn-ghost w-full" pendingText="Opening Google…">
            <span aria-hidden>🇬</span> Continue with Google
          </SubmitButton>
        </form>
        <p className="my-5 text-center text-sm text-ink/60">or use your email</p>
        <div className="grid gap-4">
          <ActionForm action={passwordAuth} className="card space-y-3 p-5">
            <h2 className="text-lg font-extrabold">I already have an account</h2>
            <input type="hidden" name="mode" value="signin" />
            <div>
              <label className="label" htmlFor="si-email">Email</label>
              <input id="si-email" name="email" type="email" autoComplete="email" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="si-pass">Password</label>
              <input id="si-pass" name="password" type="password" autoComplete="current-password" required minLength={6} className="field" />
            </div>
            <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
          </ActionForm>
          <ActionForm action={passwordAuth} className="card space-y-3 p-5">
            <h2 className="text-lg font-extrabold">I&apos;m new here</h2>
            <input type="hidden" name="mode" value="signup" />
            <div>
              <label className="label" htmlFor="su-name">Your name</label>
              <input id="su-name" name="name" autoComplete="name" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="su-email">Email</label>
              <input id="su-email" name="email" type="email" autoComplete="email" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="su-pass">Password (6+ characters)</label>
              <input id="su-pass" name="password" type="password" autoComplete="new-password" required minLength={6} className="field" />
            </div>
            <SubmitButton className="btn btn-leaf" pendingText="Creating account…">
              Create my account
            </SubmitButton>
          </ActionForm>
        </div>
      </div>
    );
  }

  // Demo mode: no real login. Start as a new student, or step into a sample account.
  const profiles = await repo.listProfiles();
  const quick = [
    { p: profiles.find((x) => x.houseId === "saranda" && x.role === "member"), why: "Saranda's top ranger, with lots of trees" },
    { p: profiles.find((x) => x.role === "house_admin"), why: "House admin: approves Saranda's quests" },
    { p: profiles.find((x) => x.role === "super_admin"), why: "Organiser: manages all nine houses" },
  ].filter((q) => q.p);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <PageHeader eyebrow="Demo mode" title="Join your house">
          No passwords needed in the demo. Start fresh as a new student (like Priya), or jump into a sample account.
        </PageHeader>
      </div>
      <ActionForm action={demoSignup} className="card space-y-4 p-5">
        <h2 className="text-xl font-extrabold">🌱 Start as a new student</h2>
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" required minLength={2} maxLength={40} placeholder="Priya" className="field" autoComplete="name" />
        </div>
        <fieldset>
          <legend className="label">Pick your house</legend>
          <div className="grid grid-cols-3 gap-2">
            {houses.map((h) => (
              <label key={h.id} className="relative cursor-pointer">
                <input type="radio" name="house" value={h.id} required className="peer sr-only" defaultChecked={h.id === "saranda"} />
                <span className="flex flex-col items-center rounded-2xl border border-white/70 bg-white/35 p-2 text-center text-xs font-bold shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition peer-checked:-translate-y-1 peer-checked:bg-[rgb(170_222_120/0.65)] peer-checked:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_20px_-10px_rgba(14,52,30,0.55)] peer-focus-visible:outline-3 peer-focus-visible:outline-sun">
                  <span className="text-2xl" aria-hidden>
                    {h.mascotEmoji}
                  </span>
                  {h.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <SubmitButton pendingText="Entering the forest…">Start onboarding →</SubmitButton>
      </ActionForm>

      <div className="card space-y-3 p-5">
        <h2 className="text-xl font-extrabold">🔑 Sample accounts</h2>
        <p className="text-sm text-ink/70">Great for the demo: open one in another window to play admin and member side by side.</p>
        {quick.map(({ p, why }) => (
          <form key={p!.id} action={demoLogin}>
            <input type="hidden" name="profileId" value={p!.id} />
            <button data-tilt className="glass flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left" type="submit">
              <span>
                <span className="block font-bold">{p!.name}</span>
                <span className="block text-xs text-ink/70">{why}</span>
              </span>
              <span aria-hidden>→</span>
            </button>
          </form>
        ))}
        <form action={demoLogin} className="flex gap-2 pt-2">
          <label htmlFor="any" className="sr-only">
            Log in as any member
          </label>
          <select id="any" name="profileId" className="field">
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {houses.find((h) => h.id === p.houseId)?.name ?? "no house"}
              </option>
            ))}
          </select>
          <SubmitButton className="btn btn-ghost" pendingText="…">
            Go
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { chooseHouse } from "@/app/actions/auth";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Pick your house" };
export const dynamic = "force-dynamic";

export default async function PickHousePage() {
  const user = await requireUser({ allowNoHouse: true });
  if (user.houseId) redirect(user.onboarded ? `/house/${user.houseId}` : "/onboarding");
  const houses = await (await getRepo()).listHouses();

  return (
    <div>
      <PageHeader eyebrow="Step 2 of 3" title={`Welcome, ${user.name.split(" ")[0]}! Which house are you in?`}>
        Pick the house you were placed in. This can&apos;t be changed later, so choose carefully.
      </PageHeader>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {houses.map((h) => (
          <li key={h.id}>
            <form action={chooseHouse} className="h-full">
              <input type="hidden" name="house" value={h.id} />
              <button type="submit" data-tilt className="card flex h-full w-full flex-col items-start gap-1 p-4 text-left" style={{ boxShadow: `inset 0 4px 0 ${h.colorPrimary}, var(--glass-shadow)` }}>
                <span className="pop text-5xl drop-shadow-[0_8px_8px_rgba(14,52,30,0.3)]" aria-hidden>
                  {h.mascotEmoji}
                </span>
                <span className="text-xl font-extrabold" style={{ color: h.colorPrimary }}>
                  {h.name}
                </span>
                <span className="text-sm text-ink/70">
                  {h.place}, {h.region}
                </span>
                <span className="mt-1 text-xs">Legendary: {h.legendary}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

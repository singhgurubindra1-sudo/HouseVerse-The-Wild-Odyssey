import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const repo = await getRepo();
  const scope = admin.role === "super_admin" ? undefined : (admin.houseId ?? undefined);
  const [pending, house] = await Promise.all([repo.listSubmissions({ status: "pending", houseId: scope }), admin.houseId ? repo.getHouse(admin.houseId) : null]);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Admin Control Room</p>
          <p className="text-sm">
            Signed in as <strong>{admin.name}</strong> ·{" "}
            {admin.role === "super_admin" ? "Super admin (all houses)" : `House admin for ${house?.name ?? "your house"}`}
          </p>
        </div>
      </div>
      <AdminNav pending={pending.length} />
      <div className="mt-6">{children}</div>
    </div>
  );
}

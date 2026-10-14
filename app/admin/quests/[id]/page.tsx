import { notFound } from "next/navigation";
import { canManageHouse, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { QuestForm } from "../QuestForm";

export const metadata = { title: "Edit quest" };

export default async function EditQuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const repo = await getRepo();
  const [quest, houses] = await Promise.all([repo.getQuest(id), repo.listHouses()]);
  if (!quest || !canManageHouse(admin, quest.houseId)) notFound();
  return (
    <div className="card p-5">
      <PageHeader title={`Edit: ${quest.title}`} back={{ href: "/admin/quests", label: "All quests" }} />
      <QuestForm quest={quest} houses={houses} admin={admin} />
    </div>
  );
}

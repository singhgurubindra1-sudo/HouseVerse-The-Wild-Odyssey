import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = { title: "Ranger Onboarding" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const repo = await getRepo();
  const [house, cards, trivia] = await Promise.all([repo.getHouse(user.houseId!), repo.listLoreCards(user.houseId!), repo.listTrivia(user.houseId!)]);
  if (!house) notFound();
  return <OnboardingFlow house={house} cards={cards} trivia={trivia.slice(0, 5)} firstName={user.name.split(" ")[0]} alreadyDone={user.onboarded} />;
}

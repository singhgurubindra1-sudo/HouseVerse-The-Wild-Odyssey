import Link from "next/link";
import { canManageHouse, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { deleteLoreCard, deleteTrivia, saveLoreCard, saveTrivia, updateHouseLore } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";
import { Notice } from "@/components/ui";
import type { LoreCard, TriviaQuestion } from "@/lib/types";

export const metadata = { title: "House lore" };

function CardForm({ houseId, card, position }: { houseId: string; card?: LoreCard; position: number }) {
  return (
    <ActionForm action={saveLoreCard} resetOnSuccess={!card} className="grid grid-cols-[4.5rem_1fr_4.5rem] gap-2">
      <input type="hidden" name="houseId" value={houseId} />
      {card && <input type="hidden" name="id" value={card.id} />}
      <input name="emoji" aria-label="Emoji" defaultValue={card?.emoji ?? "🌿"} maxLength={8} className="field text-center" />
      <input name="title" aria-label="Card title" required defaultValue={card?.title} placeholder="Card title" className="field font-bold" />
      <input name="position" aria-label="Order" type="number" min={1} defaultValue={card?.position ?? position} className="field" />
      <textarea name="body" aria-label="Card text" rows={3} defaultValue={card?.body} placeholder="What new members should read" className="field col-span-3" />
      <div className="col-span-3">
        <SubmitButton className="btn btn-primary btn-sm">{card ? "Save card" : "➕ Add card"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function TriviaForm({ houseId, q, position }: { houseId: string; q?: TriviaQuestion; position: number }) {
  return (
    <ActionForm action={saveTrivia} resetOnSuccess={!q} className="space-y-2">
      <input type="hidden" name="houseId" value={houseId} />
      <input type="hidden" name="position" value={q?.position ?? position} />
      {q && <input type="hidden" name="id" value={q.id} />}
      <input name="question" aria-label="Question" required defaultValue={q?.question} placeholder="Question" className="field font-bold" />
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-1 text-xs text-ink/70">Options: tick the correct one</legend>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="answerIndex" value={i} defaultChecked={(q?.answerIndex ?? 0) === i} aria-label={`Option ${i + 1} is correct`} className="size-5 accent-[#2d6a3e]" />
            <input name={`option${i}`} aria-label={`Option ${i + 1}`} defaultValue={q?.options[i] ?? ""} placeholder={`Option ${i + 1}`} className="field text-sm" />
          </div>
        ))}
      </fieldset>
      <SubmitButton className="btn btn-primary btn-sm">{q ? "Save question" : "➕ Add question"}</SubmitButton>
    </ActionForm>
  );
}

export default async function AdminLorePage({ searchParams }: { searchParams: Promise<{ house?: string }> }) {
  const admin = await requireAdmin();
  const repo = await getRepo();
  const houses = await repo.listHouses();
  const requested = (await searchParams).house;
  const houseId = admin.role === "super_admin" ? (requested ?? admin.houseId ?? houses[0]?.id) : admin.houseId;
  const house = houses.find((h) => h.id === houseId);
  if (!house || !canManageHouse(admin, house.id)) return <Notice tone="error">You don&apos;t have a house to edit.</Notice>;
  const [cards, trivia] = await Promise.all([repo.listLoreCards(house.id), repo.listTrivia(house.id)]);

  return (
    <div className="space-y-6">
      {admin.role === "super_admin" && (
        <nav aria-label="Choose house" className="flex flex-wrap gap-2">
          {houses.map((h) => (
            <Link key={h.id} href={`/admin/lore?house=${h.id}`} aria-current={h.id === house.id ? "page" : undefined} className={`btn btn-sm ${h.id === house.id ? "btn-primary" : "btn-ghost"}`}>
              {h.mascotEmoji} {h.name}
            </Link>
          ))}
        </nav>
      )}

      <section className="card p-5" aria-labelledby="house">
        <h1 id="house" className="mb-1 text-xl font-extrabold" style={{ color: house.colorPrimary }}>
          {house.mascotEmoji} {house.name}: mascot, values and leaders
        </h1>
        <p className="mb-4 text-sm text-ink/70">Everything here appears in Ranger Onboarding and on the house page. No code needed.</p>
        <ActionForm action={updateHouseLore} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="houseId" value={house.id} />
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <div>
              <label className="label" htmlFor="mascotEmoji">
                Emoji
              </label>
              <input id="mascotEmoji" name="mascotEmoji" defaultValue={house.mascotEmoji} maxLength={8} className="field text-center" />
            </div>
            <div>
              <label className="label" htmlFor="mascot">
                Mascot
              </label>
              <input id="mascot" name="mascot" defaultValue={house.mascot} className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="motto">
              Motto
            </label>
            <input id="motto" name="motto" defaultValue={house.motto} className="field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="lore">
              House story
            </label>
            <textarea id="lore" name="lore" rows={3} defaultValue={house.lore} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="values">
              Values (one per line)
            </label>
            <textarea id="values" name="values" rows={4} defaultValue={house.values.join("\n")} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="leaders">
              Leaders (one per line: Name | Role)
            </label>
            <textarea id="leaders" name="leaders" rows={4} defaultValue={house.leaders.map((l) => `${l.name} | ${l.role}`).join("\n")} className="field" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="color" name="colorPrimary" defaultValue={house.colorPrimary} className="h-10 w-14 rounded border-2 border-ink/40" /> Main colour
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="color" name="colorAccent" defaultValue={house.colorAccent} className="h-10 w-14 rounded border-2 border-ink/40" /> Accent colour
            </label>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Save house lore</SubmitButton>
          </div>
        </ActionForm>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5" aria-labelledby="cards">
          <h2 id="cards" className="text-lg font-extrabold">
            📖 Onboarding story cards
          </h2>
          <p className="text-sm text-ink/70">Shown in order before the values, leaders and quiz cards.</p>
          {cards.map((c) => (
            <div key={c.id} className="rounded-xl border-2 border-ink/15 p-3">
              <CardForm houseId={house.id} card={c} position={c.position} />
              <ActionForm action={deleteLoreCard} className="mt-2">
                <input type="hidden" name="id" value={c.id} />
                <SubmitButton className="text-xs font-semibold text-[#c84a3a] underline" pendingText="Deleting…" confirm="Delete this card?">
                  Delete card
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          <div className="rounded-xl border-2 border-dashed border-forest/50 p-3">
            <CardForm houseId={house.id} position={cards.length + 1} />
          </div>
        </section>

        <section className="card space-y-4 p-5" aria-labelledby="trivia">
          <h2 id="trivia" className="text-lg font-extrabold">
            ❓ Trivia quiz
          </h2>
          <p className="text-sm text-ink/70">The first 5 questions are used in onboarding.</p>
          {trivia.map((q) => (
            <div key={q.id} className="rounded-xl border-2 border-ink/15 p-3">
              <TriviaForm houseId={house.id} q={q} position={q.position} />
              <ActionForm action={deleteTrivia} className="mt-2">
                <input type="hidden" name="id" value={q.id} />
                <SubmitButton className="text-xs font-semibold text-[#c84a3a] underline" pendingText="Deleting…" confirm="Delete this question?">
                  Delete question
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          <div className="rounded-xl border-2 border-dashed border-forest/50 p-3">
            <TriviaForm houseId={house.id} position={trivia.length + 1} />
          </div>
        </section>
      </div>
    </div>
  );
}

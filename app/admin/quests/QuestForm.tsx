import { saveQuest } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";
import { TRACK_META } from "@/lib/game";
import { toDateInput } from "@/lib/format";
import { TRACKS, type House, type Profile, type Quest } from "@/lib/types";

/** Create or edit a quest. House admins can only make quests for their own house. */
export function QuestForm({ quest, houses, admin }: { quest?: Quest; houses: House[]; admin: Profile }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ActionForm action={saveQuest} resetOnSuccess={!quest} className="grid gap-4 sm:grid-cols-2">
      {quest && <input type="hidden" name="id" value={quest.id} />}
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">
          Title
        </label>
        <input id="title" name="title" required minLength={3} maxLength={120} defaultValue={quest?.title} placeholder="Attend Saturday meetup" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="description">
          Description (what to do and what proof to send)
        </label>
        <textarea id="description" name="description" rows={3} defaultValue={quest?.description} className="field" />
      </div>
      <fieldset>
        <legend className="label">Track</legend>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <label key={t} className="cursor-pointer">
              <input type="radio" name="track" value={t} required defaultChecked={(quest?.track ?? "culture") === t} className="peer sr-only" />
              <span className="pill px-3 py-1.5 text-sm peer-checked:bg-leaf peer-focus-visible:outline-3 peer-focus-visible:outline-sun">
                {TRACK_META[t].emoji} {TRACK_META[t].label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="seeds">
          Seeds reward 🌰
        </label>
        <input id="seeds" name="seeds" type="number" min={1} max={1000} required defaultValue={quest?.seeds ?? 30} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="startsAt">
          Starts
        </label>
        <input id="startsAt" name="startsAt" type="date" defaultValue={quest ? toDateInput(quest.startsAt) : today} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="endsAt">
          Ends (optional)
        </label>
        <input id="endsAt" name="endsAt" type="date" defaultValue={toDateInput(quest?.endsAt ?? null)} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="houseId">
          Which houses?
        </label>
        {admin.role === "super_admin" ? (
          <select id="houseId" name="houseId" defaultValue={quest?.houseId ?? ""} className="field">
            <option value="">All nine houses</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} only
              </option>
            ))}
          </select>
        ) : (
          <p className="field bg-cream">{houses.find((h) => h.id === admin.houseId)?.name} only</p>
        )}
      </div>
      <div className="flex flex-col justify-end gap-2">
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" name="active" defaultChecked={quest?.active ?? true} className="size-5 accent-[#2d6a3e]" /> Live (members can see it)
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" name="needsProof" defaultChecked={quest?.needsProof ?? true} className="size-5 accent-[#2d6a3e]" /> Needs proof
        </label>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{quest ? "Save changes" : "➕ Create quest"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

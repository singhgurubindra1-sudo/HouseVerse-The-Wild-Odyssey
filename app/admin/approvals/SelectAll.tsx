"use client";

/** Ticks or unticks every submission checkbox that belongs to the bulk form. */
export function SelectAll({ form }: { form: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        className="size-5 accent-[#2d6a3e]"
        onChange={(e) => {
          document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][form="${form}"]`).forEach((box) => {
            box.checked = e.target.checked;
          });
        }}
      />
      Select all
    </label>
  );
}

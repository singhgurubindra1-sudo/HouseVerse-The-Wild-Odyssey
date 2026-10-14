export default function Loading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status">
      <span className="animate-bounce text-5xl" aria-hidden>
        🌱
      </span>
      <p className="font-semibold text-ink/70">Growing the forest…</p>
    </div>
  );
}

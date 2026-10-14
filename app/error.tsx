"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl" aria-hidden>
        🌧️
      </p>
      <h1 className="mt-4 text-3xl font-extrabold text-forest">Something went wrong</h1>
      <p className="mt-2 text-ink/70">{error.message || "Please try again."}</p>
      {error.message?.includes("Server Actions") && (
        <p className="mt-3 rounded-xl border-2 border-ink/30 bg-sand p-3 text-left text-sm">
          This usually means the site is running in a cloud editor with an old copy of the code. In the terminal run <code>git pull</code>, stop the
          site with <kbd>Ctrl</kbd>+<kbd>C</kbd>, then start it again with <code>npm run dev</code>.
        </p>
      )}
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}

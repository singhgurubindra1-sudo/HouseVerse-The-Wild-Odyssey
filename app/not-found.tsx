import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl" aria-hidden>
        🌫️
      </p>
      <h1 className="mt-4 text-3xl font-extrabold text-forest">Lost in the forest</h1>
      <p className="mt-2 text-ink/70">This path doesn&apos;t lead anywhere. Let&apos;s get you back to the trail.</p>
      <Link href="/" className="btn btn-primary mt-6">
        ← Back to Wildlands
      </Link>
    </div>
  );
}

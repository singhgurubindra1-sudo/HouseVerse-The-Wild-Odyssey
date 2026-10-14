"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A submit button that shows a waiting label while the server action runs. */
export function SubmitButton({ children, pendingText = "Saving…", className = "btn btn-primary", name, value, confirm }: { children: ReactNode; pendingText?: string; className?: string; name?: string; value?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

/** Quietly re-fetches the page every few seconds so new trees appear live. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}

/** Copies the profile link (or opens the phone's share sheet). */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the user closed the share sheet */
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={share} className="btn btn-leaf btn-sm">
        🔗 {copied ? "Link copied!" : "Share my Habitat Card"}
      </button>
      <a
        className="btn btn-ghost btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window === "undefined" ? path : window.location.origin + path)}`}
      >
        Share on LinkedIn
      </a>
    </div>
  );
}

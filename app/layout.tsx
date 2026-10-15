import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { TiltEffects } from "@/components/TiltEffects";

export const metadata: Metadata = {
  title: { default: "Wildlands · A living house ecosystem", template: "%s · Wildlands" },
  description:
    "Every quest a member finishes plants a tree or brings an animal back to their house's forest. Nine empty patches of land turn into nine living national parks.",
};

export const viewport: Viewport = {
  themeColor: "#2d6a3e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="scene-bg" aria-hidden>
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <span className="blob b4" />
          <span className="leaf-grid" />
        </div>
        <TiltEffects />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white/90 focus:p-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">
          {children}
        </main>
        <footer className="mx-auto hidden max-w-6xl px-4 pb-8 text-center text-xs text-ink/60 md:block">
          Wildlands · Saranda House Build-a-Thon &apos;26 · Theme 04: House Odyssey
        </footer>
      </body>
    </html>
  );
}

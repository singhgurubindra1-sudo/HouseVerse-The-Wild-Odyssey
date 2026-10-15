"use client";

import { useEffect } from "react";

/**
 * One listener for the whole site that powers the 3D interface:
 * - elements with `data-tilt` lean toward the pointer and catch a light glare
 * - `.diorama` scenes rotate and shift their parallax layers (--px / --py)
 * Skipped on touch screens and for people who prefer reduced motion.
 */
export function TiltEffects() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active: HTMLElement[] = [];
    let frame = 0;
    let last: PointerEvent | null = null;

    const reset = (el: HTMLElement) => {
      el.classList.remove("is-tilting");
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
      el.style.removeProperty("--px");
      el.style.removeProperty("--py");
    };

    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;
      const tilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      const diorama = target?.closest<HTMLElement>(".diorama") ?? null;
      const now = [tilt, diorama].filter((x): x is HTMLElement => Boolean(x));
      for (const el of active) if (!now.includes(el)) reset(el);
      active = now;

      for (const el of now) {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width; // 0..1
        const y = (e.clientY - r.top) / r.height;
        el.classList.add("is-tilting");
        if (el === tilt) {
          const max = Number(el.dataset.tilt) || 8;
          el.style.setProperty("--rx", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
          el.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
          el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
          el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        } else {
          el.style.setProperty("--px", ((x - 0.5) * 2).toFixed(3));
          el.style.setProperty("--py", ((y - 0.5) * 2).toFixed(3));
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      active.forEach(reset);
      active = [];
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

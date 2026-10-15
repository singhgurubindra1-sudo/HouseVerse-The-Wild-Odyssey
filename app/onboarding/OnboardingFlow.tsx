"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { finishOnboarding } from "@/app/actions/member";
import { SubmitButton } from "@/components/client";
import { initials } from "@/lib/format";
import type { House, LoreCard, TriviaQuestion } from "@/lib/types";

type Step = { key: string; content: ReactNode; emoji: string; title: string };

export function OnboardingFlow({ house, cards, trivia, firstName, alreadyDone }: { house: House; cards: LoreCard[]; trivia: TriviaQuestion[]; firstName: string; alreadyDone: boolean }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const touchX = useRef<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const storySteps: Step[] = [
    ...cards.map((c) => ({ key: c.id, emoji: c.emoji, title: c.title, content: <p className="whitespace-pre-line text-lg leading-relaxed">{c.body}</p> })),
    {
      key: "values",
      emoji: "🧭",
      title: `What ${house.name} stands for`,
      content: (
        <div>
          <p className="mb-3 text-lg italic">&ldquo;{house.motto}&rdquo;</p>
          <ul className="space-y-2">
            {house.values.map((v) => (
              <li key={v} className="glass flex items-start gap-2 rounded-2xl px-3 py-2 font-semibold">
                <span aria-hidden>🌿</span> {v}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      key: "leaders",
      emoji: "🧑‍🤝‍🧑",
      title: "Meet your leaders",
      content: (
        <div>
          <p className="mb-3">These are the people to message if you need help or have an idea for a quest.</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {house.leaders.map((l) => (
              <li key={l.name + l.role} data-tilt className="glass flex items-center gap-3 rounded-2xl p-3">
                <span aria-hidden className="flex size-12 items-center justify-center rounded-full border-2 border-ink/70 font-bold text-white" style={{ background: house.colorPrimary }}>
                  {initials(l.name)}
                </span>
                <span>
                  <span className="block font-bold">{l.name}</span>
                  <span className="text-sm text-ink/70">{l.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  const total = storySteps.length + trivia.length + 1;
  const isStory = index < storySteps.length;
  const quizIndex = index - storySteps.length;
  const question = !isStory && quizIndex < trivia.length ? trivia[quizIndex] : null;
  const isFinish = index === total - 1;
  const score = trivia.filter((q) => answers[q.id] === q.answerIndex).length;
  const canNext = !question || answers[question.id] !== undefined;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = Math.max(0, Math.min(total - 1, i + delta));
        return next;
      });
    },
    [total],
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" && canNext) go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, canNext]);

  let emoji = "🌱";
  let title = "";
  let body: ReactNode = null;
  if (isStory) {
    const step = storySteps[index];
    emoji = step.emoji;
    title = step.title;
    body = step.content;
  } else if (question) {
    const chosen = answers[question.id];
    emoji = "❓";
    title = `Quick quiz · ${quizIndex + 1} of ${trivia.length}`;
    body = (
      <fieldset>
        <legend className="mb-4 text-lg font-bold">{question.question}</legend>
        <div className="grid gap-2">
          {question.options.map((opt, i) => {
            const answered = chosen !== undefined;
            const right = i === question.answerIndex;
            const state = answered && right ? "border-forest bg-leaf-soft" : answered && chosen === i ? "border-[#c84a3a] bg-rose" : "border-white/70 bg-white/40";
            return (
              <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-semibold shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-md transition hover:-translate-y-0.5 ${state}`}>
                <input
                  type="radio"
                  name={question.id}
                  className="size-4 accent-[#2d6a3e]"
                  checked={chosen === i}
                  disabled={answered}
                  onChange={() => setAnswers((a) => ({ ...a, [question.id]: i }))}
                />
                {opt}
                {answered && right && <span className="ml-auto">✅</span>}
                {answered && !right && chosen === i && <span className="ml-auto">❌</span>}
              </label>
            );
          })}
        </div>
        {chosen !== undefined && (
          <p role="status" className="mt-3 font-semibold">
            {chosen === question.answerIndex ? "Correct! 🎉" : `Not quite: it's "${question.options[question.answerIndex]}".`}
          </p>
        )}
      </fieldset>
    );
  } else {
    emoji = "🌱";
    title = alreadyDone ? "You're already a Ranger!" : `Ready to plant your first seed, ${firstName}?`;
    body = (
      <div className="space-y-4">
        <p className="text-lg">
          You scored <strong>{score} / {trivia.length}</strong> on the {house.name} quiz.{" "}
          {score === trivia.length ? "Perfect! You know your house." : "Every ranger learns as they go."}
        </p>
        {alreadyDone ? (
          <Link href={`/house/${house.id}`} className="btn btn-primary">
            Back to my forest →
          </Link>
        ) : (
          <>
            <p>Finishing onboarding plants your <strong>first seed</strong> on the {house.name} map with your name on it, and gives you the <strong>🎖️ Ranger</strong> badge.</p>
            <form action={finishOnboarding}>
              <SubmitButton pendingText="Planting your seed…">🌱 Plant my first seed</SubmitButton>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-2 text-sm font-semibold text-ink/70">
        Ranger Onboarding · {house.name}
      </p>
      <div className="mb-4 flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-2 flex-1 rounded-full border border-white/70 transition-colors" style={{ background: i <= index ? house.colorPrimary : "rgb(255 255 255 / 0.4)" }} />
        ))}
      </div>
      <section
        key={index}
        className="card flip-in min-h-[22rem] p-6 sm:p-8"
        style={{ boxShadow: `inset 0 5px 0 ${house.colorPrimary}, var(--glass-shadow)` }}
        aria-roledescription="slide"
        aria-label={`Card ${index + 1} of ${total}`}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx < -50 && canNext) go(1);
          if (dx > 50) go(-1);
        }}
      >
        <p className="float inline-block text-6xl drop-shadow-[0_10px_10px_rgba(14,52,30,0.3)]" aria-hidden>
          {emoji}
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="mb-4 mt-2 text-2xl font-extrabold outline-none sm:text-3xl" style={{ color: house.colorPrimary }}>
          {title}
        </h1>
        {body}
      </section>
      <div className="mt-4 flex items-center justify-between">
        <button type="button" className="btn btn-ghost" onClick={() => go(-1)} disabled={index === 0}>
          ← Back
        </button>
        <span className="text-sm text-ink/60">
          {index + 1} / {total}
          <span className="hidden sm:inline"> · swipe or use arrow keys</span>
        </span>
        {!isFinish && (
          <button type="button" className="btn btn-primary" onClick={() => go(1)} disabled={!canNext}>
            {question ? "Next question" : "Next"} →
          </button>
        )}
        {isFinish && <span className="w-20" />}
      </div>
    </div>
  );
}

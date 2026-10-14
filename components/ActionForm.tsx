"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/app/actions/types";

/**
 * A form wired to a server action. Shows the action's success or error message
 * underneath, and can clear itself after a successful save.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  encType,
  id,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
  id?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} id={id} action={formAction} className={className} encType={encType}>
      {children}
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`mt-3 rounded-lg border-2 px-3 py-2 text-sm ${state.ok ? "border-forest/40 bg-leaf-soft" : "border-[#c84a3a]/50 bg-rose"}`}>
          {state.ok ? "✅ " : "⚠️ "}
          {state.message}
        </p>
      )}
    </form>
  );
}

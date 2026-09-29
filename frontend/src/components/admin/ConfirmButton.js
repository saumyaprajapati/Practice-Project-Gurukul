"use client";

import { useState } from "react";

// Two-step button for destructive admin actions: the first click arms it
// ("Confirm …?"), the second runs onConfirm. Blurring or "Cancel" disarms it.
// No browser confirm() dialog, so it works the same everywhere.
export default function ConfirmButton({ children, confirmLabel, onConfirm, disabled = false, tone = "danger" }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const toneClass = tone === "danger" ? "text-ochre" : "text-charcoal/85";

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  if (!armed) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setArmed(true)}
        className={`text-sm font-medium underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        disabled={busy}
        onClick={handleConfirm}
        className="rounded bg-ochre px-2 py-1 font-medium text-cream disabled:opacity-60"
      >
        {busy ? "Working..." : confirmLabel ?? "Confirm"}
      </button>
      <button type="button" disabled={busy} onClick={() => setArmed(false)} className="underline underline-offset-4">
        Cancel
      </button>
    </span>
  );
}

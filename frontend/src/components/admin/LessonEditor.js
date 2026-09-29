"use client";

import { useState } from "react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";

const FIELD_CLASS = "w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none";

// Shared lesson fields for editing an existing lesson and adding a new one.
// `initial` uses the curriculum shape (content = array of paragraphs).
export default function LessonEditor({ idPrefix, initial, submitLabel, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content?.join("\n\n") ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? 10));
  const [isPreview, setIsPreview] = useState(Boolean(initial?.isPreview));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({ title, content, durationMinutes: Number(durationMinutes) || 10, isPreview });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-2 rounded border border-brown/20 bg-cream/60 p-3">
      <AuthInput
        id={`${idPrefix}-title`}
        name={`${idPrefix}-title`}
        label="Lesson Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div className="mb-4">
        <label htmlFor={`${idPrefix}-content`} className="mb-1 block text-sm font-medium">
          Lesson Content <span className="font-normal text-charcoal/60">(blank line = new paragraph)</span>
        </label>
        <textarea
          id={`${idPrefix}-content`}
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div className="w-40">
          <AuthInput
            id={`${idPrefix}-duration`}
            name={`${idPrefix}-duration`}
            label="Duration (minutes)"
            type="number"
            inputMode="numeric"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} />
          Free preview
        </label>
      </div>
      <div className="flex items-center gap-4">
        <AuthButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : submitLabel}
        </AuthButton>
        {onCancel ? (
          <AuthButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </AuthButton>
        ) : null}
      </div>
    </form>
  );
}

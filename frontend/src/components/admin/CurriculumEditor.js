"use client";

import { useState } from "react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import ConfirmButton from "@/components/admin/ConfirmButton";
import LessonEditor from "@/components/admin/LessonEditor";
import {
  updateModule,
  deleteModule,
  moveModule,
  updateLesson,
  deleteLesson,
  moveLesson,
} from "@/lib/admin/courses";
import { addModule, addLesson } from "@/lib/courses/creator";

const SMALL_BUTTON = "text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40";

// Full curriculum control for admins: rename/reorder/delete modules, edit/
// reorder/delete lessons, add modules and lessons. Every change reloads the
// curriculum from the database (onChanged) so positions always match it.
// Deleting lessons also removes learners' progress for them; progress
// percentages are recalculated by a database trigger.
export default function CurriculumEditor({ courseId, curriculum, onChanged }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null); // lesson key
  const [addingToModule, setAddingToModule] = useState(null); // module id
  const [moduleTitles, setModuleTitles] = useState({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showNewModule, setShowNewModule] = useState(false);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const modules = curriculum.modules;

  return (
    <div>
      <AuthError message={error} />

      {modules.length === 0 ? <p className="text-charcoal/70">No modules yet.</p> : null}

      <ol className="space-y-4">
        {modules.map((module, moduleIndex) => {
          const titleDraft = moduleTitles[module.id] ?? module.title;
          return (
            <li key={module.id} className="surface-earthy rounded-lg p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-60 flex-1">
                  <AuthInput
                    id={`module-${module.id}-title`}
                    name={`module-${module.id}-title`}
                    label={`Module ${moduleIndex + 1}`}
                    value={titleDraft}
                    onChange={(e) => setModuleTitles((prev) => ({ ...prev, [module.id]: e.target.value }))}
                  />
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    disabled={busy || titleDraft.trim() === module.title}
                    onClick={() => run(() => updateModule(module.id, titleDraft))}
                  >
                    Save title
                  </button>
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    disabled={busy || moduleIndex === 0}
                    onClick={() => run(() => moveModule(module.id, -1))}
                    aria-label={`Move ${module.title} up`}
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    disabled={busy || moduleIndex === modules.length - 1}
                    onClick={() => run(() => moveModule(module.id, 1))}
                    aria-label={`Move ${module.title} down`}
                  >
                    ↓ Down
                  </button>
                  <ConfirmButton
                    disabled={busy}
                    confirmLabel={`Delete module + ${module.lessons.length} lesson(s)`}
                    onConfirm={() => run(() => deleteModule(courseId, module.id))}
                  >
                    Delete module
                  </ConfirmButton>
                </div>
              </div>

              <ul className="space-y-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id} className="rounded border border-brown/15 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-charcoal">
                        {lessonIndex + 1}. {lesson.title}{" "}
                        <span className="text-charcoal/50">
                          · {lesson.durationMinutes} min{lesson.isPreview ? " · free preview" : ""}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className={SMALL_BUTTON}
                          disabled={busy}
                          onClick={() => setEditingLesson(editingLesson === lesson.id ? null : lesson.id)}
                        >
                          {editingLesson === lesson.id ? "Close" : "Edit"}
                        </button>
                        <button
                          type="button"
                          className={SMALL_BUTTON}
                          disabled={busy || lessonIndex === 0}
                          onClick={() => run(() => moveLesson(courseId, lesson.id, -1))}
                          aria-label={`Move ${lesson.title} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={SMALL_BUTTON}
                          disabled={busy || lessonIndex === module.lessons.length - 1}
                          onClick={() => run(() => moveLesson(courseId, lesson.id, 1))}
                          aria-label={`Move ${lesson.title} down`}
                        >
                          ↓
                        </button>
                        <ConfirmButton
                          disabled={busy}
                          confirmLabel="Delete lesson"
                          onConfirm={() => run(() => deleteLesson(courseId, lesson.id))}
                        >
                          Delete
                        </ConfirmButton>
                      </span>
                    </div>
                    {editingLesson === lesson.id ? (
                      <LessonEditor
                        idPrefix={`edit-${lesson.id}`}
                        initial={lesson}
                        submitLabel="Save Lesson"
                        onCancel={() => setEditingLesson(null)}
                        onSubmit={async (values) => {
                          if (await run(() => updateLesson(courseId, lesson.id, values))) setEditingLesson(null);
                        }}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>

              {addingToModule === module.id ? (
                <LessonEditor
                  idPrefix={`new-${module.id}`}
                  submitLabel="Add Lesson"
                  onCancel={() => setAddingToModule(null)}
                  onSubmit={async (values) => {
                    if (await run(() => addLesson(courseId, module.id, values))) setAddingToModule(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={`${SMALL_BUTTON} mt-3`}
                  disabled={busy}
                  onClick={() => setAddingToModule(module.id)}
                >
                  + Add lesson
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        {showNewModule ? (
          <div className="surface-earthy rounded-lg p-4">
            <AuthInput
              id="new-module-title"
              name="new-module-title"
              label="New Module Title"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              required
            />
            <p className="mb-2 text-sm text-charcoal/70">A module needs at least one lesson:</p>
            <LessonEditor
              idPrefix="new-module-lesson"
              submitLabel="Add Module"
              onCancel={() => setShowNewModule(false)}
              onSubmit={async (lesson) => {
                const ok = await run(() => addModule(courseId, { title: newModuleTitle, lessons: [lesson] }));
                if (ok) {
                  setNewModuleTitle("");
                  setShowNewModule(false);
                }
              }}
            />
          </div>
        ) : (
          <AuthButton type="button" variant="secondary" onClick={() => setShowNewModule(true)} disabled={busy}>
            + Add Module
          </AuthButton>
        )}
      </div>
    </div>
  );
}

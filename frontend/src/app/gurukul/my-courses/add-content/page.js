"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import LessonMediaManager from "@/components/courses/LessonMediaManager";
import { getCourseCurriculum } from "@/lib/courses/courses";
import { addModule, addLesson } from "@/lib/courses/creator";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const EMPTY_LESSON = () => ({ title: "", content: "", durationMinutes: 10, isPreview: false });

// The course id comes from ?id= (static export, see lib/gurukul/routes.js);
// useSearchParams needs a Suspense boundary in a static build.
export default function AddContentPage() {
  return (
    <Suspense fallback={null}>
      <AddContent />
    </Suspense>
  );
}

function AddContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id") ?? "";
  const router = useRouter();
  const [curriculum, setCurriculum] = useState(null);
  const [error, setError] = useState(null);
  const [openMediaLessonId, setOpenMediaLessonId] = useState(null);
  // Set by create-course's redirect (&created=1).
  const [justCreated] = useState(() => searchParams.has("created"));

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleLessons, setNewModuleLessons] = useState([EMPTY_LESSON()]);
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);

  const [targetModuleId, setTargetModuleId] = useState("");
  const [newLesson, setNewLesson] = useState(EMPTY_LESSON());
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  async function loadCurriculum() {
    try {
      const data = await getCourseCurriculum(courseId);
      setCurriculum(data);
      setTargetModuleId((prev) => prev || data.modules[0]?.id || "");
    } catch {
      router.replace(GURUKUL_ROUTES.myCourses);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getCourseCurriculum(courseId)
      .then((data) => {
        if (cancelled) return;
        setCurriculum(data);
        setTargetModuleId((prev) => prev || data.modules[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) router.replace(GURUKUL_ROUTES.myCourses);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, router]);

  function updateModuleLesson(index, field, value) {
    setNewModuleLessons((prev) =>
      prev.map((lesson, lIndex) => (lIndex === index ? { ...lesson, [field]: value } : lesson))
    );
  }

  async function handleAddModule(event) {
    event.preventDefault();
    setError(null);
    setIsSubmittingModule(true);
    try {
      await addModule(courseId, {
        title: newModuleTitle,
        lessons: newModuleLessons.map((lesson) => ({
          title: lesson.title,
          content: lesson.content,
          durationMinutes: Number(lesson.durationMinutes) || 10,
          isPreview: lesson.isPreview,
        })),
      });
      setNewModuleTitle("");
      setNewModuleLessons([EMPTY_LESSON()]);
      await loadCurriculum();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmittingModule(false);
    }
  }

  async function handleAddLesson(event) {
    event.preventDefault();
    setError(null);
    setIsSubmittingLesson(true);
    try {
      await addLesson(courseId, targetModuleId, {
        title: newLesson.title,
        content: newLesson.content,
        durationMinutes: Number(newLesson.durationMinutes) || 10,
        isPreview: newLesson.isPreview,
      });
      setNewLesson(EMPTY_LESSON());
      await loadCurriculum();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmittingLesson(false);
    }
  }

  if (!curriculum) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner max-w-2xl">
        <h1 className="heading-2">Add Content</h1>
        <span className="rule-shirorekha" aria-hidden="true" />
        {justCreated ? (
          <p role="status" className="surface-earthy mt-6 rounded-lg p-4 text-charcoal">
            Course created and sent for review. Now add videos and files to your lessons below.
          </p>
        ) : null}
        <p className="mt-6 text-charcoal/80">
          Existing modules and lessons can&apos;t be edited or removed — you can only add more. You can add, replace
          or remove each lesson&apos;s video and files at any time.
        </p>

        <h2 className="mt-8 mb-4 font-semibold text-charcoal">Current Curriculum</h2>
        {curriculum.modules.length === 0 ? (
          <p className="text-charcoal/70">No content yet.</p>
        ) : (
          <ul className="space-y-3">
            {curriculum.modules.map((module) => (
              <li key={module.id} className="surface-earthy rounded-lg p-4">
                <p className="font-medium text-charcoal">{module.title}</p>
                <ul className="mt-2 space-y-2 text-sm text-charcoal/80">
                  {module.lessons.map((lesson) => {
                    const isOpen = openMediaLessonId === lesson.id;
                    const mediaCount = (lesson.video ? 1 : 0) + (lesson.files?.length ?? 0);
                    return (
                      <li key={lesson.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span>
                            {lesson.title}
                            <span className="text-charcoal/50">
                              {lesson.video ? " · video" : " · no video"}
                              {lesson.files?.length ? ` · ${lesson.files.length} file(s)` : ""}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOpenMediaLessonId(isOpen ? null : lesson.id)}
                            aria-expanded={isOpen}
                            className="font-medium underline underline-offset-4"
                          >
                            {isOpen ? "Close" : mediaCount ? "Videos & files" : "+ Add video / files"}
                          </button>
                        </div>
                        {isOpen ? (
                          <LessonMediaManager courseId={courseId} lesson={lesson} onChanged={loadCurriculum} />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <AuthError message={error} />

        <h2 className="mt-10 mb-4 font-semibold text-charcoal">Add a Lesson to an Existing Module</h2>
        {curriculum.modules.length > 0 ? (
          <form onSubmit={handleAddLesson} noValidate className="surface-earthy rounded-lg p-4">
            <div className="mb-4">
              <label htmlFor="target-module" className="mb-1 block text-sm font-medium">
                Module
              </label>
              <select
                id="target-module"
                value={targetModuleId}
                onChange={(e) => setTargetModuleId(e.target.value)}
                className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal"
              >
                {curriculum.modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
            <AuthInput
              id="lesson-title"
              name="lesson-title"
              label="Lesson Title"
              value={newLesson.title}
              onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <div className="mb-4">
              <label htmlFor="lesson-content" className="mb-1 block text-sm font-medium">
                Lesson Content
              </label>
              <textarea
                id="lesson-content"
                value={newLesson.content}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, content: e.target.value }))}
                required
                rows={4}
                className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none"
              />
            </div>
            <AuthInput
              id="lesson-duration"
              name="lesson-duration"
              label="Duration (minutes)"
              type="number"
              value={newLesson.durationMinutes}
              onChange={(e) => setNewLesson((prev) => ({ ...prev, durationMinutes: e.target.value }))}
              inputMode="numeric"
            />
            <label className="mb-4 flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={newLesson.isPreview}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, isPreview: e.target.checked }))}
              />
              Free preview (readable before enrolling)
            </label>
            <AuthButton type="submit" disabled={isSubmittingLesson}>
              {isSubmittingLesson ? "Adding..." : "Add Lesson"}
            </AuthButton>
          </form>
        ) : (
          <p className="text-charcoal/70">Add a module first.</p>
        )}

        <h2 className="mt-10 mb-4 font-semibold text-charcoal">Add a New Module</h2>
        <form onSubmit={handleAddModule} noValidate className="surface-earthy rounded-lg p-4">
          <AuthInput
            id="new-module-title"
            name="new-module-title"
            label="Module Title"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            required
          />

          {newModuleLessons.map((lesson, index) => (
            <div key={index} className="mb-4 border-t border-brown/20 pt-4">
              <AuthInput
                id={`new-lesson-${index}-title`}
                name={`new-lesson-${index}-title`}
                label={`Lesson ${index + 1} Title`}
                value={lesson.title}
                onChange={(e) => updateModuleLesson(index, "title", e.target.value)}
                required
              />
              <div className="mb-4">
                <label htmlFor={`new-lesson-${index}-content`} className="mb-1 block text-sm font-medium">
                  Lesson Content
                </label>
                <textarea
                  id={`new-lesson-${index}-content`}
                  value={lesson.content}
                  onChange={(e) => updateModuleLesson(index, "content", e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none"
                />
              </div>
              <AuthInput
                id={`new-lesson-${index}-duration`}
                name={`new-lesson-${index}-duration`}
                label="Duration (minutes)"
                type="number"
                value={lesson.durationMinutes}
                onChange={(e) => updateModuleLesson(index, "durationMinutes", e.target.value)}
                inputMode="numeric"
              />
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={lesson.isPreview}
                  onChange={(e) => updateModuleLesson(index, "isPreview", e.target.checked)}
                />
                Free preview (readable before enrolling)
              </label>
            </div>
          ))}

          <AuthButton
            type="button"
            variant="secondary"
            onClick={() => setNewModuleLessons((prev) => [...prev, EMPTY_LESSON()])}
            className="mb-4"
          >
            + Add Lesson
          </AuthButton>

          <AuthButton type="submit" disabled={isSubmittingModule}>
            {isSubmittingModule ? "Adding..." : "Add Module"}
          </AuthButton>
        </form>
      </div>
    </section>
  );
}

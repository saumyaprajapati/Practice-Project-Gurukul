"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createCourse } from "@/lib/courses/creator";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const EMPTY_LESSON = () => ({ title: "", content: "", durationMinutes: 10, isPreview: false });
const EMPTY_MODULE = () => ({ title: "", lessons: [EMPTY_LESSON()] });

// Instructor-gated: any signed-in user can reach /gurukul (guarded by
// GurukulLayout's useRequireAuth), but only an instructor can create a
// course, so this page does its own role check and redirects otherwise.
export default function CreateCoursePage() {
  const router = useRouter();
  const [isInstructor, setIsInstructor] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [modules, setModules] = useState([EMPTY_MODULE()]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfile().then((profile) => {
      if (cancelled) return;
      if (!profile.isInstructor) {
        router.replace(GURUKUL_ROUTES.home);
        return;
      }
      setIsInstructor(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateModule(moduleIndex, field, value) {
    setModules((prev) =>
      prev.map((module, index) => (index === moduleIndex ? { ...module, [field]: value } : module))
    );
  }

  function updateLesson(moduleIndex, lessonIndex, field, value) {
    setModules((prev) =>
      prev.map((module, index) => {
        if (index !== moduleIndex) return module;
        return {
          ...module,
          lessons: module.lessons.map((lesson, lIndex) =>
            lIndex === lessonIndex ? { ...lesson, [field]: value } : lesson
          ),
        };
      })
    );
  }

  function addModule() {
    setModules((prev) => [...prev, EMPTY_MODULE()]);
  }

  function addLesson(moduleIndex) {
    setModules((prev) =>
      prev.map((module, index) =>
        index === moduleIndex ? { ...module, lessons: [...module.lessons, EMPTY_LESSON()] } : module
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { courseId } = await createCourse({
        title,
        description,
        category,
        price: priceNumber,
        modules: modules.map((module) => ({
          title: module.title,
          lessons: module.lessons.map((lesson) => ({
            title: lesson.title,
            content: lesson.content,
            durationMinutes: Number(lesson.durationMinutes) || 10,
            isPreview: lesson.isPreview,
          })),
        })),
      });
      // Lessons only exist once the course is created, so videos and files
      // are attached next, on the course's add-content page.
      router.push(`${GURUKUL_ROUTES.myCourseAddContent(courseId)}?created=1`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  if (!isInstructor) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner max-w-2xl">
        <h1 className="heading-2">Create a Course</h1>
        <span className="rule-shirorekha" aria-hidden="true" />
        <p className="mt-6 text-charcoal/80">
          Your course goes live once an admin reviews and approves it. You&apos;ll have instant access to it
          yourself in the meantime. After submitting you&apos;ll attach each lesson&apos;s video and files, and you
          can always add more modules and lessons later from{" "}
          <Link href={GURUKUL_ROUTES.myCourses} className="underline underline-offset-4">
            My Courses
          </Link>
          .
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8">
          <AuthInput id="title" name="title" label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="mb-4">
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none"
            />
          </div>
          <AuthInput id="category" name="category" label="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          <AuthInput
            id="price"
            name="price"
            label="Price (₹)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            inputMode="numeric"
          />

          <h2 className="mt-8 mb-4 font-semibold text-charcoal">Curriculum</h2>
          {modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="surface-earthy mb-6 rounded-lg p-4">
              <AuthInput
                id={`module-${moduleIndex}-title`}
                name={`module-${moduleIndex}-title`}
                label={`Module ${moduleIndex + 1} Title`}
                value={module.title}
                onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                required
              />

              {module.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="mb-4 border-t border-brown/20 pt-4">
                  <AuthInput
                    id={`module-${moduleIndex}-lesson-${lessonIndex}-title`}
                    name={`module-${moduleIndex}-lesson-${lessonIndex}-title`}
                    label={`Lesson ${lessonIndex + 1} Title`}
                    value={lesson.title}
                    onChange={(e) => updateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                    required
                  />
                  <div className="mb-4">
                    <label
                      htmlFor={`module-${moduleIndex}-lesson-${lessonIndex}-content`}
                      className="mb-1 block text-sm font-medium"
                    >
                      Lesson Content
                    </label>
                    <textarea
                      id={`module-${moduleIndex}-lesson-${lessonIndex}-content`}
                      value={lesson.content}
                      onChange={(e) => updateLesson(moduleIndex, lessonIndex, "content", e.target.value)}
                      required
                      rows={4}
                      className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none"
                    />
                  </div>
                  <AuthInput
                    id={`module-${moduleIndex}-lesson-${lessonIndex}-duration`}
                    name={`module-${moduleIndex}-lesson-${lessonIndex}-duration`}
                    label="Duration (minutes)"
                    type="number"
                    value={lesson.durationMinutes}
                    onChange={(e) => updateLesson(moduleIndex, lessonIndex, "durationMinutes", e.target.value)}
                    inputMode="numeric"
                  />
                  <label className="flex items-center gap-2 text-sm text-charcoal">
                    <input
                      type="checkbox"
                      checked={lesson.isPreview}
                      onChange={(e) => updateLesson(moduleIndex, lessonIndex, "isPreview", e.target.checked)}
                    />
                    Free preview (readable before enrolling)
                  </label>
                </div>
              ))}

              <AuthButton type="button" variant="secondary" onClick={() => addLesson(moduleIndex)}>
                + Add Lesson
              </AuthButton>
            </div>
          ))}

          <AuthButton type="button" variant="secondary" onClick={addModule} className="mb-8">
            + Add Module
          </AuthButton>

          <AuthError message={error} />
          <AuthButton type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </AuthButton>
        </form>
      </div>
    </section>
  );
}

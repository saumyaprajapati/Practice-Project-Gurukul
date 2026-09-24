"use client";

import { useState } from "react";
import SyllabusNav from "./SyllabusNav";
import CourseSidebarCard from "./CourseSidebarCard";
import LessonVideoPlayer from "./LessonVideoPlayer";
import LessonResources from "./LessonResources";

// Not-enrolled/expired branch: browsable overview with a locked syllabus
// and the enroll/renew action. Lessons the instructor flagged as free
// previews can be opened and read here; RLS returns no text for the rest.
export default function CourseOverview({ course, curriculum, isExpired, expiresAt }) {
  const [previewLessonId, setPreviewLessonId] = useState(null);

  const previewLesson = previewLessonId
    ? curriculum.modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === previewLessonId)
    : null;
  const hasPreviews = curriculum.modules.some((module) =>
    module.lessons.some((lesson) => lesson.isPreview && !lesson.locked)
  );

  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        {previewLesson ? (
          <div className="surface-earthy rounded-lg p-6 sm:p-8">
            <LessonVideoPlayer key={previewLesson.id} video={previewLesson.video} title={previewLesson.title} />
            <p className="text-sm text-charcoal/60">Free preview</p>
            <h2 className="mt-1 text-xl font-semibold text-charcoal">{previewLesson.title}</h2>
            <div className="mt-4 max-w-prose space-y-3 text-charcoal/90">
              {previewLesson.content.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <LessonResources key={`files-${previewLesson.id}`} files={previewLesson.files ?? []} />
          </div>
        ) : null}

        <div>
          <h2 className="text-xl font-semibold text-charcoal">Syllabus</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            {hasPreviews
              ? "Open a free preview lesson, or enroll to unlock every lesson below."
              : "Enroll to unlock every lesson below."}
          </p>
          <div className="mt-4">
            <SyllabusNav
              curriculum={curriculum}
              interactive={false}
              previewLessonId={previewLessonId}
              onPreviewLesson={setPreviewLessonId}
            />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <CourseSidebarCard
          course={course}
          isExpired={isExpired}
          expiresAt={expiresAt}
          curriculum={curriculum}
        />
      </div>
    </div>
  );
}

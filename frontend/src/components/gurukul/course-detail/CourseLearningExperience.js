"use client";

import { useEffect, useMemo, useState } from "react";
import SyllabusNav from "./SyllabusNav";
import LessonPanel from "./LessonPanel";
import ProgressCard from "./ProgressCard";
import { flattenLessons } from "@/lib/courses/curriculum";
import { markLessonComplete } from "@/lib/courses/progress";
import { touchLessonActivity } from "@/lib/courses/analytics";

const HEARTBEAT_MS = 60_000;

// Enrolled branch. Owns the only interactive/stateful part of the Course
// Detail page: current lesson + completed-lesson set. initialCompletedLessonIds
// comes from the real lesson_progress table, so it's exact, not an
// approximation. Every "Mark Complete" click inserts a lesson_progress row;
// a database trigger recomputes and persists the enrollment's
// progress_percent — /gurukul/learning reads that on next load.
export default function CourseLearningExperience({ curriculum, initialCompletedLessonIds }) {
  const flatLessons = useMemo(() => flattenLessons(curriculum), [curriculum]);

  const [completedLessonIds, setCompletedLessonIds] = useState(() => new Set(initialCompletedLessonIds));
  const [currentLessonId, setCurrentLessonId] = useState(() => {
    const firstIncomplete = flatLessons.find(
      (lesson) => !initialCompletedLessonIds.includes(lesson.lessonId)
    );
    return (firstIncomplete ?? flatLessons[flatLessons.length - 1])?.lessonId ?? null;
  });

  const currentIndex = flatLessons.findIndex((lesson) => lesson.lessonId === currentLessonId);
  const currentLesson = flatLessons[currentIndex] ?? flatLessons[0];

  const totalCount = flatLessons.length;
  const completedCount = completedLessonIds.size;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // "Watching now" for the instructor's Course Analytics: a heartbeat every
  // minute while this lesson is on screen. Failures are ignored — analytics
  // must never get in the way of learning.
  const courseId = curriculum.courseId;
  const activeLessonId = currentLesson?.lessonId;
  useEffect(() => {
    if (!activeLessonId) return undefined;
    function beat() {
      if (document.visibilityState === "visible") touchLessonActivity(courseId, activeLessonId).catch(() => {});
    }
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [courseId, activeLessonId]);

  async function handleMarkComplete() {
    const { completedLessonIds: updated } = await markLessonComplete(
      curriculum.courseId,
      currentLesson.lessonId
    );
    setCompletedLessonIds(new Set(updated));
  }

  function handleSelectLesson(lessonId) {
    setCurrentLessonId(lessonId);
  }

  function handlePrevious() {
    if (currentIndex > 0) setCurrentLessonId(flatLessons[currentIndex - 1].lessonId);
  }

  function handleNext() {
    if (currentIndex < flatLessons.length - 1) setCurrentLessonId(flatLessons[currentIndex + 1].lessonId);
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <LessonPanel
          lesson={currentLesson}
          isCompleted={completedLessonIds.has(currentLesson.lessonId)}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < flatLessons.length - 1}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onMarkComplete={handleMarkComplete}
        />

        <div>
          <h2 className="text-xl font-semibold text-charcoal">Syllabus</h2>
          <div className="mt-4">
            <SyllabusNav
              curriculum={curriculum}
              interactive
              currentLessonId={currentLesson.lessonId}
              completedLessonIds={completedLessonIds}
              onSelectLesson={handleSelectLesson}
            />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProgressCard completedCount={completedCount} totalCount={totalCount} percent={percent} />
      </div>
    </div>
  );
}

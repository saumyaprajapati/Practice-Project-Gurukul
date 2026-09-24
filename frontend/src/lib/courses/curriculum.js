// Flattens modules/lessons into a single ordered list, for Next/Previous
// navigation across module boundaries and for lesson-count-based progress.
// Curriculum data itself comes from the real course_modules/course_lessons
// tables (lib/courses/courses.js getCourseCurriculum) — this stays the same
// pure shape-transform either way.
export function flattenLessons(curriculum) {
  const flat = [];
  curriculum.modules.forEach((module, moduleIndex) => {
    module.lessons.forEach((lesson, lessonIndex) => {
      flat.push({
        moduleId: module.id,
        moduleTitle: module.title,
        moduleIndex,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonIndex,
        globalIndex: flat.length,
        durationMinutes: lesson.durationMinutes,
        content: lesson.content,
        isPreview: Boolean(lesson.isPreview),
        locked: Boolean(lesson.locked),
      });
    });
  });
  return flat;
}

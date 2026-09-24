import "server-only";

// Shared validation for the shapes course creation and the append-content
// routes (api/courses/[courseId]/modules, .../modules/[moduleId]/lessons)
// all accept — a lesson needs a title+content, a module needs a title and
// at least one valid lesson.
export function validateLesson(lesson) {
  if (!lesson?.title?.trim() || !lesson?.content?.trim()) {
    return "Every lesson needs a title and content.";
  }
  return null;
}

export function validateModule(moduleInput) {
  if (!moduleInput?.title?.trim()) return "Every module needs a title.";
  if (!Array.isArray(moduleInput.lessons) || moduleInput.lessons.length === 0) {
    return "Every module needs at least one lesson.";
  }
  for (const lesson of moduleInput.lessons) {
    const lessonError = validateLesson(lesson);
    if (lessonError) return lessonError;
  }
  return null;
}

export function validateModules(modules) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return "At least one module is required.";
  }
  for (const moduleInput of modules) {
    const moduleError = validateModule(moduleInput);
    if (moduleError) return moduleError;
  }
  return null;
}

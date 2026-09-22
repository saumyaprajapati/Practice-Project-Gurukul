// Mock curriculum repository — a third resource, deliberately kept separate
// from Course (lib/courses/courses.js) and Enrollment (lib/courses/
// enrollment.js). Rather than hand-authoring a syllabus per course (21 mock
// courses and growing), curricula are generated deterministically from each
// course's own title/category/description, so every course gets a
// consistent, plausible structure and a real backend could later replace
// this generator with authored content without touching any UI call site.
const MODULE_ARCHETYPES = [
  {
    title: "Getting Started",
    lessons: [
      { title: "Welcome and Course Overview", durationMinutes: 8 },
      { title: "Setting Up Your Environment", durationMinutes: 12 },
    ],
  },
  {
    title: "Core Concepts",
    lessons: [
      { title: "Foundational Ideas", durationMinutes: 15 },
      { title: "Key Terminology and Mental Models", durationMinutes: 12 },
      { title: "Common Pitfalls to Avoid", durationMinutes: 10 },
    ],
  },
  {
    title: "Hands-on Practice",
    lessons: [
      { title: "Worked Example, Step by Step", durationMinutes: 18 },
      { title: "Building Something Real", durationMinutes: 20 },
    ],
  },
  {
    title: "Review and Next Steps",
    lessons: [
      { title: "Putting It All Together", durationMinutes: 14 },
      { title: "Where to Go From Here", durationMinutes: 9 },
    ],
  },
];

function buildLessonContent(course, moduleTitle, lessonTitle) {
  return [
    `This lesson is part of "${moduleTitle}" in ${course.title}, taught by ${course.instructor}.`,
    `"${lessonTitle}" builds on what you've covered so far in ${course.category}. In a full version of this course, this space would hold real reading material, examples, and media specific to ${course.title}.`,
    `For now, treat this as a placeholder: the structure of the course — its modules and lessons — is real and navigable, but the lesson content itself is mock text standing in for authored material.`,
  ];
}

export function getCurriculumForCourse(course) {
  const modules = MODULE_ARCHETYPES.map((moduleArchetype, moduleIndex) => {
    const moduleId = `module-${moduleIndex + 1}`;
    return {
      id: moduleId,
      title: `Module ${moduleIndex + 1}: ${moduleArchetype.title}`,
      lessons: moduleArchetype.lessons.map((lesson, lessonIndex) => {
        const lessonId = `${moduleId}-lesson-${lessonIndex + 1}`;
        return {
          id: lessonId,
          title: lesson.title,
          durationMinutes: lesson.durationMinutes,
          content: buildLessonContent(course, moduleArchetype.title, lesson.title),
        };
      }),
    };
  });

  return { courseId: course.id, modules };
}

// Flattens modules/lessons into a single ordered list, for Next/Previous
// navigation across module boundaries and for lesson-count-based progress.
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
      });
    });
  });
  return flat;
}

// Seeds session-only completed-lesson state from the enrollment's static
// mock progress percentage — an approximation (percentage vs lesson count
// don't divide evenly) accepted as-is for a mock dataset.
export function computeInitialCompletedLessonIds(flatLessons, progress) {
  const total = flatLessons.length;
  if (total === 0) return [];
  const completedCount = Math.round((progress / 100) * total);
  return flatLessons.slice(0, completedCount).map((lesson) => lesson.lessonId);
}

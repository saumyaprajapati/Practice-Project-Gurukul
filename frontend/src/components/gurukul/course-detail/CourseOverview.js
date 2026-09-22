import SyllabusNav from "./SyllabusNav";
import CourseSidebarCard from "./CourseSidebarCard";

// Not-enrolled/expired branch: browsable overview with a locked syllabus,
// no lesson content, and the still-inert enroll/renew action.
export default function CourseOverview({ course, curriculum, isExpired, expiresAt }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="text-xl font-semibold text-charcoal">Syllabus</h2>
        <p className="mt-2 text-sm text-charcoal/70">
          Enroll to unlock every lesson below.
        </p>
        <div className="mt-4">
          <SyllabusNav curriculum={curriculum} interactive={false} />
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

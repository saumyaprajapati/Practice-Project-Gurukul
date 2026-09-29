import CourseCard from "./CourseCard";
import { COURSES } from "./coursesData";

export default function Courses() {
  return (
    <section
      id="courses"
      aria-labelledby="courses-heading"
      className="section-base section-dark"
    >
      <div className="section-inner">
        <h2 id="courses-heading" className="heading-2">
          Choose what you will master.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-cream/80">
          A small, growing set of courses to begin with.
        </p>

        <ul
          className="mt-10 flex list-none gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
            -mx-4 px-4 sm:-mx-6 sm:px-6
            md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none
            md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        >
          {COURSES.map((course) => (
            <li
              key={course.id}
              className="w-64 shrink-0 snap-center md:w-auto md:shrink"
            >
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

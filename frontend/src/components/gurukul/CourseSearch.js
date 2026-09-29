"use client";

// Reusable search input, used by CourseListing for both Buy Courses
// (always visible) and My Learning (only past 16 owned courses).
export default function CourseSearch({ value, onChange, placeholder }) {
  return (
    <div className="mb-8">
      <label htmlFor="course-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="course-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="surface-earthy w-full max-w-md rounded px-4 py-2"
      />
    </div>
  );
}

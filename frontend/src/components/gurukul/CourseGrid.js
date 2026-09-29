// Responsive course grid: 1 column mobile, 2-3 tablet, 4 desktop (the 4x4/
// 16-per-page target from Dashboard-1 is a desktop target, not a mandate
// to force 4 columns on small screens). Plain Tailwind grid — no new
// dependency needed for this.
export default function CourseGrid({ children }) {
  return (
    <ul className="grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  );
}

"use client";

// Reusable Previous/page-numbers/Next control, used by CourseListing for
// both grids. Hidden entirely when there's only one page (totalItems <= 16
// per Dashboard-2 §"Pagination").
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Course pages" className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="surface-earthy rounded px-3 py-2 text-sm font-medium disabled:opacity-40"
      >
        ←
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          aria-label={`Page ${page}`}
          className={`surface-earthy rounded px-3 py-2 text-sm font-medium ${
            page === currentPage ? "outline outline-2 outline-ochre" : ""
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="surface-earthy rounded px-3 py-2 text-sm font-medium disabled:opacity-40"
      >
        →
      </button>
    </nav>
  );
}

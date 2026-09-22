// Shared pagination logic for both course grids. Always applied AFTER
// search/filtering (Dashboard-2 §"Search + pagination"), never before.
export const PAGE_SIZE = 16;

export function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
  };
}

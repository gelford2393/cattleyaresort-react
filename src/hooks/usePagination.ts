import { useState, useEffect } from 'react';

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp to valid range when the dataset shrinks (e.g. new search with fewer results).
  // Avoids resetting to page 1 on every background refetch that returns a new array reference.
  useEffect(() => { setPage((p) => Math.min(p, totalPages)); }, [totalPages]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page,
    totalPages,
    pageItems,
    pageSize,
    totalItems: items.length,
    start: items.length === 0 ? 0 : start + 1,
    end: Math.min(start + pageSize, items.length),
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    nextPage: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}

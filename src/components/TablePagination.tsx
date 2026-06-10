import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/primitives';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  start: number;
  end: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: () => void;
  nextPage: () => void;
}

export function TablePagination({ page, totalPages, totalItems, start, end, hasPrev, hasNext, prevPage, nextPage }: TablePaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <Text size="small" color="muted">
        Showing {start}–{end} of {totalItems}
      </Text>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={prevPage} disabled={!hasPrev} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNext} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

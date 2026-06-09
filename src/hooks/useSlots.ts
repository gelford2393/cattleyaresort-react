import { useQuery } from '@tanstack/react-query';
import { fetchSlotsByDate, fetchSlotsByMonth } from '@/lib/queries';

export function useSlotsByDate(date: string) {
  return useQuery({
    queryKey: ['slots', { date }],
    queryFn: () => fetchSlotsByDate(date),
    enabled: !!date,
  });
}

export function useSlotsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['slots', { year, month }],
    queryFn: () => fetchSlotsByMonth(year, month),
    enabled: !!year && !!month,
  });
}

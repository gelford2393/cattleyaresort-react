import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBookingDetail,
  fetchBookingsByDate,
  fetchBookingSearch,
} from '@/lib/queries';
import {
  createBooking,
  deleteBookingCascade,
  updateBookingAdditionals,
  updateBookingDiscounts,
  updateBookingStatus,
  type CreateBookingInput,
} from '@/lib/mutations';

export function useBookingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingDetail(id!),
    enabled: !!id,
  });
}

export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: ['bookings', { date }],
    queryFn: () => fetchBookingsByDate(date),
    enabled: !!date,
  });
}

export function useBookingSearch(q: string) {
  return useQuery({
    queryKey: ['bookings', 'search', q],
    queryFn: () => fetchBookingSearch(q),
    enabled: true,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useUpdateBookingStatus(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useUpdateBookingDiscounts(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      discounts,
      total,
    }: {
      discounts: { careOfBy: string; others: string; amount: number }[];
      total: number;
    }) => updateBookingDiscounts(bookingId, discounts, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingAdditionals(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      additionals,
      total,
    }: {
      additionals: { description: string; amount: number }[];
      total: number;
    }) => updateBookingAdditionals(bookingId, additionals, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useDeleteBookingCascade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookingNo }: { id: string; bookingNo: string }) =>
      deleteBookingCascade(id, bookingNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

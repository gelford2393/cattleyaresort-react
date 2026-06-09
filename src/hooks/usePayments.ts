import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPaymentsByBooking, fetchPaymentsByDate } from '@/lib/queries';
import { createPayment, type CreatePaymentInput } from '@/lib/mutations';

export function usePaymentsByBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'byBooking', bookingId],
    queryFn: () => fetchPaymentsByBooking(bookingId!),
    enabled: !!bookingId,
  });
}

export function usePaymentsByDate(date: string) {
  return useQuery({
    queryKey: ['payments', { date }],
    queryFn: () => fetchPaymentsByDate(date),
    enabled: !!date,
  });
}

export function useCreatePayment(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'byBooking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

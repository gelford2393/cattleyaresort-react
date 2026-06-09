import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useBookingSearch, useDeleteBookingCascade } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { searchSchema, type SearchInput } from '@/lib/form-schemas';
import type { Booking } from '@/lib/queries';

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
  s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

export function BookingsSearchPage() {
  const navigate = useNavigate();
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  });

  const { data: bookings = [], isLoading } = useBookingSearch(submittedQuery);
  const deleteBooking = useDeleteBookingCascade();

  const onSubmit = form.handleSubmit(({ query: q }) => {
    setSubmittedQuery(q);
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBooking.mutate(
      { id: deleteTarget.id, bookingNo: deleteTarget.bookingNo },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Search Bookings</Text>
      <form onSubmit={onSubmit}>
        <Flex align="end" className="gap-3">
          <Stack gap="s-2">
            <Label>Customer Name or Booking No.</Label>
            <Input {...form.register('query')} className="w-72" />
            <FormError message={form.formState.errors.query?.message} />
          </Stack>
          <Button type="submit" disabled={isLoading}>Search</Button>
        </Flex>
      </form>
      {bookings.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking No</TableHead><TableHead>Customer</TableHead>
              <TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="cursor-pointer text-primary hover:underline" onClick={() => navigate(`/booking/${b.id}`)}>{b.bookingNo}</TableCell>
                <TableCell>{b.customer}</TableCell>
                <TableCell>{b.bookingDate}</TableCell>
                <TableCell>₱{b.total.toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(b)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {bookings.length === 0 && submittedQuery && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found</Text>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Delete booking {deleteTarget?.bookingNo} for {deleteTarget?.customer}? This will also delete all related slots and payments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}

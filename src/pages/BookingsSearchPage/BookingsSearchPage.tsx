import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useBookingSearch, useDeleteBookingCascade } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { searchSchema, type SearchInput } from '@/lib/form-schemas';
import type { Booking } from '@/lib/queries';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

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
  const pagination = usePagination(bookings, 10);
  const deleteBooking = useDeleteBookingCascade();

  const onSubmit = form.handleSubmit(({ query: q }) => setSubmittedQuery(q));

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBooking.mutate(
      { id: deleteTarget.id, bookingNo: deleteTarget.bookingNo },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  return (
    <Stack gap="s1">
      <div>
        <Text as="h1" size="xxl" weight="bold">Search Bookings</Text>
        <Text size="small" color="muted">Find bookings by customer name or booking number.</Text>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={onSubmit}>
            <Flex align="end" className="gap-3 flex-wrap">
              <Stack gap="s-2" className="flex-1 min-w-0 max-w-sm">
                <Label>Customer Name or Booking No.</Label>
                <Input {...form.register('query')} placeholder="Search…" />
                <FormError message={form.formState.errors.query?.message} />
              </Stack>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </Flex>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Flex align="center" justify="between">
            <CardTitle>Results</CardTitle>
            {bookings.length > 0 && (
              <Text size="small" color="muted">
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                {submittedQuery ? ` for "${submittedQuery}"` : ''}
              </Text>
            )}
          </Flex>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">Searching…</div>
          )}
          {!isLoading && bookings.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {submittedQuery ? `No bookings found for "${submittedQuery}"` : 'No bookings found'}
            </div>
          )}
          {!isLoading && bookings.length > 0 && (
            <>
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[24%]">Booking No</TableHead>
                    <TableHead className="w-[24%]">Customer</TableHead>
                    <TableHead className="w-[14%]">Date</TableHead>
                    <TableHead className="w-[13%]">Total</TableHead>
                    <TableHead className="w-[13%]">Status</TableHead>
                    <TableHead className="w-[12%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.pageItems.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell
                        className="cursor-pointer text-primary hover:underline font-mono text-xs truncate"
                        onClick={() => navigate(`/booking/${b.id}`)}
                      >
                        {b.bookingNo}
                      </TableCell>
                      <TableCell className="font-medium truncate">{b.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{b.bookingDate}</TableCell>
                      <TableCell>₱{b.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(b)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination {...pagination} />
            </>
          )}
        </CardContent>
      </Card>

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

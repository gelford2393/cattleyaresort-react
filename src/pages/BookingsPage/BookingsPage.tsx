import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useBookingsByDate } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import { printBookingsPDF } from './BookingsPage.logic';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

const TODAY = dayjs().format('YYYY-MM-DD');

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
  s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

export function BookingsPage() {
  const navigate = useNavigate();
  const [submittedDate, setSubmittedDate] = useState(TODAY);
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: TODAY },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: bookings = [], isLoading } = useBookingsByDate(submittedDate);
  const pagination = usePagination(bookings, 10);

  const onSubmit = form.handleSubmit(({ date }) => setSubmittedDate(date));

  return (
    <Stack gap="s1">
      <div>
        <Text as="h1" size="xxl" weight="bold">Bookings</Text>
        <Text size="small" color="muted">View all bookings for a specific date.</Text>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={onSubmit}>
            <Flex align="end" className="gap-3 flex-wrap">
              <Stack gap="s-2">
                <Label>Date</Label>
                <DatePicker
                  value={dateValue}
                  onChange={(date) => form.setValue('date', date, { shouldValidate: true })}
                  placeholder="Select date"
                />
                <FormError message={form.formState.errors.date?.message} />
              </Stack>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Search'}
              </Button>
              {bookings.length > 0 && (
                <Button type="button" variant="outline" onClick={() => printBookingsPDF(submittedDate, bookings)}>
                  Print PDF
                </Button>
              )}
            </Flex>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Flex align="center" justify="between">
            <CardTitle>Results</CardTitle>
            {bookings.length > 0 && (
              <Text size="small" color="muted">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} on {submittedDate}</Text>
            )}
          </Flex>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading bookings…</div>
          )}
          {!isLoading && bookings.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No bookings found for {submittedDate}</div>
          )}
          {!isLoading && bookings.length > 0 && (
            <>
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Booking No</TableHead>
                    <TableHead className="w-[28%]">Customer</TableHead>
                    <TableHead className="w-[14%]">Total</TableHead>
                    <TableHead className="w-[14%]">Reserve Fee</TableHead>
                    <TableHead className="w-[14%]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.pageItems.map((b) => (
                    <TableRow
                      key={b.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/booking/${b.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground truncate">{b.bookingNo}</TableCell>
                      <TableCell className="font-medium truncate">{b.customer}</TableCell>
                      <TableCell>₱{b.total.toLocaleString()}</TableCell>
                      <TableCell>₱{b.reserveFee.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
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
    </Stack>
  );
}

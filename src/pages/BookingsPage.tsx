import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useBookingsByDate } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function BookingsPage() {
  const navigate = useNavigate();
  const [submittedDate, setSubmittedDate] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: bookings = [], isLoading } = useBookingsByDate(submittedDate);

  const onSubmit = form.handleSubmit(({ date }) => {
    setSubmittedDate(date);
  });

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Bookings for ${submittedDate}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Booking No', 'Customer', 'Total', 'Reserve Fee', 'Status']],
      body: bookings.map((b) => [b.bookingNo, b.customer, `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status]),
    });
    pdf.save(`bookings-${submittedDate}.pdf`);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Bookings</Text>
      <form onSubmit={onSubmit}>
        <Flex align="end" className="gap-3">
          <Stack gap="s-2">
            <Label>Date</Label>
            <DatePicker
              value={dateValue}
              onChange={(date) => form.setValue('date', date, { shouldValidate: true })}
              placeholder="Select date"
            />
            <FormError message={form.formState.errors.date?.message} />
          </Stack>
          <Button type="submit" disabled={isLoading}>Search</Button>
          {bookings.length > 0 && <Button type="button" variant="outline" onClick={handlePrint}>Print PDF</Button>}
        </Flex>
      </form>
      {bookings.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking No</TableHead><TableHead>Customer</TableHead>
              <TableHead>Total</TableHead><TableHead>Reserve Fee</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/booking/${b.id}`)}>
                <TableCell>{b.bookingNo}</TableCell>
                <TableCell>{b.customer}</TableCell>
                <TableCell>₱{b.total.toLocaleString()}</TableCell>
                <TableCell>₱{b.reserveFee.toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {bookings.length === 0 && submittedDate && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found for {submittedDate}</Text>
      )}
    </Stack>
  );
}

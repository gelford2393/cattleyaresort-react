import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookingRow {
  id: string; bookingNo: string; customer: string;
  total: number; reserveFee: number; status: string; bookingDate: string;
}

export function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const onSubmit = form.handleSubmit(async ({ date }) => {
    setLoading(true);
    setSearched(date);
    const snap = await getDocs(query(collection(firestore, 'bookings'), where('bookingDate', '==', date)));
    setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingRow)));
    setLoading(false);
  });

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Bookings for ${searched}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Booking No', 'Customer', 'Total', 'Reserve Fee', 'Status']],
      body: bookings.map((b) => [b.bookingNo, b.customer, `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status]),
    });
    pdf.save(`bookings-${searched}.pdf`);
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
            <Input type="date" {...form.register('date')} className="w-44" />
            <FormError message={form.formState.errors.date?.message} />
          </Stack>
          <Button type="submit" disabled={loading}>Search</Button>
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
      {bookings.length === 0 && searched && !loading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found for {searched}</Text>
      )}
    </Stack>
  );
}

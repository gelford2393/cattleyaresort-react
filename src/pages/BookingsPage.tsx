import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookingRow {
  id: string;
  bookingNo: string;
  customer: string;
  total: number;
  reserveFee: number;
  status: string;
  bookingDate: string;
}

export function BookingsPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    if (!date) return;
    setLoading(true);
    const snap = await getDocs(query(collection(firestore, 'bookings'), where('bookingDate', '==', date)));
    setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingRow)));
    setLoading(false);
  };

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Bookings for ${date}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Booking No', 'Customer', 'Total', 'Reserve Fee', 'Status']],
      body: bookings.map((b) => [b.bookingNo, b.customer, `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status]),
    });
    pdf.save(`bookings-${date}.pdf`);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bookings</h1>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button onClick={loadBookings} disabled={loading || !date}>Search</Button>
        {bookings.length > 0 && <Button variant="outline" onClick={handlePrint}>Print PDF</Button>}
      </div>
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
      {bookings.length === 0 && date && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">No bookings found for {date}</p>
      )}
    </div>
  );
}

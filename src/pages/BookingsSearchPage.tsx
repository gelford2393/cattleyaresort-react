import { useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BookingRow { id: string; bookingNo: string; customer: string; total: number; status: string; bookingDate: string; }

export function BookingsSearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookingRow | null>(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const byName = await getDocs(query(collection(firestore, 'bookings'), where('customer', '>=', search), where('customer', '<=', search + '')));
    const byNo = await getDocs(query(collection(firestore, 'bookings'), where('bookingNo', '==', search)));
    const combined = new Map<string, BookingRow>();
    [...byName.docs, ...byNo.docs].forEach((d) => combined.set(d.id, { id: d.id, ...d.data() } as BookingRow));
    setBookings([...combined.values()]);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(firestore, 'bookings', deleteTarget.id));
    const slotsSnap = await getDocs(query(collection(firestore, 'slots'), where('bookingNo', '==', deleteTarget.bookingNo)));
    await Promise.all(slotsSnap.docs.map((d) => deleteDoc(d.ref)));
    const paymentsSnap = await getDocs(query(collection(firestore, 'payments'), where('bookingNo', '==', deleteTarget.bookingNo)));
    await Promise.all(paymentsSnap.docs.map((d) => deleteDoc(d.ref)));
    setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search Bookings</h1>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Customer Name or Booking No.</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-72" />
        </div>
        <Button onClick={handleSearch} disabled={loading || !search.trim()}>Search</Button>
      </div>
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
      {bookings.length === 0 && search && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">No bookings found</p>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

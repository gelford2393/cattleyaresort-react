import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SlotRow { id: string; pool: string; type: string; bookingNo: string; status: string; }

export function SlotsPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSlots = async () => {
    if (!date) return;
    setLoading(true);
    const snap = await getDocs(query(collection(firestore, 'slots'), where('date', '==', date)));
    setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SlotRow)));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Slots</h1>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button onClick={loadSlots} disabled={loading || !date}>Search</Button>
      </div>
      {slots.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool</TableHead><TableHead>Type</TableHead><TableHead>Booking No.</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/booking/${s.bookingNo}`)}>
                <TableCell>{s.pool}</TableCell>
                <TableCell>{s.type}</TableCell>
                <TableCell className={s.status === 'BOOKED' ? 'text-red-500' : 'text-yellow-600'}>{s.bookingNo}</TableCell>
                <TableCell>{s.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {slots.length === 0 && date && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">No slots found for {date}</p>
      )}
    </div>
  );
}

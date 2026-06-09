import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { firestore } from '@/lib/firebase';
import { Flex } from '@/components/ui/primitives';

interface SlotEntry { pool: string; type: string; bookingNo: string; status: string; }
interface Props { date: string; }

export function CalendarMarker({ date }: Props) {
  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) return;
    getDocs(query(collection(firestore, 'slots'), where('date', '==', date))).then((snap) => {
      setSlots(snap.docs.map((d) => d.data() as SlotEntry));
    });
  }, [date]);

  const dayCount = slots.filter((s) => s.type === 'DAY').length;
  const nightCount = slots.filter((s) => s.type === 'NIGHT').length;
  const slotVariant = (count: number): 'default' | 'secondary' | 'destructive' =>
    count === 0 ? 'default' : count < 3 ? 'secondary' : 'destructive';

  return (
    <>
      <Flex wrap="wrap" className="gap-1 cursor-pointer" onClick={() => setOpen(true)}>
        <Badge variant={slotVariant(dayCount)} className="text-xs">D:{dayCount}</Badge>
        <Badge variant={slotVariant(nightCount)} className="text-xs">N:{nightCount}</Badge>
      </Flex>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Slots for {date}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Booking No.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((s, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/booking/${s.bookingNo}`)}
                >
                  <TableCell>{s.pool}</TableCell>
                  <TableCell>{s.type}</TableCell>
                  <TableCell className={s.status === 'BOOKED' ? 'text-red-500' : 'text-yellow-600'}>
                    {s.bookingNo}
                  </TableCell>
                  <TableCell>{s.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}

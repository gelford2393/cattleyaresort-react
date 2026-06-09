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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';

interface SlotRow { id: string; pool: string; type: string; bookingNo: string; bookingDocId?: string; status: string; }

export function SlotsPage() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const onSubmit = form.handleSubmit(async ({ date }) => {
    setLoading(true);
    setError('');
    setSearched(date);
    try {
      const snap = await getDocs(query(collection(firestore, 'slots'), where('date', '==', date)));
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SlotRow)));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Slots</Text>
      <form onSubmit={onSubmit}>
        <Flex align="end" className="gap-3">
          <Stack gap="s-2">
            <Label>Date</Label>
            <Input type="date" {...form.register('date')} className="w-44" />
            <FormError message={form.formState.errors.date?.message} />
          </Stack>
          <Button type="submit" disabled={loading}>Search</Button>
        </Flex>
      </form>
      {slots.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool</TableHead><TableHead>Type</TableHead><TableHead>Booking No.</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/booking/${s.bookingDocId ?? s.bookingNo}`)}>
                <TableCell>{s.pool}</TableCell>
                <TableCell>{s.type}</TableCell>
                <TableCell className={s.status === 'BOOKED' ? 'text-red-500' : 'text-yellow-600'}>{s.bookingNo}</TableCell>
                <TableCell>{s.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {slots.length === 0 && searched && !loading && (
        <Text size="small" color="muted" className="text-center py-8">No slots found for {searched}</Text>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}

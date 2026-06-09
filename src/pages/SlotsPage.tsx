import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useSlotsByDate } from '@/hooks/useSlots';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';

export function SlotsPage() {
  const navigate = useNavigate();
  const [submittedDate, setSubmittedDate] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: slots = [], isLoading, isError, error } = useSlotsByDate(submittedDate);

  const onSubmit = form.handleSubmit(({ date }) => {
    setSubmittedDate(date);
  });

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Slots</Text>
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
      {slots.length === 0 && submittedDate && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No slots found for {submittedDate}</Text>
      )}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}

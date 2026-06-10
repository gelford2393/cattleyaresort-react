import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useSlotsByDate } from '@/hooks/useSlots';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

const TODAY = dayjs().format('YYYY-MM-DD');

const slotStatusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
  s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

export function SlotsPage() {
  const navigate = useNavigate();
  const [submittedDate, setSubmittedDate] = useState(TODAY);
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: TODAY },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: slots = [], isLoading, isError, error } = useSlotsByDate(submittedDate);
  const pagination = usePagination(slots, 10);

  const onSubmit = form.handleSubmit(({ date }) => setSubmittedDate(date));

  return (
    <Stack gap="s1">
      <div>
        <Text as="h1" size="xxl" weight="bold">Slots</Text>
        <Text size="small" color="muted">View all pool slots for a specific date.</Text>
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
            </Flex>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Flex align="center" justify="between">
            <CardTitle>Results</CardTitle>
            {slots.length > 0 && (
              <Text size="small" color="muted">{slots.length} slot{slots.length !== 1 ? 's' : ''} on {submittedDate}</Text>
            )}
          </Flex>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading slots…</div>
          )}
          {isError && (
            <div className="py-12 text-center text-destructive text-sm">{(error as Error).message}</div>
          )}
          {!isLoading && !isError && slots.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No slots found for {submittedDate}</div>
          )}
          {!isLoading && slots.length > 0 && (
            <>
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
                  {pagination.pageItems.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/booking/${s.bookingDocId ?? s.bookingNo}`)}
                    >
                      <TableCell className="font-medium">{s.pool}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.bookingNo}</TableCell>
                      <TableCell>
                        <Badge variant={slotStatusVariant(s.status)}>{s.status}</Badge>
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

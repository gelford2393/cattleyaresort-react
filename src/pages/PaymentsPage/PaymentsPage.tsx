import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { usePaymentsByDate } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import { groupPaymentsByType, printPaymentsPDF } from './PaymentsPage.logic';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

const TODAY = dayjs().format('YYYY-MM-DD');

export function PaymentsPage() {
  const [submittedDate, setSubmittedDate] = useState(TODAY);
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: TODAY },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: payments = [], isLoading, isError, error } = usePaymentsByDate(submittedDate);
  const pagination = usePagination(payments, 10);

  const onSubmit = form.handleSubmit(({ date }) => setSubmittedDate(date));

  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const grouped = groupPaymentsByType(payments);

  return (
    <Stack gap="s1">
      <div>
        <Text as="h1" size="xxl" weight="bold">Payments</Text>
        <Text size="small" color="muted">View all payments collected on a specific date.</Text>
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
              {payments.length > 0 && (
                <Button type="button" variant="outline" onClick={() => printPaymentsPDF(submittedDate, payments)}>
                  Print PDF
                </Button>
              )}
            </Flex>
          </form>
        </CardContent>
      </Card>

      {/* Summary cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(grouped).map(([type, total]) => (
            <Card key={type}>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">{type}</CardTitle></CardHeader>
              <CardContent><Text size="xl" weight="bold">₱{total.toLocaleString()}</Text></CardContent>
            </Card>
          ))}
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Grand Total</CardTitle></CardHeader>
            <CardContent><Text size="xl" weight="bold" className="text-primary">₱{grandTotal.toLocaleString()}</Text></CardContent>
          </Card>
        </div>
      )}

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <Flex align="center" justify="between">
            <CardTitle>Results</CardTitle>
            {payments.length > 0 && (
              <Text size="small" color="muted">
                {payments.length} payment{payments.length !== 1 ? 's' : ''} on {submittedDate}
              </Text>
            )}
          </Flex>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading payments…</div>
          )}
          {isError && (
            <div className="py-12 text-center text-destructive text-sm">{(error as Error).message}</div>
          )}
          {!isLoading && !isError && payments.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No payments found for {submittedDate}</div>
          )}
          {!isLoading && payments.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Booking No.</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.pageItems.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Badge variant="secondary">{p.type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.date}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.referenceNo || '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.bookingNo}</TableCell>
                      <TableCell className="text-right font-medium">₱{p.amount.toLocaleString()}</TableCell>
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

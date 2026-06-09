import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PaymentRow { id: string; type: string; date: string; referenceNo: string; amount: number; bookingNo: string; }

export function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });

  const onSubmit = form.handleSubmit(async ({ date }) => {
    setLoading(true);
    setError('');
    setSearched(date);
    try {
      const snap = await getDocs(query(collection(firestore, 'payments'), where('date', '==', date)));
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRow)));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  });

  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const grouped = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.amount;
    return acc;
  }, {});

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Payments for ${searched}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Type', 'Date', 'Reference', 'Booking No', 'Amount']],
      body: payments.map((p) => [p.type, p.date, p.referenceNo, p.bookingNo, `₱${p.amount.toLocaleString()}`]),
    });
    pdf.save(`payments-${searched}.pdf`);
  };

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Payments</Text>
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
          <Button type="submit" disabled={loading}>Search</Button>
          {payments.length > 0 && <Button type="button" variant="outline" onClick={handlePrint}>Print PDF</Button>}
        </Flex>
      </form>

      {payments.length > 0 && (
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(grouped).map(([type, total]) => (
            <Card key={type}>
              <CardHeader className="pb-1"><CardTitle className="text-sm">{type}</CardTitle></CardHeader>
              <CardContent><Text size="xl" weight="bold">₱{total.toLocaleString()}</Text></CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
            <CardContent><Text size="xl" weight="bold">₱{grandTotal.toLocaleString()}</Text></CardContent>
          </Card>
        </Box>
      )}

      {payments.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Reference</TableHead>
              <TableHead>Booking No.</TableHead><TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell><Badge variant="secondary">{p.type}</Badge></TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell>{p.referenceNo}</TableCell>
                <TableCell>{p.bookingNo}</TableCell>
                <TableCell>₱{p.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {payments.length === 0 && searched && !loading && (
        <Text size="small" color="muted" className="text-center py-8">No payments found for {searched}</Text>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}

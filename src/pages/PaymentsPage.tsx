import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PaymentRow { id: string; type: string; date: string; referenceNo: string; amount: number; bookingNo: string; }

export function PaymentsPage() {
  const [date, setDate] = useState('');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    if (!date) return;
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(query(collection(firestore, 'payments'), where('date', '==', date)));
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRow)));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  const grouped = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.amount;
    return acc;
  }, {});

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Payments for ${date}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Type', 'Date', 'Reference', 'Booking No', 'Amount']],
      body: payments.map((p) => [p.type, p.date, p.referenceNo, p.bookingNo, `₱${p.amount.toLocaleString()}`]),
    });
    pdf.save(`payments-${date}.pdf`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payments</h1>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button onClick={loadPayments} disabled={loading || !date}>Search</Button>
        {payments.length > 0 && <Button variant="outline" onClick={handlePrint}>Print PDF</Button>}
      </div>

      {/* Totals by type — derived from actual payment data */}
      {payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(grouped).map(([type, total]) => (
            <Card key={type}>
              <CardHeader className="pb-1"><CardTitle className="text-sm">{type}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">₱{total.toLocaleString()}</p></CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">₱{grandTotal.toLocaleString()}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Payments table */}
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
      {payments.length === 0 && date && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">No payments found for {date}</p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

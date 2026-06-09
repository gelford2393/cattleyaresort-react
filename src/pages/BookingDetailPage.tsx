import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useBookingDetail,
  useUpdateBookingStatus,
  useUpdateBookingDiscounts,
  useUpdateBookingAdditionals,
} from '@/hooks/useBookings';
import { usePaymentsByBooking, useCreatePayment } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdditionalAdd } from '@/components/AdditionalAdd';
import { DiscountAdd } from '@/components/DiscountAdd';
import { PaymentAdd } from '@/components/PaymentAdd';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_OPTIONS = ['PENDING', 'PENCIL', 'BOOKED', 'CANCELLED'];

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showAdditional, setShowAdditional] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const { data: booking, isLoading, isError } = useBookingDetail(id);
  const { data: payments = [] } = usePaymentsByBooking(id);
  const updateStatus = useUpdateBookingStatus(id ?? '');
  const updateDiscounts = useUpdateBookingDiscounts(id ?? '');
  const updateAdditionals = useUpdateBookingAdditionals(id ?? '');
  const addPayment = useCreatePayment(id ?? '');

  if (isLoading) return <Box className="p-8 text-center text-muted-foreground">Loading...</Box>;
  if (isError || !booking) return <Box className="p-8 text-center text-muted-foreground">Booking not found.</Box>;

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = booking.total - totalPayments;

  const handleStatusChange = (status: string) => {
    updateStatus.mutate(status);
  };

  const handleAddDiscount = (discount: { careOfBy: string; others: string; amount: number }) => {
    const newDiscounts = [...(booking.discounts ?? []), discount];
    const newTotal =
      booking.subTotal -
      newDiscounts.reduce((s, d) => s + d.amount, 0) +
      (booking.additionals ?? []).reduce((s, a) => s + a.amount, 0);
    updateDiscounts.mutate(
      { discounts: newDiscounts, total: newTotal },
      { onSuccess: () => setShowDiscount(false) }
    );
  };

  const handleAddAdditional = (item: { description: string; amount: number }) => {
    const newAdditionals = [...(booking.additionals ?? []), item];
    const newTotal =
      booking.subTotal -
      (booking.discount ?? 0) +
      newAdditionals.reduce((s, a) => s + a.amount, 0);
    updateAdditionals.mutate(
      { additionals: newAdditionals, total: newTotal },
      { onSuccess: () => setShowAdditional(false) }
    );
  };

  const handleAddPayment = (payment: { type: string; date: string; referenceNo: string; amount: number }) => {
    addPayment.mutate(
      { bookingDocId: id!, bookingNo: booking.bookingNo, ...payment },
      { onSuccess: () => setShowPayment(false) }
    );
  };

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Cattleya Resort - Booking Receipt', 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Booking No: ${booking.bookingNo}`, 14, 35);
    pdf.text(`Date: ${booking.bookingDate}`, 14, 42);
    pdf.text(`Customer: ${booking.customer}`, 14, 49);
    pdf.text(`Status: ${booking.status}`, 14, 56);
    autoTable(pdf, {
      startY: 65,
      head: [['Pool', 'Type', 'Rate']],
      body: booking.slots.map((s) => [s.pool, s.type, `₱${s.rate.toLocaleString()}`]),
    });
    const finalY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    pdf.text(`Subtotal: ₱${booking.subTotal.toLocaleString()}`, 14, finalY);
    pdf.text(`Discount: ₱${(booking.discount ?? 0).toLocaleString()}`, 14, finalY + 7);
    pdf.text(`Total: ₱${booking.total.toLocaleString()}`, 14, finalY + 14);
    pdf.text(`Paid: ₱${totalPayments.toLocaleString()}`, 14, finalY + 21);
    pdf.text(`Balance: ₱${balance.toLocaleString()}`, 14, finalY + 28);
    pdf.save(`${booking.bookingNo}.pdf`);
  };

  return (
    <Stack gap="s1">
      <Flex align="center" justify="between" wrap="wrap" gap="s-1">
        <Box>
          <Text as="h1" size="xxl" weight="bold">{booking.bookingNo}</Text>
          <Text color="muted">{booking.customer} · {booking.bookingDate}</Text>
        </Box>
        <Flex align="center" gap="s-1">
          <Select value={booking.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>Print PDF</Button>
        </Flex>
      </Flex>

      <Card>
        <CardHeader><CardTitle>Slots</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Pool</TableHead><TableHead>Type</TableHead><TableHead>Rate</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {booking.slots.map((s, i) => (
                <TableRow key={i}>
                  <TableCell>{s.pool}</TableCell>
                  <TableCell>{s.type}</TableCell>
                  <TableCell>₱{s.rate.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box className="text-right mt-2 font-semibold">Subtotal: ₱{booking.subTotal.toLocaleString()}</Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Discounts</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowDiscount(true)}>+ Add</Button>
        </CardHeader>
        <CardContent>
          {(booking.discounts ?? []).length === 0
            ? <Text size="small" color="muted">No discounts</Text>
            : <Table>
                <TableHeader><TableRow>
                  <TableHead>Care of By</TableHead><TableHead>Reason</TableHead><TableHead>Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(booking.discounts ?? []).map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{d.careOfBy}</TableCell>
                      <TableCell>{d.others}</TableCell>
                      <TableCell>₱{d.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Additional Charges</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAdditional(true)}>+ Add</Button>
        </CardHeader>
        <CardContent>
          {(booking.additionals ?? []).length === 0
            ? <Text size="small" color="muted">No additional charges</Text>
            : <Table>
                <TableHeader><TableRow>
                  <TableHead>Description</TableHead><TableHead>Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(booking.additionals ?? []).map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>{a.description}</TableCell>
                      <TableCell>₱{a.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowPayment(true)}>+ Add</Button>
        </CardHeader>
        <CardContent>
          {payments.length === 0
            ? <Text size="small" color="muted">No payments</Text>
            : <Table>
                <TableHeader><TableRow>
                  <TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.referenceNo}</TableCell>
                      <TableCell>₱{p.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
          <Stack className="mt-2 space-y-1 text-sm text-right">
            <Box>Total: <strong>₱{booking.total.toLocaleString()}</strong></Box>
            <Box>Paid: <strong>₱{totalPayments.toLocaleString()}</strong></Box>
            <Box>Balance: <strong className={balance > 0 ? 'text-red-500' : 'text-green-600'}>₱{balance.toLocaleString()}</strong></Box>
          </Stack>
        </CardContent>
      </Card>

      {updateStatus.isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to update status. Please try again.</AlertDescription>
        </Alert>
      )}

      <AdditionalAdd open={showAdditional} onClose={() => setShowAdditional(false)} onSave={handleAddAdditional} />
      <DiscountAdd open={showDiscount} onClose={() => setShowDiscount(false)} onSave={handleAddDiscount} />
      <PaymentAdd open={showPayment} onClose={() => setShowPayment(false)} onSave={handleAddPayment} />
    </Stack>
  );
}

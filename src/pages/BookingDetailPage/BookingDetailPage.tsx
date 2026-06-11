import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { AdditionalAdd } from './AdditionalAdd';
import { DiscountAdd } from './DiscountAdd';
import { PaymentAdd } from './PaymentAdd';
import { printBookingPDF } from './BookingDetailPage.logic';

const STATUS_OPTIONS = ['PENDING', 'BOOKED', 'CANCELLED', 'PENCIL'];

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isModal = location.state?.modal === true;
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
    updateStatus.mutate(status, {
      onSuccess: () => toast.success('Status updated'),
      onError: () => toast.error('Failed to update status'),
    });
  };

  const handleAddDiscount = (discount: { careOfBy: string; others: string; amount: number }) => {
    const newDiscounts = [...(booking.discounts ?? []), discount];
    const newTotal =
      booking.subTotal -
      newDiscounts.reduce((s, d) => s + d.amount, 0) +
      (booking.additionals ?? []).reduce((s, a) => s + a.amount, 0);
    updateDiscounts.mutate(
      { discounts: newDiscounts, total: newTotal },
      {
        onSuccess: () => { setShowDiscount(false); toast.success('Discount added'); },
        onError: () => toast.error('Failed to add discount'),
      }
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
      {
        onSuccess: () => { setShowAdditional(false); toast.success('Additional charge added'); },
        onError: () => toast.error('Failed to add additional charge'),
      }
    );
  };

  const handleAddPayment = (payment: { type: string; date: string; referenceNo: string; amount: number }) => {
    addPayment.mutate(
      { bookingDocId: id!, bookingNo: booking.bookingNo, ...payment },
      {
        onSuccess: () => { setShowPayment(false); toast.success('Payment recorded'); },
        onError: () => toast.error('Failed to record payment'),
      }
    );
  };

  const content = (
    <Stack gap="s1">
      <Flex align="center" justify="between" wrap="wrap" gap="s-1">
        <Box>
          <Text as="h1" size="xxl" weight="bold">{booking.bookingNo}</Text>
          <Text color="muted">{booking.customer} · {booking.bookingDate}</Text>
        </Box>
        <Flex align="center" gap="s-1">
          {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Select value={booking.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => printBookingPDF(booking, payments)}>Print PDF</Button>
        </Flex>
      </Flex>

      <Card>
        <CardHeader><CardTitle>Slots</CardTitle></CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableHeader><TableRow>
              <TableHead className="w-[45%]">Pool</TableHead><TableHead className="w-[30%]">Type</TableHead><TableHead className="w-[25%]">Rate</TableHead>
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
            : <Table className="table-fixed w-full">
                <TableHeader><TableRow>
                  <TableHead className="w-[30%]">Care of By</TableHead><TableHead className="w-[50%]">Reason</TableHead><TableHead className="w-[20%]">Amount</TableHead>
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
            : <Table className="table-fixed w-full">
                <TableHeader><TableRow>
                  <TableHead className="w-[75%]">Description</TableHead><TableHead className="w-[25%]">Amount</TableHead>
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
            : <Table className="table-fixed w-full">
                <TableHeader><TableRow>
                  <TableHead className="w-[20%]">Type</TableHead><TableHead className="w-[20%]">Date</TableHead><TableHead className="w-[40%]">Reference</TableHead><TableHead className="w-[20%]">Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell className="truncate">{p.referenceNo}</TableCell>
                      <TableCell>₱{p.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
          <div className="mt-4 pt-3 border-t text-sm w-64 ml-auto space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground font-medium">₱{booking.subTotal.toLocaleString()}</span>
            </div>
            {(booking.discount ?? 0) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span className="text-foreground font-medium">-₱{(booking.discount ?? 0).toLocaleString()}</span>
              </div>
            )}
            {(booking.additionals ?? []).length > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Additional</span>
                <span className="text-foreground font-medium">+₱{(booking.additionals ?? []).reduce((s, a) => s + a.amount, 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t font-semibold">
              <span>Total</span>
              <span>₱{booking.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span className="text-foreground font-medium">₱{totalPayments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Balance</span>
              <span className={balance > 0 ? 'text-destructive' : 'text-success'}>₱{balance.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdditionalAdd open={showAdditional} onClose={() => setShowAdditional(false)} onSave={handleAddAdditional} isPending={updateAdditionals.isPending} />
      <DiscountAdd open={showDiscount} onClose={() => setShowDiscount(false)} onSave={handleAddDiscount} isPending={updateDiscounts.isPending} />
      <PaymentAdd open={showPayment} onClose={() => setShowPayment(false)} onSave={handleAddPayment} isPending={addPayment.isPending} />
    </Stack>
  );

  if (isModal) {
    return (
      <Dialog open onOpenChange={(isOpen) => !isOpen && navigate(-1)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{booking.bookingNo} — {booking.customer}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}

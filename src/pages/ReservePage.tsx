import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { reserveSchema, type ReserveInput, type SlotInput } from '@/lib/form-schemas';

export function ReservePage() {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const [submitError, setSubmitError] = useState('');

  const form = useForm<ReserveInput>({
    resolver: zodResolver(reserveSchema),
    defaultValues: { customer: '', email: '', phone: '', bookingDate: '', slots: [] },
  });

  const selectedSlots = form.watch('slots');

  const toggleSlot = (pool: string, type: 'DAY' | 'NIGHT', rate: number) => {
    const exists = selectedSlots.find((s) => s.pool === pool && s.type === type);
    const next: SlotInput[] = exists
      ? selectedSlots.filter((s) => !(s.pool === pool && s.type === type))
      : [...selectedSlots, { pool, type, rate }];
    form.setValue('slots', next, { shouldValidate: true });
  };

  const isSelected = (pool: string, type: 'DAY' | 'NIGHT') =>
    selectedSlots.some((s) => s.pool === pool && s.type === type);

  const subTotal = selectedSlots.reduce((sum, s) => sum + s.rate, 0);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError('');
    const bookingNo = `CR-${Date.now()}`;
    try {
      const user = auth.currentUser;
      const bookingRef = await addDoc(collection(firestore, 'bookings'), {
        bookingNo,
        bookingDate: values.bookingDate,
        customer: values.customer,
        email: values.email,
        phone: values.phone,
        slots: values.slots,
        subTotal,
        discount: 0,
        total: subTotal,
        reserveFee: 0,
        status: 'PENDING',
        createdBy: user?.email ?? '',
        createdAt: Timestamp.now(),
      });
      await Promise.all(
        values.slots.map((slot) =>
          addDoc(collection(firestore, 'slots'), {
            bookingNo,
            bookingDocId: bookingRef.id,
            pool: slot.pool,
            type: slot.type,
            date: values.bookingDate,
            status: 'PENDING',
          }),
        ),
      );
      navigate(`/booking/${bookingRef.id}`);
    } catch (e: unknown) {
      setSubmitError((e as Error).message);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="s1">
        <Text as="h1" size="xxl" weight="bold">Reserve</Text>

        {/* Pool selection grid */}
        <Box className="grid grid-cols-2 md:grid-cols-3 gap-[var(--s-1)]">
          {pools.map((pool) => (
            <Card key={pool.pool} className="p-3">
              <Text size="small" weight="medium" className="mb-2">{pool.pool}</Text>
              <Stack gap="s-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected(pool.pool, 'DAY')}
                    onChange={() => toggleSlot(pool.pool, 'DAY', pool.dayRate)}
                  />
                  <Text as="span" size="small">Day ₱{pool.dayRate.toLocaleString()}</Text>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected(pool.pool, 'NIGHT')}
                    onChange={() => toggleSlot(pool.pool, 'NIGHT', pool.nightRate)}
                  />
                  <Text as="span" size="small">Night ₱{pool.nightRate.toLocaleString()}</Text>
                </label>
              </Stack>
            </Card>
          ))}
        </Box>
        <FormError message={form.formState.errors.slots?.message} />

        {/* Selected slots summary */}
        {selectedSlots.length > 0 && (
          <Flex gap="s-1" wrap="wrap">
            {selectedSlots.map((s) => (
              <Badge key={`${s.pool}-${s.type}`} variant="secondary">
                {s.pool} {s.type} ₱{s.rate.toLocaleString()}
              </Badge>
            ))}
            <Text size="small" weight="semibold" className="w-full">Subtotal: ₱{subTotal.toLocaleString()}</Text>
          </Flex>
        )}

        {/* Booking form */}
        <Card>
          <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
          <CardContent className="grid gap-[var(--s0)] sm:grid-cols-2">
            <Stack gap="s-2">
              <Label>Customer Name *</Label>
              <Input {...form.register('customer')} />
              <FormError message={form.formState.errors.customer?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
              <FormError message={form.formState.errors.email?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Phone</Label>
              <Input {...form.register('phone')} />
              <FormError message={form.formState.errors.phone?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Booking Date *</Label>
              <Input type="date" {...form.register('bookingDate')} />
              <FormError message={form.formState.errors.bookingDate?.message} />
            </Stack>
          </CardContent>
        </Card>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Reserving...' : 'Reserve'}
        </Button>
      </Stack>
    </form>
  );
}

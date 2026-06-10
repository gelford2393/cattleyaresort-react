import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@/store/useAppStore';
import { useCreateBooking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { DatePicker } from '@/components/DatePicker';
import { reserveSchema, type ReserveInput, type SlotInput } from '@/lib/form-schemas';

interface ReserveFormProps {
  defaultPool?: string;
  defaultDate?: string;
  defaultSlotType?: 'DAY' | 'NIGHT';
  hidePoolSelector?: boolean;
  takenSlots?: { pool: string; type: 'DAY' | 'NIGHT' }[];
  onSuccess?: (bookingDocId: string) => void;
  onDateChange?: (date: string) => void;
}

export function ReserveForm({ defaultPool, defaultDate, defaultSlotType, hidePoolSelector, takenSlots = [], onSuccess, onDateChange }: ReserveFormProps) {
  const pools = useAppStore((s) => s.pools);
  const createBooking = useCreateBooking();

  const preSelectedPool = pools.find((p) => p.pool === defaultPool);
  const preSelectedSlots: SlotInput[] =
    preSelectedPool && defaultSlotType
      ? [{
          pool: preSelectedPool.pool,
          type: defaultSlotType,
          rate: defaultSlotType === 'DAY' ? preSelectedPool.dayRate : preSelectedPool.nightRate,
          depositRate: preSelectedPool.depositRate,
        }]
      : [];

  const form = useForm<ReserveInput>({
    resolver: zodResolver(reserveSchema),
    defaultValues: {
      customer: '',
      email: '',
      phone: '',
      bookingDate: defaultDate ?? '',
      slots: preSelectedSlots,
    },
  });

  const selectedSlots = useWatch({ control: form.control, name: 'slots' });
  const bookingDateValue = useWatch({ control: form.control, name: 'bookingDate' });

  const takenKey = takenSlots.map((s) => `${s.pool}-${s.type}`).sort().join(',');
  useEffect(() => {
    const current = form.getValues('slots');
    const filtered = current.filter((s) => !takenSlots.some((t) => t.pool === s.pool && t.type === s.type));
    if (filtered.length !== current.length) {
      form.setValue('slots', filtered, { shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takenKey]);

  const toggleSlot = (pool: string, type: 'DAY' | 'NIGHT', rate: number, depositRate: number) => {
    const exists = selectedSlots.find((s) => s.pool === pool && s.type === type);
    const next: SlotInput[] = exists
      ? selectedSlots.filter((s) => !(s.pool === pool && s.type === type))
      : [...selectedSlots, { pool, type, rate, depositRate }];
    form.setValue('slots', next, { shouldValidate: true });
  };

  const isSelected = (pool: string, type: 'DAY' | 'NIGHT') =>
    selectedSlots.some((s) => s.pool === pool && s.type === type);

  const isTaken = (pool: string, type: 'DAY' | 'NIGHT') =>
    takenSlots.some((s) => s.pool === pool && s.type === type);

  const subTotal = selectedSlots.reduce((sum, s) => sum + s.rate, 0);

  const onSubmit = form.handleSubmit((values) => {
    createBooking.mutate(
      { ...values, subTotal },
      { onSuccess: (id) => onSuccess?.(id) }
    );
  });

  return (
    <form onSubmit={onSubmit}>
      {!hidePoolSelector && <Text size="large" weight="semibold" className="mb-3">Select Pools</Text>}
      <div className={hidePoolSelector ? undefined : 'grid lg:grid-cols-[1fr_400px] gap-[var(--s1)] items-start'}>
        {!hidePoolSelector && <Box>
          <div className="max-h-[600px] overflow-y-auto pr-2">
            <Box className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-[var(--s-1)]">
              {pools.map((pool) => {
                const daySelected = isSelected(pool.pool, 'DAY');
                const nightSelected = isSelected(pool.pool, 'NIGHT');
                const anySelected = daySelected || nightSelected;
                return (
                  <Card
                    key={pool.pool}
                    className={`p-4 transition-all duration-200 ${
                      anySelected
                        ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/10'
                        : 'hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    <p className="text-base font-bold tracking-wide mb-3 leading-none">{pool.pool}</p>
                    <Stack gap="s-2">
                      {/* Day slot */}
                      <label
                        className={`flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                          isTaken(pool.pool, 'DAY')
                            ? 'opacity-40 cursor-not-allowed'
                            : daySelected
                            ? 'bg-primary/10 cursor-pointer'
                            : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={daySelected}
                          disabled={isTaken(pool.pool, 'DAY')}
                          onChange={() => toggleSlot(pool.pool, 'DAY', pool.dayRate, pool.depositRate)}
                          className="h-4 w-4 accent-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
                        />
                        <span className="flex items-center justify-between w-full text-sm font-medium leading-none">
                          <span>Day{isTaken(pool.pool, 'DAY') && <span className="text-xs text-muted-foreground ml-1">(taken)</span>}</span>
                          <span>₱{pool.dayRate.toLocaleString()}</span>
                        </span>
                      </label>
                      {/* Night slot */}
                      <label
                        className={`flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                          isTaken(pool.pool, 'NIGHT')
                            ? 'opacity-40 cursor-not-allowed'
                            : nightSelected
                            ? 'bg-primary/10 cursor-pointer'
                            : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={nightSelected}
                          disabled={isTaken(pool.pool, 'NIGHT')}
                          onChange={() => toggleSlot(pool.pool, 'NIGHT', pool.nightRate, pool.depositRate)}
                          className="h-4 w-4 accent-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
                        />
                        <span className="flex items-center justify-between w-full text-sm font-medium leading-none">
                          <span>Night{isTaken(pool.pool, 'NIGHT') && <span className="text-xs text-muted-foreground ml-1">(taken)</span>}</span>
                          <span>₱{pool.nightRate.toLocaleString()}</span>
                        </span>
                      </label>
                    </Stack>
                  </Card>
                );
              })}
            </Box>
          </div>
          <FormError message={form.formState.errors.slots?.message} />
        </Box>}

        <div className="space-y-[var(--s0)]">
          {selectedSlots.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <Stack gap="s-1">
                  <Text size="small" weight="semibold" className="text-muted-foreground">
                    Selected: {selectedSlots.length}
                  </Text>
                  <div className="max-h-[120px] overflow-y-auto">
                    <Flex gap="s-1" wrap="wrap">
                      {selectedSlots.map((s) => (
                        <Badge key={`${s.pool}-${s.type}`} variant="secondary">
                          {s.pool} {s.type}
                        </Badge>
                      ))}
                    </Flex>
                  </div>
                  <div className="pt-2 border-t border-primary/30">
                    <Text size="large" weight="bold" className="text-primary">
                      Total: ₱{subTotal.toLocaleString()}
                    </Text>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
            <CardContent className="space-y-[var(--s0)]">
              <Stack gap="s-2">
                <Label>Customer Name *</Label>
                <Input {...form.register('customer')} placeholder="Full name" />
                <FormError message={form.formState.errors.customer?.message} />
              </Stack>
              <Stack gap="s-2">
                <Label>Email</Label>
                <Input type="email" {...form.register('email')} placeholder="Email address" />
                <FormError message={form.formState.errors.email?.message} />
              </Stack>
              <Stack gap="s-2">
                <Label>Phone</Label>
                <Input {...form.register('phone')} placeholder="Phone number" />
                <FormError message={form.formState.errors.phone?.message} />
              </Stack>
              <Stack gap="s-2">
                <Label>Booking Date *</Label>
                <DatePicker
                  value={bookingDateValue}
                  onChange={(date) => {
                    form.setValue('bookingDate', date, { shouldValidate: true });
                    onDateChange?.(date);
                  }}
                  placeholder="Select booking date"
                />
                <FormError message={form.formState.errors.bookingDate?.message} />
              </Stack>
            </CardContent>
          </Card>

          {createBooking.isError && (
            <Alert variant="destructive">
              <AlertDescription>{(createBooking.error as Error).message}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={createBooking.isPending || selectedSlots.length === 0}
            className="w-full"
          >
            {createBooking.isPending ? 'Reserving...' : 'Complete Reservation'}
          </Button>
        </div>
      </div>
    </form>
  );
}

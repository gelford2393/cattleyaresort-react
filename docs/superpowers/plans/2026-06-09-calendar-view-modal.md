# Calendar View Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline CalendarMarker panel on the Calendar View with a modal that shows all 19 pools × Day/Night slot status, and lets staff add reservations or edit existing bookings directly from the calendar.

**Architecture:** A new `DateSlotsModal` component owns all nested modal state via `useReducer` with a discriminated union. Clicking ADD switches the dialog content to a `ReserveForm` (extracted from `ReservePage`). Clicking PENCIL/BOOKED navigates to `/booking/:id` with `location.state.modal = true`, which causes `BookingDetailPage` to render inside a Dialog.

**Tech Stack:** React 18, React Router v6, TanStack Query, Zustand, shadcn/ui (Dialog, Table), react-hook-form + Zod, Tailwind CSS, dayjs

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/components/ReserveForm.tsx` | Reservation form body, accepts default pool/date/slotType props |
| Modify | `src/pages/ReservePage.tsx` | Thin wrapper — renders page header + `<ReserveForm>` |
| Modify | `src/pages/BookingDetailPage.tsx` | Add modal render mode via `location.state?.modal` |
| Create | `src/components/DateSlotsModal.tsx` | Date table modal with pool grid + nested reserve form view |
| Modify | `src/pages/CalendarPage.tsx` | Swap inline CalendarMarker panel for `<DateSlotsModal>` |
| Delete | `src/components/CalendarMarker.tsx` | Replaced entirely by DateSlotsModal |

---

## Task 1: Extract ReserveForm

**Goal:** Pull the reservation form body out of `ReservePage` into a standalone component so it can be embedded in a Dialog.

**Files:**
- Create: `src/components/ReserveForm.tsx`
- Modify: `src/pages/ReservePage.tsx`

---

- [ ] **Step 1: Create `src/components/ReserveForm.tsx`**

```tsx
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
  onSuccess?: (bookingDocId: string) => void;
}

export function ReserveForm({ defaultPool, defaultDate, defaultSlotType, onSuccess }: ReserveFormProps) {
  const pools = useAppStore((s) => s.pools);
  const createBooking = useCreateBooking();

  const preSelectedPool = pools.find((p) => p.pool === defaultPool);
  const preSelectedSlots: SlotInput[] =
    preSelectedPool && defaultSlotType
      ? [{
          pool: preSelectedPool.pool,
          type: defaultSlotType,
          rate: defaultSlotType === 'DAY' ? preSelectedPool.dayRate : preSelectedPool.nightRate,
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

  const onSubmit = form.handleSubmit((values) => {
    createBooking.mutate(
      { ...values, subTotal },
      { onSuccess: (id) => onSuccess?.(id) }
    );
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="grid lg:grid-cols-[1fr_400px] gap-[var(--s1)]">
        <Box>
          <Text size="large" weight="semibold" className="mb-3">Select Pools</Text>
          <div className="max-h-[600px] overflow-y-auto pr-2">
            <Box className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-[var(--s-1)]">
              {pools.map((pool) => (
                <Card key={pool.pool} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <Text size="small" weight="medium" className="mb-2">{pool.pool}</Text>
                  <Stack gap="s-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected(pool.pool, 'DAY')}
                        onChange={() => toggleSlot(pool.pool, 'DAY', pool.dayRate)}
                        className="cursor-pointer"
                      />
                      <Text as="span" size="small">Day ₱{pool.dayRate.toLocaleString()}</Text>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected(pool.pool, 'NIGHT')}
                        onChange={() => toggleSlot(pool.pool, 'NIGHT', pool.nightRate)}
                        className="cursor-pointer"
                      />
                      <Text as="span" size="small">Night ₱{pool.nightRate.toLocaleString()}</Text>
                    </label>
                  </Stack>
                </Card>
              ))}
            </Box>
          </div>
          <FormError message={form.formState.errors.slots?.message} />
        </Box>

        <div className="space-y-[var(--s0)]">
          {selectedSlots.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <Stack gap="s-1">
                  <Text size="small" weight="semibold" className="text-gray-600">
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
                  <div className="pt-2 border-t border-green-200">
                    <Text size="large" weight="bold" className="text-green-700">
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
                  onChange={(date) => form.setValue('bookingDate', date, { shouldValidate: true })}
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
```

- [ ] **Step 2: Replace `src/pages/ReservePage.tsx` body with a wrapper**

```tsx
import { useNavigate } from 'react-router-dom';
import { Stack, Text } from '@/components/ui/primitives';
import { ReserveForm } from '@/components/ReserveForm';

export function ReservePage() {
  const navigate = useNavigate();
  return (
    <Stack gap="s1">
      <Text as="h1" size="xxl" weight="bold">Reserve</Text>
      <ReserveForm onSuccess={(id) => navigate(`/booking/${id}`)} />
    </Stack>
  );
}
```

- [ ] **Step 3: Verify Reserve page still works**

Navigate to `/reserve` in the browser. Confirm:
- Pool grid renders with all 19 pools
- Selecting a pool shows it in the summary card
- Booking date picker works
- Form submits and navigates to `/booking/:id` on success

- [ ] **Step 4: Commit**

```bash
git add src/components/ReserveForm.tsx src/pages/ReservePage.tsx
git commit -m "refactor: extract ReserveForm component from ReservePage"
```

---

## Task 2: Add Modal Mode to BookingDetailPage

**Goal:** When `BookingDetailPage` is navigated to with `location.state.modal === true`, wrap its content in a Dialog with a close button that calls `navigate(-1)`.

**Files:**
- Modify: `src/pages/BookingDetailPage.tsx`

---

- [ ] **Step 1: Add `useLocation` and `useNavigate` imports and modal wrapper to `BookingDetailPage`**

Replace the top of `BookingDetailPage.tsx` — add these two imports to the existing react-router-dom import line:

```tsx
import { useParams, useLocation, useNavigate } from 'react-router-dom';
```

Add the Dialog import after the existing ui imports:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

Inside `BookingDetailPage`, add these two lines right after the `useParams` call:

```tsx
const location = useLocation();
const navigate = useNavigate();
const isModal = location.state?.modal === true;
```

- [ ] **Step 2: Add a `wrap` helper and apply it to all return statements**

Add this helper function inside `BookingDetailPage`, just before the `if (isLoading)` check:

```tsx
const wrap = (content: React.ReactNode) => {
  if (!isModal) return <>{content}</>;
  return (
    <Dialog open onOpenChange={() => navigate(-1)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
};
```

Apply `wrap` to the loading and error early returns:

```tsx
if (isLoading) return wrap(<Box className="p-8 text-center text-muted-foreground">Loading...</Box>);
if (isError || !booking) return wrap(<Box className="p-8 text-center text-muted-foreground">Booking not found.</Box>);
```

And wrap the main return at the bottom. Replace `return (` with:

```tsx
return wrap(
```

And replace the closing `);` of the JSX with `);` (the `wrap` call closes it). The full final return should look like:

```tsx
return wrap(
  <Stack gap="s1">
    {/* ...all existing content unchanged... */}
  </Stack>
);
```

- [ ] **Step 3: Verify modal mode works**

Open any booking directly via `/booking/:id` — confirm it still renders as a full page with no Dialog wrapper.

Then in the browser console, manually navigate:
```js
// In browser devtools console on any authenticated page:
window.__reactFiber = true; // just a note — use the React Router navigate hook via UI
```
Instead, temporarily add a test link in `CalendarPage.tsx`:
```tsx
<a href="/booking/SOME_REAL_ID" onClick={(e) => { e.preventDefault(); navigate('/booking/SOME_REAL_ID', { state: { modal: true } }); }}>
  Test modal
</a>
```
Confirm the booking detail renders inside a Dialog. Remove the test link before committing.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BookingDetailPage.tsx
git commit -m "feat: add modal render mode to BookingDetailPage via location state"
```

---

## Task 3: Create DateSlotsModal

**Goal:** Build the main calendar date modal — a Dialog with a scrollable table of all 19 pools × Day/Night. Each cell shows ADD (green), PENCIL (yellow), or BOOKED (red) based on slot status. ADD switches the dialog content to the `ReserveForm`. PENCIL/BOOKED navigates to the booking in modal mode.

**Files:**
- Create: `src/components/DateSlotsModal.tsx`

---

- [ ] **Step 1: Create `src/components/DateSlotsModal.tsx`**

```tsx
import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/store/useAppStore';
import { useSlotsByDate } from '@/hooks/useSlots';
import { type Slot } from '@/lib/queries';
import { ReserveForm } from '@/components/ReserveForm';

// ─── State types ──────────────────────────────────────────────────────────────

type CalendarModalView =
  | { view: 'table' }
  | { view: 'reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' };

type CalendarModalAction =
  | { type: 'open_reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { type: 'back_to_table' };

function assertNever(x: never): never {
  throw new Error(`Unhandled calendar modal action: ${JSON.stringify(x)}`);
}

function calendarModalReducer(state: CalendarModalView, action: CalendarModalAction): CalendarModalView {
  switch (action.type) {
    case 'open_reserve':
      return { view: 'reserve', pool: action.pool, date: action.date, slotType: action.slotType };
    case 'back_to_table':
      return { view: 'table' };
    default:
      return assertNever(action);
  }
}

// ─── Slot cell button ─────────────────────────────────────────────────────────

const SLOT_BUTTON_BASE = 'inline-flex items-center justify-center w-20 py-1 rounded text-xs font-semibold transition-colors';

const SLOT_STYLES = {
  ADD:    `${SLOT_BUTTON_BASE} bg-green-900 text-green-300 hover:bg-green-800`,
  PENCIL: `${SLOT_BUTTON_BASE} bg-yellow-900 text-yellow-300 hover:bg-yellow-800`,
  BOOKED: `${SLOT_BUTTON_BASE} bg-red-900 text-red-300 hover:bg-red-800`,
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  date: string;
  onClose: () => void;
}

export function DateSlotsModal({ open, date, onClose }: Props) {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const { data: slots = [] } = useSlotsByDate(date);
  const [modalView, dispatch] = useReducer(calendarModalReducer, { view: 'table' });

  const slotMap = slots.reduce<Record<string, Slot>>((acc, s) => {
    acc[`${s.pool}-${s.type}`] = s;
    return acc;
  }, {});

  const handleClose = () => {
    dispatch({ type: 'back_to_table' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        {modalView.view === 'table' && (
          <>
            <DialogHeader>
              <DialogTitle>{dayjs(date).format('ddd, MMM DD YYYY')}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead className="text-center">Day</TableHead>
                    <TableHead className="text-center">Night</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool) => (
                    <TableRow key={pool.pool}>
                      <TableCell className="font-medium">{pool.pool}</TableCell>
                      {(['DAY', 'NIGHT'] as const).map((type) => {
                        const slot = slotMap[`${pool.pool}-${type}`];
                        return (
                          <TableCell key={type} className="text-center">
                            {!slot && (
                              <button
                                className={SLOT_STYLES.ADD}
                                onClick={() =>
                                  dispatch({ type: 'open_reserve', pool: pool.pool, date, slotType: type })
                                }
                              >
                                ADD
                              </button>
                            )}
                            {slot?.status === 'PENDING' && (
                              <button
                                className={SLOT_STYLES.PENCIL}
                                onClick={() =>
                                  navigate(`/booking/${slot.bookingDocId}`, { state: { modal: true } })
                                }
                              >
                                PENCIL
                              </button>
                            )}
                            {slot?.status === 'BOOKED' && (
                              <button
                                className={SLOT_STYLES.BOOKED}
                                onClick={() =>
                                  navigate(`/booking/${slot.bookingDocId}`, { state: { modal: true } })
                                }
                              >
                                BOOKED
                              </button>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {modalView.view === 'reserve' && (
          <>
            <DialogHeader>
              <DialogTitle>New Reservation</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 pt-2">
              <ReserveForm
                defaultPool={modalView.pool}
                defaultDate={modalView.date}
                defaultSlotType={modalView.slotType}
                onSuccess={() => dispatch({ type: 'back_to_table' })}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DateSlotsModal.tsx
git commit -m "feat: add DateSlotsModal with pool grid and nested reserve form"
```

---

## Task 4: Wire DateSlotsModal into CalendarPage and Remove CalendarMarker

**Goal:** Replace the inline CalendarMarker bottom panel in `CalendarPage` with `<DateSlotsModal>`. Delete `CalendarMarker.tsx`.

**Files:**
- Modify: `src/pages/CalendarPage.tsx`
- Delete: `src/components/CalendarMarker.tsx`

---

- [ ] **Step 1: Update `src/pages/CalendarPage.tsx`**

Replace the entire file with:

```tsx
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import { type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CurrentMonth } from '@/components/CurrentMonth';
import { DateSlotsModal } from '@/components/DateSlotsModal';
import { useSlotsByMonth } from '@/hooks/useSlots';
import { Box, Stack, Text } from '@/components/ui/primitives';
import '@fullcalendar/common/main.css';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: slots = [] } = useSlotsByMonth(currentDate.year(), currentDate.month() + 1);

  const events = useMemo<EventInput[]>(() => {
    const counts = slots.reduce<Record<string, { day: number; night: number }>>((acc, slot) => {
      if (!slot.date) return acc;
      if (!acc[slot.date]) acc[slot.date] = { day: 0, night: 0 };
      if (slot.type === 'NIGHT') acc[slot.date].night += 1;
      else acc[slot.date].day += 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([date, count]) => ({
      id: date,
      title: `D:${count.day} N:${count.night}`,
      start: date,
      allDay: true,
      className: count.day + count.night > 0 ? 'bg-secondary text-secondary-foreground' : '',
    }));
  }, [slots]);

  return (
    <Stack gap="s0">
      <Stack gap="s0" className="md:flex-row md:items-center md:justify-between">
        <Box>
          <Text as="h1" size="xxl" weight="bold">Calendar</Text>
          <Text size="small" color="muted">Monthly booking overview with slot counts on each day.</Text>
        </Box>
        <CurrentMonth value={currentDate} onChange={setCurrentDate} />
      </Stack>

      <Box className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth',
          }}
          events={events}
          datesSet={(arg) => setCurrentDate(dayjs(arg.start))}
          dateClick={(arg) => setSelectedDate(arg.dateStr)}
          eventClick={(arg) => setSelectedDate(arg.event.startStr)}
          height="auto"
          dayMaxEvents={true}
          initialDate={currentDate.format('YYYY-MM-DD')}
        />
      </Box>

      <DateSlotsModal
        open={!!selectedDate}
        date={selectedDate ?? ''}
        onClose={() => setSelectedDate(null)}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Delete `src/components/CalendarMarker.tsx`**

```bash
git rm src/components/CalendarMarker.tsx
```

- [ ] **Step 3: Verify end-to-end**

Open the Calendar View at `/calendar-view`. Confirm:

1. Clicking a date with no slots → modal opens, all pools show **ADD** (green)
2. Clicking ADD on any pool → dialog content switches to the reservation form with pool and date pre-filled
3. Completing the reservation → form submits, dialog returns to pool table, the newly booked slot now shows **PENCIL** or **BOOKED**
4. Clicking **PENCIL** or **BOOKED** → navigates to `/booking/:id` with the booking rendered in a Dialog
5. Closing the booking dialog (`navigate(-1)`) → returns to Calendar View
6. Direct navigation to `/booking/:id` (no modal state) → renders as a full page, no dialog wrapper

- [ ] **Step 4: Commit**

```bash
git add src/pages/CalendarPage.tsx
git commit -m "feat: wire DateSlotsModal into CalendarPage, remove CalendarMarker"
```

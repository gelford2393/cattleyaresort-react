# Calendar View Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline CalendarMarker panel with a Dialog modal that shows all 19 pools × Day/Night slot status, with ADD → ReserveForm and PENCIL/BOOKED → BookingDetailPage (modal mode) flows.

**Architecture:** `CalendarPage` manages `selectedDate` via `useState`; clicking a date opens `DateSlotsModal` which owns nested modal state via `useReducer` over a discriminated union. `BookingDetailPage` gains a modal rendering mode detected from `location.state.modal`.

**Tech Stack:** React, TypeScript, TanStack Query, Zustand (`useAppStore`), React Router v6, shadcn/ui Dialog, dayjs

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/DateSlotsModal.tsx` | **Create** | Pool × Day/Night grid, ADD/PENCIL/BOOKED buttons, nested ReserveForm dialog, navigate to BookingDetailPage modal mode |
| `src/pages/CalendarPage.tsx` | **Modify** | Swap inline `CalendarMarker` panel for `<DateSlotsModal>` |
| `src/pages/BookingDetailPage.tsx` | **Modify** | Detect `location.state?.modal` and wrap content in Dialog with close button |
| `src/components/CalendarMarker.tsx` | **Delete** | Fully replaced by `DateSlotsModal` |

> **Note:** `ReserveForm` extraction (defined in spec) is already complete — `src/components/ReserveForm.tsx` exists with the exact `ReserveFormProps` interface from the spec.

---

### Task 1: Create `src/components/DateSlotsModal.tsx`

**Files:**
- Create: `src/components/DateSlotsModal.tsx`

- [ ] **Step 1: Write the full component**

Create `src/components/DateSlotsModal.tsx` with this content:

```tsx
import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { useSlotsByDate } from '@/hooks/useSlots';
import { ReserveForm } from '@/components/ReserveForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Slot } from '@/lib/queries';

// ── Types ──────────────────────────────────────────────────────────────────────

type CalendarModalView =
  | { view: 'table' }
  | { view: 'reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { view: 'booking'; bookingDocId: string };

type CalendarModalAction =
  | { type: 'open_reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { type: 'open_booking'; bookingDocId: string }
  | { type: 'back_to_table' };

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}

function reducer(_state: CalendarModalView, action: CalendarModalAction): CalendarModalView {
  switch (action.type) {
    case 'open_reserve':
      return { view: 'reserve', pool: action.pool, date: action.date, slotType: action.slotType };
    case 'open_booking':
      return { view: 'booking', bookingDocId: action.bookingDocId };
    case 'back_to_table':
      return { view: 'table' };
    default:
      return assertNever(action);
  }
}

// ── Slot state helpers ─────────────────────────────────────────────────────────

type SlotState =
  | { kind: 'empty' }
  | { kind: 'pending'; bookingDocId: string }
  | { kind: 'booked'; bookingDocId: string };

function resolveSlotState(slots: Slot[], pool: string, slotType: 'DAY' | 'NIGHT'): SlotState {
  const slot = slots.find((s) => s.pool === pool && s.type === slotType);
  if (!slot) return { kind: 'empty' };
  if (slot.status === 'BOOKED') return { kind: 'booked', bookingDocId: slot.bookingDocId ?? '' };
  return { kind: 'pending', bookingDocId: slot.bookingDocId ?? '' };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DateSlotsModalProps {
  open: boolean;
  date: string;
  onClose: () => void;
}

export function DateSlotsModal({ open, date, onClose }: DateSlotsModalProps) {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const { data: slots = [] } = useSlotsByDate(date);
  const [state, dispatch] = useReducer(reducer, { view: 'table' });

  const handleClose = () => {
    dispatch({ type: 'back_to_table' });
    onClose();
  };

  const handleAddClick = (pool: string, slotType: 'DAY' | 'NIGHT') => {
    dispatch({ type: 'open_reserve', pool, date, slotType });
  };

  const handleBookingClick = (bookingDocId: string) => {
    navigate(`/booking/${bookingDocId}`, { state: { modal: true } });
  };

  const handleReserveSuccess = () => {
    dispatch({ type: 'back_to_table' });
  };

  return (
    <>
      {/* Main date slots dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dayjs(date).format('ddd, MMM DD YYYY')}</DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead className="text-center">Day</TableHead>
                <TableHead className="text-center">Night</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((pool) => {
                const dayState = resolveSlotState(slots, pool.pool, 'DAY');
                const nightState = resolveSlotState(slots, pool.pool, 'NIGHT');
                return (
                  <TableRow key={pool.pool}>
                    <TableCell className="font-medium">{pool.pool}</TableCell>
                    <TableCell className="text-center">
                      <SlotButton
                        slotState={dayState}
                        onAdd={() => handleAddClick(pool.pool, 'DAY')}
                        onOpen={(id) => handleBookingClick(id)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <SlotButton
                        slotState={nightState}
                        onAdd={() => handleAddClick(pool.pool, 'NIGHT')}
                        onOpen={(id) => handleBookingClick(id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Nested ReserveForm dialog */}
      {state.view === 'reserve' && (
        <Dialog open onOpenChange={() => dispatch({ type: 'back_to_table' })}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                New Reservation — {state.pool} · {state.slotType} · {state.date}
              </DialogTitle>
            </DialogHeader>
            <ReserveForm
              defaultPool={state.pool}
              defaultDate={state.date}
              defaultSlotType={state.slotType}
              onSuccess={handleReserveSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ── SlotButton ────────────────────────────────────────────────────────────────

interface SlotButtonProps {
  slotState: SlotState;
  onAdd: () => void;
  onOpen: (bookingDocId: string) => void;
}

function SlotButton({ slotState, onAdd, onOpen }: SlotButtonProps) {
  if (slotState.kind === 'empty') {
    return (
      <Button
        size="sm"
        className="w-20 bg-green-600 hover:bg-green-700 text-white"
        onClick={onAdd}
      >
        ADD
      </Button>
    );
  }
  if (slotState.kind === 'pending') {
    return (
      <Button
        size="sm"
        className="w-20 bg-yellow-500 hover:bg-yellow-600 text-white"
        onClick={() => onOpen(slotState.bookingDocId)}
      >
        ✏️
      </Button>
    );
  }
  if (slotState.kind === 'booked') {
    return (
      <Button
        size="sm"
        className="w-20 bg-red-600 hover:bg-red-700 text-white"
        onClick={() => onOpen(slotState.bookingDocId)}
      >
        BOOKED
      </Button>
    );
  }
  return assertNever(slotState);
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors related to `DateSlotsModal.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/DateSlotsModal.tsx
git commit -m "feat: add DateSlotsModal with pool grid and nested reserve/booking flows"
```

---

### Task 2: Wire `DateSlotsModal` into `CalendarPage.tsx`

**Files:**
- Modify: `src/pages/CalendarPage.tsx`

Current state: imports `CalendarMarker`, renders it inside a conditional `<Box>` panel below the calendar.

- [ ] **Step 1: Swap the import**

In `src/pages/CalendarPage.tsx`, replace:

```tsx
import { CalendarMarker } from '@/components/CalendarMarker';
```

With:

```tsx
import { DateSlotsModal } from '@/components/DateSlotsModal';
```

- [ ] **Step 2: Replace the conditional panel with the modal**

Remove the entire block at the bottom of the return:

```tsx
{selectedDate && (
  <Box className="rounded-lg border bg-card p-4">
    <Text as="h2" size="large" weight="semibold" className="mb-4">
      Details for {dayjs(selectedDate).format('MMMM D, YYYY')}
    </Text>
    <CalendarMarker date={selectedDate} />
  </Box>
)}
```

Add in its place (inside the `<Stack>`, after the FullCalendar `<Box>`):

```tsx
<DateSlotsModal
  open={!!selectedDate}
  date={selectedDate ?? ''}
  onClose={() => setSelectedDate(null)}
/>
```

The final `return` in `CalendarPage` should look like:

```tsx
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
```

Also remove the `Text` import from `CalendarPage` if it is only used by the removed panel header — check: `Text` is still used in the page header, so it stays.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/CalendarPage.tsx
git commit -m "feat: wire DateSlotsModal into CalendarPage, remove inline CalendarMarker panel"
```

---

### Task 3: Add modal mode to `BookingDetailPage.tsx`

**Files:**
- Modify: `src/pages/BookingDetailPage.tsx`

Current state: renders a full-page `<Stack>` layout. No modal awareness.

- [ ] **Step 1: Update router imports and add Dialog import**

In `src/pages/BookingDetailPage.tsx`, update the react-router-dom import to:

```tsx
import { useParams, useLocation, useNavigate } from 'react-router-dom';
```

Add this alongside the existing shadcn/ui imports:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

- [ ] **Step 2: Add modal detection inside the component body**

Right after `const { id } = useParams<{ id: string }>();` (line 26), add:

```tsx
const location = useLocation();
const navigate = useNavigate();
const isModal = location.state?.modal === true;
```

- [ ] **Step 3: Replace the single return with a content variable + two render branches**

Find the single `return (` statement at the bottom of the component. Replace it entirely with:

```tsx
const content = (
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
          <Box>Balance: <strong className={balance > 0 ? 'text-destructive' : 'text-success'}>₱{balance.toLocaleString()}</strong></Box>
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

if (isModal) {
  return (
    <Dialog open onOpenChange={() => navigate(-1)}>
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
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/BookingDetailPage.tsx
git commit -m "feat: add modal mode to BookingDetailPage via location.state.modal"
```

---

### Task 4: Delete `CalendarMarker.tsx`

**Files:**
- Delete: `src/components/CalendarMarker.tsx`

- [ ] **Step 1: Delete the file via git**

```bash
git rm src/components/CalendarMarker.tsx
```

- [ ] **Step 2: Verify no remaining imports and clean compile**

Run: `npx tsc --noEmit`
Expected: exit 0

Also check for stale references:

```bash
grep -r "CalendarMarker" src/
```

Expected: no output (file is gone, CalendarPage already updated in Task 2)

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: delete CalendarMarker, fully replaced by DateSlotsModal"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Click date → Dialog titled with formatted date | Task 1 — `dayjs(date).format('ddd, MMM DD YYYY')` in `DialogTitle` |
| Table: one row per pool, Day and Night columns | Task 1 — `pools.map()` with two `SlotButton` cells per row |
| No record → ADD (green) | Task 1 — `SlotButton` `kind='empty'` → green button |
| `PENDING` → PENCIL (yellow) | Task 1 — `SlotButton` `kind='pending'` → yellow button with ✏️ |
| `BOOKED` → BOOKED (red) | Task 1 — `SlotButton` `kind='booked'` → red button |
| ADD → ReserveForm Dialog pre-filled | Task 1 — `dispatch open_reserve` → `ReserveForm` dialog with `defaultPool/defaultDate/defaultSlotType` |
| Fields NOT disabled | Task 1 — `ReserveForm` receives no `disabled` props |
| Success → close, cache re-fetches | Task 1 — `onSuccess → dispatch back_to_table`; `useCreateBooking` already invalidates `['bookings']` and `['slots']` |
| PENCIL/BOOKED → navigate to `/booking/:id` with `modal: true` | Task 1 — `handleBookingClick` calls `navigate(...)` |
| BookingDetailPage detects modal flag | Task 3 — `location.state?.modal === true` |
| Modal mode renders in Dialog, close → `navigate(-1)` | Task 3 — `<Dialog onOpenChange={() => navigate(-1)}>` |
| `CalendarMarker` deleted | Task 4 |
| Discriminated union `CalendarModalView` | Task 1 — all three variants defined |
| `useReducer` for nested modal transitions | Task 1 — `reducer` + `useReducer` hook |
| `assertNever` in reducer default case | Task 1 — `default: return assertNever(action)` |
| `assertNever` exhaustive check in `SlotButton` | Task 1 — final `return assertNever(slotState)` after all branches |

**Placeholder scan:** None found. All steps contain complete, runnable code.

**Type consistency:**
- `SlotState` defined once; used consistently in `resolveSlotState` return type and `SlotButtonProps`
- `CalendarModalView` `reserve` variant fields (`pool`, `date`, `slotType`) map correctly to `ReserveFormProps` (`defaultPool`, `defaultDate`, `defaultSlotType`)
- `DateSlotsModalProps` (`open: boolean`, `date: string`, `onClose: () => void`) match usage in Task 2 exactly
- `CalendarModalAction` field names match every `dispatch(...)` call throughout the component

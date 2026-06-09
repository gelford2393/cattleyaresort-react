# TanStack Query Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all manual `useState + useEffect` data-fetching patterns with TanStack Query hooks backed by centralized Firestore fetcher/mutation functions.

**Architecture:** Pure async Firestore functions live in `src/lib/queries.ts` (fetchers) and `src/lib/mutations.ts` (writers/deleters). Custom hooks in `src/hooks/` wrap these with `useQuery`/`useMutation`. Pages consume only the custom hooks and drop all manual loading/error state management. `@tanstack/react-query@^5.101.0` is already installed and `QueryClientProvider` already wraps the app in `main.tsx`.

**Tech Stack:** React 18, TypeScript, TanStack Query v5, Firebase Firestore (`firebase/firestore`), dayjs

---

## File Map

**Create:**
- `src/lib/queries.ts` — shared types + pure async Firestore fetchers
- `src/lib/mutations.ts` — pure async Firestore writers/deleters
- `src/hooks/useBookings.ts` — `useQuery` + `useMutation` hooks for bookings
- `src/hooks/useSlots.ts` — `useQuery` hooks for slots
- `src/hooks/usePayments.ts` — `useQuery` + `useMutation` hooks for payments

**Modify:**
- `src/pages/BookingDetailPage.tsx`
- `src/pages/CalendarPage.tsx`
- `src/pages/PoolSlotPage.tsx`
- `src/components/CalendarMarker.tsx`
- `src/pages/BookingsPage.tsx`
- `src/pages/SlotsPage.tsx`
- `src/pages/PaymentsPage.tsx`
- `src/pages/BookingsSearchPage.tsx`
- `src/pages/ReservePage.tsx`

---

## Task 1: Create `src/lib/queries.ts`

**Files:**
- Create: `src/lib/queries.ts`

- [ ] **Step 1: Write the file**

```typescript
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { firestore } from './firebase';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface BookingDetail {
  bookingNo: string;
  bookingDate: string;
  customer: string;
  email: string;
  phone: string;
  slots: { pool: string; type: string; rate: number }[];
  subTotal: number;
  discount: number;
  total: number;
  reserveFee: number;
  status: string;
  createdBy: string;
  discounts?: { careOfBy: string; others: string; amount: number }[];
  additionals?: { description: string; amount: number }[];
}

export interface Booking {
  id: string;
  bookingNo: string;
  bookingDate: string;
  customer: string;
  total: number;
  reserveFee: number;
  status: string;
}

export interface Slot {
  id: string;
  pool: string;
  type: string;
  date: string;
  status: string;
  bookingNo: string;
  bookingDocId?: string;
}

export interface Payment {
  id: string;
  type: string;
  date: string;
  referenceNo: string;
  amount: number;
  bookingNo: string;
  bookingDocId?: string;
}

// ─── Booking Fetchers ─────────────────────────────────────────────────────────

export async function fetchBookingDetail(id: string): Promise<BookingDetail | null> {
  const snap = await getDoc(doc(firestore, 'bookings', id));
  return snap.exists() ? (snap.data() as BookingDetail) : null;
}

export async function fetchBookingsByDate(date: string): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(firestore, 'bookings'), where('bookingDate', '==', date))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
}

export async function fetchBookingSearch(q: string): Promise<Booking[]> {
  const [byName, byNo] = await Promise.all([
    getDocs(
      query(
        collection(firestore, 'bookings'),
        where('customer', '>=', q),
        where('customer', '<=', q + '')
      )
    ),
    getDocs(
      query(collection(firestore, 'bookings'), where('bookingNo', '==', q))
    ),
  ]);
  const combined = new Map<string, Booking>();
  [...byName.docs, ...byNo.docs].forEach((d) =>
    combined.set(d.id, { id: d.id, ...d.data() } as Booking)
  );
  return [...combined.values()];
}

// ─── Slot Fetchers ────────────────────────────────────────────────────────────

export async function fetchSlotsByDate(date: string): Promise<Slot[]> {
  const snap = await getDocs(
    query(collection(firestore, 'slots'), where('date', '==', date))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Slot);
}

export async function fetchSlotsByMonth(year: number, month: number): Promise<Slot[]> {
  const base = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const start = base.startOf('month').format('YYYY-MM-DD');
  const end = base.endOf('month').format('YYYY-MM-DD');
  const snap = await getDocs(
    query(
      collection(firestore, 'slots'),
      where('date', '>=', start),
      where('date', '<=', end)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Slot);
}

// ─── Payment Fetchers ─────────────────────────────────────────────────────────

export async function fetchPaymentsByBooking(bookingId: string): Promise<Payment[]> {
  const snap = await getDocs(
    query(collection(firestore, 'payments'), where('bookingDocId', '==', bookingId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
}

export async function fetchPaymentsByDate(date: string): Promise<Payment[]> {
  const snap = await getDocs(
    query(collection(firestore, 'payments'), where('date', '==', date))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat: add centralized Firestore fetchers in lib/queries.ts"
```

---

## Task 2: Create `src/lib/mutations.ts`

**Files:**
- Create: `src/lib/mutations.ts`

- [ ] **Step 1: Write the file**

```typescript
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, firestore } from './firebase';
import type { SlotInput } from './form-schemas';

export interface CreateBookingInput {
  bookingDate: string;
  customer: string;
  email: string;
  phone: string;
  slots: SlotInput[];
  subTotal: number;
}

export interface CreatePaymentInput {
  bookingDocId: string;
  bookingNo: string;
  type: string;
  date: string;
  referenceNo: string;
  amount: number;
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  const bookingNo = `CR-${Date.now()}`;
  const user = auth.currentUser;
  const bookingRef = await addDoc(collection(firestore, 'bookings'), {
    bookingNo,
    bookingDate: input.bookingDate,
    customer: input.customer,
    email: input.email,
    phone: input.phone,
    slots: input.slots,
    subTotal: input.subTotal,
    discount: 0,
    total: input.subTotal,
    reserveFee: 0,
    status: 'PENDING',
    createdBy: user?.email ?? '',
    createdAt: Timestamp.now(),
  });
  await Promise.all(
    input.slots.map((slot) =>
      addDoc(collection(firestore, 'slots'), {
        bookingNo,
        bookingDocId: bookingRef.id,
        pool: slot.pool,
        type: slot.type,
        date: input.bookingDate,
        status: 'PENDING',
      })
    )
  );
  return bookingRef.id;
}

export async function updateBookingStatus(id: string, status: string): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), { status });
}

export async function updateBookingDiscounts(
  id: string,
  discounts: { careOfBy: string; others: string; amount: number }[],
  total: number
): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), {
    discounts,
    discount: discounts.reduce((s, d) => s + d.amount, 0),
    total,
  });
}

export async function updateBookingAdditionals(
  id: string,
  additionals: { description: string; amount: number }[],
  total: number
): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), { additionals, total });
}

export async function createPayment(input: CreatePaymentInput): Promise<void> {
  await addDoc(collection(firestore, 'payments'), {
    ...input,
    createdAt: Timestamp.now(),
  });
}

export async function deleteBookingCascade(id: string, bookingNo: string): Promise<void> {
  await deleteDoc(doc(firestore, 'bookings', id));
  const [slotsSnap, paymentsSnap] = await Promise.all([
    getDocs(query(collection(firestore, 'slots'), where('bookingNo', '==', bookingNo))),
    getDocs(query(collection(firestore, 'payments'), where('bookingNo', '==', bookingNo))),
  ]);
  await Promise.all([
    ...slotsSnap.docs.map((d) => deleteDoc(d.ref)),
    ...paymentsSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors. If `SlotInput` import fails, open `src/lib/form-schemas.ts` and confirm the exported name.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mutations.ts
git commit -m "feat: add centralized Firestore mutation functions in lib/mutations.ts"
```

---

## Task 3: Create `src/hooks/useBookings.ts`

**Files:**
- Create: `src/hooks/useBookings.ts`

- [ ] **Step 1: Write the file**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBookingDetail,
  fetchBookingsByDate,
  fetchBookingSearch,
} from '@/lib/queries';
import {
  createBooking,
  deleteBookingCascade,
  updateBookingAdditionals,
  updateBookingDiscounts,
  updateBookingStatus,
  type CreateBookingInput,
} from '@/lib/mutations';

export function useBookingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingDetail(id!),
    enabled: !!id,
  });
}

export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: ['bookings', { date }],
    queryFn: () => fetchBookingsByDate(date),
    enabled: !!date,
  });
}

export function useBookingSearch(q: string) {
  return useQuery({
    queryKey: ['bookings', 'search', q],
    queryFn: () => fetchBookingSearch(q),
    enabled: !!q,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useUpdateBookingStatus(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}

export function useUpdateBookingDiscounts(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      discounts,
      total,
    }: {
      discounts: { careOfBy: string; others: string; amount: number }[];
      total: number;
    }) => updateBookingDiscounts(bookingId, discounts, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}

export function useUpdateBookingAdditionals(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      additionals,
      total,
    }: {
      additionals: { description: string; amount: number }[];
      total: number;
    }) => updateBookingAdditionals(bookingId, additionals, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}

export function useDeleteBookingCascade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookingNo }: { id: string; bookingNo: string }) =>
      deleteBookingCascade(id, bookingNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBookings.ts
git commit -m "feat: add useBookings hooks (useQuery + useMutation wrappers)"
```

---

## Task 4: Create `src/hooks/useSlots.ts`

**Files:**
- Create: `src/hooks/useSlots.ts`

- [ ] **Step 1: Write the file**

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchSlotsByDate, fetchSlotsByMonth } from '@/lib/queries';

export function useSlotsByDate(date: string) {
  return useQuery({
    queryKey: ['slots', { date }],
    queryFn: () => fetchSlotsByDate(date),
    enabled: !!date,
  });
}

export function useSlotsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['slots', { year, month }],
    queryFn: () => fetchSlotsByMonth(year, month),
  });
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSlots.ts
git commit -m "feat: add useSlots hooks"
```

---

## Task 5: Create `src/hooks/usePayments.ts`

**Files:**
- Create: `src/hooks/usePayments.ts`

- [ ] **Step 1: Write the file**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPaymentsByBooking, fetchPaymentsByDate } from '@/lib/queries';
import { createPayment, type CreatePaymentInput } from '@/lib/mutations';

export function usePaymentsByBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'byBooking', bookingId],
    queryFn: () => fetchPaymentsByBooking(bookingId!),
    enabled: !!bookingId,
  });
}

export function usePaymentsByDate(date: string) {
  return useQuery({
    queryKey: ['payments', { date }],
    queryFn: () => fetchPaymentsByDate(date),
    enabled: !!date,
  });
}

export function useCreatePayment(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'byBooking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePayments.ts
git commit -m "feat: add usePayments hooks"
```

---

## Task 6: Migrate `src/pages/BookingDetailPage.tsx`

**Files:**
- Modify: `src/pages/BookingDetailPage.tsx`

**Context:** This page has a bug in the current code — `loadBooking()` is called in mutation handlers but is only defined inside the `useEffect` callback, making it inaccessible. TQ's `invalidateQueries` naturally fixes this: after each mutation, TQ refetches `useBookingDetail` automatically.

- [ ] **Step 1: Replace the entire file**

```typescript
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
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/BookingDetailPage.tsx
git commit -m "refactor: migrate BookingDetailPage to TanStack Query"
```

---

## Task 7: Migrate `src/pages/CalendarPage.tsx`

**Files:**
- Modify: `src/pages/CalendarPage.tsx`

**Context:** The `useEffect` + `getDocs().then()` pattern is replaced with `useSlotsByMonth`. The events computation moves into a `useMemo` that derives from the query data.

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import { type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CurrentMonth } from '@/components/CurrentMonth';
import { CalendarMarker } from '@/components/CalendarMarker';
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

      {selectedDate && (
        <Box className="rounded-lg border bg-card p-4">
          <Text as="h2" size="large" weight="semibold" className="mb-4">
            Details for {dayjs(selectedDate).format('MMMM D, YYYY')}
          </Text>
          <CalendarMarker date={selectedDate} />
        </Box>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CalendarPage.tsx
git commit -m "refactor: migrate CalendarPage to TanStack Query"
```

---

## Task 8: Migrate `src/pages/PoolSlotPage.tsx`

**Files:**
- Modify: `src/pages/PoolSlotPage.tsx`

**Context:** Replaces `useState + useEffect` (with cancellation flag) with `useSlotsByMonth`. The `slotMap` memo stays unchanged — it just reads from TQ `data` instead of local state.

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { CurrentMonth } from '@/components/CurrentMonth';
import { useSlotsByMonth } from '@/hooks/useSlots';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';

export function PoolSlotPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const pools = useAppStore((s) => s.pools);

  const { data: slots = [], isLoading, isError, error } = useSlotsByMonth(
    currentDate.year(),
    currentDate.month() + 1
  );

  const slotMap = useMemo(() => {
    const m = new Map<string, string>();
    slots.forEach((s) => m.set(`${s.pool}|${s.type}|${s.date}`, s.status));
    return m;
  }, [slots]);

  const getSlotStatus = (poolName: string, type: 'DAY' | 'NIGHT', date: string) =>
    slotMap.get(`${poolName}|${type}|${date}`) ?? null;

  const daysInMonth = currentDate.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    currentDate.startOf('month').add(i, 'day').format('YYYY-MM-DD')
  );

  return (
    <Stack gap="s0">
      <Flex align="center" justify="between" wrap="wrap" gap="s-1">
        <Text as="h1" size="xxl" weight="bold">Slots per Pool</Text>
        <Flex align="center" className="gap-3">
          <CurrentMonth value={currentDate} onChange={setCurrentDate} />
          {isLoading && <Text as="span" size="small" color="muted">Loading...</Text>}
        </Flex>
      </Flex>
      <Flex className="text-xs gap-3 text-muted-foreground">
        <span><span className="inline-block w-3 h-3 rounded bg-yellow-200 mr-1"></span>Unpaid (PENDING/PENCIL)</span>
        <span><span className="inline-block w-3 h-3 rounded bg-red-200 mr-1"></span>Paid (BOOKED)</span>
      </Flex>
      <Box className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-muted sticky left-0">Pool</th>
              <th className="border px-2 py-1 bg-muted">T</th>
              {days.map((d) => (
                <th key={d} className="border px-1 py-1 bg-muted min-w-[28px]">
                  {dayjs(d).date()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) =>
              (['DAY', 'NIGHT'] as const).map((type, ti) => (
                <tr key={`${pool.pool}-${type}`}>
                  {ti === 0 && (
                    <td rowSpan={2} className="border px-2 py-1 sticky left-0 bg-background font-medium">{pool.pool}</td>
                  )}
                  <td className="border px-2 py-1 text-center text-muted-foreground">{type[0]}</td>
                  {days.map((d) => {
                    const status = getSlotStatus(pool.pool, type, d);
                    return (
                      <td
                        key={d}
                        className={cn(
                          'border px-1 py-1 text-center',
                          status === 'BOOKED' ? 'bg-red-100' :
                          status === 'PENDING' || status === 'PENCIL' ? 'bg-yellow-100' : ''
                        )}
                      >
                        {status ? '●' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Box>
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PoolSlotPage.tsx
git commit -m "refactor: migrate PoolSlotPage to TanStack Query"
```

---

## Task 9: Migrate `src/components/CalendarMarker.tsx`

**Files:**
- Modify: `src/components/CalendarMarker.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flex } from '@/components/ui/primitives';
import { useSlotsByDate } from '@/hooks/useSlots';

interface Props { date: string; }

export function CalendarMarker({ date }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: slots = [] } = useSlotsByDate(date);

  const dayCount = slots.filter((s) => s.type === 'DAY').length;
  const nightCount = slots.filter((s) => s.type === 'NIGHT').length;
  const slotVariant = (count: number): 'default' | 'secondary' | 'destructive' =>
    count === 0 ? 'default' : count < 3 ? 'secondary' : 'destructive';

  return (
    <>
      <Flex wrap="wrap" className="gap-1 cursor-pointer" onClick={() => setOpen(true)}>
        <Badge variant={slotVariant(dayCount)} className="text-xs">D:{dayCount}</Badge>
        <Badge variant={slotVariant(nightCount)} className="text-xs">N:{nightCount}</Badge>
      </Flex>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Slots for {date}</DialogTitle></DialogHeader>
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
              {slots.map((s, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/booking/${s.bookingNo}`)}
                >
                  <TableCell>{s.pool}</TableCell>
                  <TableCell>{s.type}</TableCell>
                  <TableCell className={s.status === 'BOOKED' ? 'text-red-500' : 'text-yellow-600'}>
                    {s.bookingNo}
                  </TableCell>
                  <TableCell>{s.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendarMarker.tsx
git commit -m "refactor: migrate CalendarMarker to TanStack Query"
```

---

## Task 10: Migrate `src/pages/BookingsPage.tsx`

**Files:**
- Modify: `src/pages/BookingsPage.tsx`

**Context:** Form-submit pattern. `submittedDate` state drives the query; setting it triggers an auto-fetch (since `enabled: !!date` in `useBookingsByDate`). Removes `loading` state.

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useBookingsByDate } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function BookingsPage() {
  const navigate = useNavigate();
  const [submittedDate, setSubmittedDate] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: bookings = [], isLoading } = useBookingsByDate(submittedDate);

  const onSubmit = form.handleSubmit(({ date }) => {
    setSubmittedDate(date);
  });

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Bookings for ${submittedDate}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Booking No', 'Customer', 'Total', 'Reserve Fee', 'Status']],
      body: bookings.map((b) => [b.bookingNo, b.customer, `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status]),
    });
    pdf.save(`bookings-${submittedDate}.pdf`);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Bookings</Text>
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
          <Button type="submit" disabled={isLoading}>Search</Button>
          {bookings.length > 0 && <Button type="button" variant="outline" onClick={handlePrint}>Print PDF</Button>}
        </Flex>
      </form>
      {bookings.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking No</TableHead><TableHead>Customer</TableHead>
              <TableHead>Total</TableHead><TableHead>Reserve Fee</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/booking/${b.id}`)}>
                <TableCell>{b.bookingNo}</TableCell>
                <TableCell>{b.customer}</TableCell>
                <TableCell>₱{b.total.toLocaleString()}</TableCell>
                <TableCell>₱{b.reserveFee.toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {bookings.length === 0 && submittedDate && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found for {submittedDate}</Text>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/BookingsPage.tsx
git commit -m "refactor: migrate BookingsPage to TanStack Query"
```

---

## Task 11: Migrate `src/pages/SlotsPage.tsx`

**Files:**
- Modify: `src/pages/SlotsPage.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useSlotsByDate } from '@/hooks/useSlots';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';

export function SlotsPage() {
  const navigate = useNavigate();
  const [submittedDate, setSubmittedDate] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: slots = [], isLoading, isError, error } = useSlotsByDate(submittedDate);

  const onSubmit = form.handleSubmit(({ date }) => {
    setSubmittedDate(date);
  });

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Slots</Text>
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
          <Button type="submit" disabled={isLoading}>Search</Button>
        </Flex>
      </form>
      {slots.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool</TableHead><TableHead>Type</TableHead><TableHead>Booking No.</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/booking/${s.bookingDocId ?? s.bookingNo}`)}>
                <TableCell>{s.pool}</TableCell>
                <TableCell>{s.type}</TableCell>
                <TableCell className={s.status === 'BOOKED' ? 'text-red-500' : 'text-yellow-600'}>{s.bookingNo}</TableCell>
                <TableCell>{s.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {slots.length === 0 && submittedDate && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No slots found for {submittedDate}</Text>
      )}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SlotsPage.tsx
git commit -m "refactor: migrate SlotsPage to TanStack Query"
```

---

## Task 12: Migrate `src/pages/PaymentsPage.tsx`

**Files:**
- Modify: `src/pages/PaymentsPage.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePaymentsByDate } from '@/hooks/usePayments';
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

export function PaymentsPage() {
  const [submittedDate, setSubmittedDate] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

  const dateValue = useWatch({ control: form.control, name: 'date' });
  const { data: payments = [], isLoading, isError, error } = usePaymentsByDate(submittedDate);

  const onSubmit = form.handleSubmit(({ date }) => {
    setSubmittedDate(date);
  });

  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const grouped = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.amount;
    return acc;
  }, {});

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Payments for ${submittedDate}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Type', 'Date', 'Reference', 'Booking No', 'Amount']],
      body: payments.map((p) => [p.type, p.date, p.referenceNo, p.bookingNo, `₱${p.amount.toLocaleString()}`]),
    });
    pdf.save(`payments-${submittedDate}.pdf`);
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
          <Button type="submit" disabled={isLoading}>Search</Button>
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
      {payments.length === 0 && submittedDate && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No payments found for {submittedDate}</Text>
      )}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PaymentsPage.tsx
git commit -m "refactor: migrate PaymentsPage to TanStack Query"
```

---

## Task 13: Migrate `src/pages/BookingsSearchPage.tsx`

**Files:**
- Modify: `src/pages/BookingsSearchPage.tsx`

**Context:** Search is on-demand. `submittedQuery` state drives `useBookingSearch`. Delete uses `useDeleteBookingCascade` which invalidates all booking/slot/payment caches — no manual `setBookings` filter needed after delete. Also fixes: the original search used `q + ''` (no-op concat) instead of `q + ''` for Firestore prefix search; this is corrected in `fetchBookingSearch`.

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useBookingSearch, useDeleteBookingCascade } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { searchSchema, type SearchInput } from '@/lib/form-schemas';
import type { Booking } from '@/lib/queries';

export function BookingsSearchPage() {
  const navigate = useNavigate();
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  });

  const { data: bookings = [], isLoading } = useBookingSearch(submittedQuery);
  const deleteBooking = useDeleteBookingCascade();

  const onSubmit = form.handleSubmit(({ query: q }) => {
    setSubmittedQuery(q);
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBooking.mutate(
      { id: deleteTarget.id, bookingNo: deleteTarget.bookingNo },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Search Bookings</Text>
      <form onSubmit={onSubmit}>
        <Flex align="end" className="gap-3">
          <Stack gap="s-2">
            <Label>Customer Name or Booking No.</Label>
            <Input {...form.register('query')} className="w-72" />
            <FormError message={form.formState.errors.query?.message} />
          </Stack>
          <Button type="submit" disabled={isLoading}>Search</Button>
        </Flex>
      </form>
      {bookings.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking No</TableHead><TableHead>Customer</TableHead>
              <TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="cursor-pointer text-primary hover:underline" onClick={() => navigate(`/booking/${b.id}`)}>{b.bookingNo}</TableCell>
                <TableCell>{b.customer}</TableCell>
                <TableCell>{b.bookingDate}</TableCell>
                <TableCell>₱{b.total.toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(b)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {bookings.length === 0 && submittedQuery && !isLoading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found</Text>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Delete booking {deleteTarget?.bookingNo} for {deleteTarget?.customer}? This will also delete all related slots and payments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/BookingsSearchPage.tsx
git commit -m "refactor: migrate BookingsSearchPage to TanStack Query"
```

---

## Task 14: Migrate `src/pages/ReservePage.tsx`

**Files:**
- Modify: `src/pages/ReservePage.tsx`

**Context:** `createBooking` mutation returns the new booking's doc ID. On success, navigate to the new booking detail page. `isPending` replaces `isSubmitting` for the submit button disabled state. Error is surfaced via `createBooking.isError`.

- [ ] **Step 1: Replace the entire file**

```typescript
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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

export function ReservePage() {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const createBooking = useCreateBooking();

  const form = useForm<ReserveInput>({
    resolver: zodResolver(reserveSchema),
    defaultValues: { customer: '', email: '', phone: '', bookingDate: '', slots: [] },
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
      { onSuccess: (id) => navigate(`/booking/${id}`) }
    );
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="s1">
        <Text as="h1" size="xxl" weight="bold">Reserve</Text>

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

          <div className="lg:sticky lg:top-[var(--s1)] lg:h-fit space-y-[var(--s0)]">
            {selectedSlots.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <Stack gap="s-1">
                    <Text size="small" weight="semibold" className="text-gray-600">Selected: {selectedSlots.length}</Text>
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
      </Stack>
    </form>
  );
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ReservePage.tsx
git commit -m "refactor: migrate ReservePage to TanStack Query"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `src/lib/queries.ts` — pure async fetchers | Task 1 |
| `src/lib/mutations.ts` — pure async writers | Task 2 |
| `useBookings.ts` — `useBookingsByDate`, `useBookingDetail`, `useBookingSearch` | Task 3 |
| `useSlots.ts` — `useSlotsByDate`, `useSlotsByMonth` | Task 4 |
| `usePayments.ts` — `usePaymentsByBooking`, `usePaymentsByDate` | Task 5 |
| `BookingDetailPage` → `useBookingDetail`, `usePaymentsByBooking`, 4x mutations | Task 6 |
| `CalendarPage` → `useSlotsByMonth` | Task 7 |
| `PoolSlotPage` → `useSlotsByMonth` | Task 8 |
| `CalendarMarker` → `useSlotsByDate` | Task 9 |
| `BookingsPage` → `useBookingsByDate (enabled: false pattern)` | Task 10 |
| `SlotsPage` → `useSlotsByDate (enabled: false pattern)` | Task 11 |
| `PaymentsPage` → `usePaymentsByDate (enabled: false pattern)` | Task 12 |
| `BookingsSearchPage` → `useBookingSearch + useDeleteBookingCascade` | Task 13 |
| `ReservePage` → `useCreateBooking mutation` | Task 14 |
| Cache invalidation after each mutation | Tasks 3, 5, 6, 13, 14 |
| Error handling via `isError` on pages | Tasks 6–14 |
| Query keys match spec table | Tasks 1, 3, 4, 5 |

All spec requirements covered. No gaps found.

**Placeholder scan:** No TBD, TODO, or missing code blocks found.

**Type consistency check:**
- `Booking` type defined in Task 1, imported by Task 3 hooks and Task 13 page — consistent.
- `Slot` type defined in Task 1, used in Tasks 4, 7, 8, 9 — consistent.
- `Payment` type defined in Task 1, used in Tasks 5, 6, 12 — consistent.
- `CreateBookingInput` defined in Task 2, imported in Task 3 — consistent.
- `CreatePaymentInput` defined in Task 2, imported in Task 5 — consistent.
- `useUpdateBookingStatus(bookingId)` defined in Task 3, called in Task 6 — consistent.
- `useUpdateBookingDiscounts({ discounts, total })` defined in Task 3, called in Task 6 — consistent.
- `useUpdateBookingAdditionals({ additionals, total })` defined in Task 3, called in Task 6 — consistent.
- `useDeleteBookingCascade().mutate({ id, bookingNo })` defined in Task 3, called in Task 13 — consistent.
- `useCreatePayment(bookingId).mutate(CreatePaymentInput)` defined in Task 5, called in Task 6 — consistent.
- `createBooking` returns `Promise<string>` (booking ID); `useCreateBooking().mutate(_, { onSuccess: (id) => ... })` in Task 14 uses this return value — consistent.

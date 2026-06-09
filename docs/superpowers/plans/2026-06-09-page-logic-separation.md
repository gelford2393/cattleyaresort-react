# Page Logic Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all business logic from page components into co-located `.logic.ts` files, leaving each `index.tsx` as pure JSX.

**Architecture:** Each page with logic becomes a folder (`PageName/index.tsx` + `PageName/PageName.logic.ts`). The logic file exports a `use...` hook returning a flat object. The component destructures it at the top and renders only JSX.

**Tech Stack:** React 18, TypeScript, React Hook Form, useWatch, Firebase Firestore, react-router-dom, jsPDF, dayjs, Zustand

---

## Also fix during refactor

- `BookingDetailPage`: `handleAddPayment/Discount/Additional` all call `loadBooking()` which is now inside `useEffect` and out of scope — fix using a `refreshKey` counter state.
- `CalendarPage`: `getDocs().then()` has no error handling — add try/catch.

---

## Task 1: LoginPage

**Files:**
- Create: `src/pages/LoginPage/LoginPage.logic.ts`
- Create: `src/pages/LoginPage/index.tsx`
- Delete: `src/pages/LoginPage.tsx`

- [ ] Create `src/pages/LoginPage/LoginPage.logic.ts`:

```ts
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { loginSchema, type LoginInput } from '@/lib/form-schemas';

export function useLoginPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      navigate('/calendar');
    } catch (e: unknown) {
      const err = e as FirebaseError | Error;
      setSubmitError('code' in err && err.code ? `${err.code}: ${err.message}` : err.message);
    }
  });

  return { form, submitError, onSubmit };
}
```

- [ ] Create `src/pages/LoginPage/index.tsx`:

```tsx
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { useLoginPage } from './LoginPage.logic';

export function LoginPage() {
  const { form, submitError, onSubmit } = useLoginPage();

  return (
    <Card className="w-[360px]">
      <CardHeader className="items-center">
        <img src="/cattleyaresortlogo.png" alt="Cattleya Resort" className="h-20 object-contain mb-2" />
        <CardTitle>Cattleya Resort</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...form.register('email')} />
              <FormError message={form.formState.errors.email?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} />
              <FormError message={form.formState.errors.password?.message} />
            </Stack>
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] Delete `src/pages/LoginPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract LoginPage logic into LoginPage.logic.ts`

---

## Task 2: SlotsPage

**Files:**
- Create: `src/pages/SlotsPage/SlotsPage.logic.ts`
- Create: `src/pages/SlotsPage/index.tsx`
- Delete: `src/pages/SlotsPage.tsx`

- [ ] Create `src/pages/SlotsPage/SlotsPage.logic.ts`:

```ts
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';

export interface SlotRow {
  id: string; pool: string; type: string;
  bookingNo: string; bookingDocId?: string; status: string;
}

export function useSlotsPage() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotRow[]>([]);
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
      const snap = await getDocs(query(collection(firestore, 'slots'), where('date', '==', date)));
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SlotRow)));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  });

  const navigateToBooking = (slot: SlotRow) =>
    navigate(`/booking/${slot.bookingDocId ?? slot.bookingNo}`);

  return { form, dateValue, slots, loading, error, searched, onSubmit, navigateToBooking };
}
```

- [ ] Create `src/pages/SlotsPage/index.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { useSlotsPage } from './SlotsPage.logic';

export function SlotsPage() {
  const { form, dateValue, slots, loading, error, searched, onSubmit, navigateToBooking } = useSlotsPage();

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
          <Button type="submit" disabled={loading}>Search</Button>
        </Flex>
      </form>
      {slots.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool</TableHead><TableHead>Type</TableHead>
              <TableHead>Booking No.</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted" onClick={() => navigateToBooking(s)}>
                <TableCell>{s.pool}</TableCell>
                <TableCell>{s.type}</TableCell>
                <TableCell className={s.status === 'BOOKED' ? 'text-red-500' : 'text-yellow-600'}>{s.bookingNo}</TableCell>
                <TableCell>{s.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {slots.length === 0 && searched && !loading && (
        <Text size="small" color="muted" className="text-center py-8">No slots found for {searched}</Text>
      )}
      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
```

- [ ] Delete `src/pages/SlotsPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract SlotsPage logic into SlotsPage.logic.ts`

---

## Task 3: BookingsPage

**Files:**
- Create: `src/pages/BookingsPage/BookingsPage.logic.ts`
- Create: `src/pages/BookingsPage/index.tsx`
- Delete: `src/pages/BookingsPage.tsx`

- [ ] Create `src/pages/BookingsPage/BookingsPage.logic.ts`:

```ts
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BookingRow {
  id: string; bookingNo: string; customer: string;
  total: number; reserveFee: number; status: string; bookingDate: string;
}

export function useBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');

  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });
  const dateValue = useWatch({ control: form.control, name: 'date' });

  const onSubmit = form.handleSubmit(async ({ date }) => {
    setLoading(true);
    setSearched(date);
    const snap = await getDocs(query(collection(firestore, 'bookings'), where('bookingDate', '==', date)));
    setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingRow)));
    setLoading(false);
  });

  const handlePrint = () => {
    const pdf = new jsPDF();
    pdf.text(`Bookings for ${searched}`, 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [['Booking No', 'Customer', 'Total', 'Reserve Fee', 'Status']],
      body: bookings.map((b) => [
        b.bookingNo, b.customer,
        `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status,
      ]),
    });
    pdf.save(`bookings-${searched}.pdf`);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  const navigateToBooking = (id: string) => navigate(`/booking/${id}`);

  return { form, dateValue, bookings, loading, searched, onSubmit, handlePrint, statusVariant, navigateToBooking };
}
```

- [ ] Create `src/pages/BookingsPage/index.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { useBookingsPage } from './BookingsPage.logic';

export function BookingsPage() {
  const { form, dateValue, bookings, loading, searched, onSubmit, handlePrint, statusVariant, navigateToBooking } = useBookingsPage();

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
          <Button type="submit" disabled={loading}>Search</Button>
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
              <TableRow key={b.id} className="cursor-pointer hover:bg-muted" onClick={() => navigateToBooking(b.id)}>
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
      {bookings.length === 0 && searched && !loading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found for {searched}</Text>
      )}
    </Stack>
  );
}
```

- [ ] Delete `src/pages/BookingsPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract BookingsPage logic into BookingsPage.logic.ts`

---

## Task 4: BookingsSearchPage

**Files:**
- Create: `src/pages/BookingsSearchPage/BookingsSearchPage.logic.ts`
- Create: `src/pages/BookingsSearchPage/index.tsx`
- Delete: `src/pages/BookingsSearchPage.tsx`

- [ ] Create `src/pages/BookingsSearchPage/BookingsSearchPage.logic.ts`:

```ts
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { searchSchema, type SearchInput } from '@/lib/form-schemas';

export interface BookingRow {
  id: string; bookingNo: string; customer: string;
  total: number; status: string; bookingDate: string;
}

export function useBookingsSearchPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookingRow | null>(null);

  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  });

  const onSubmit = form.handleSubmit(async ({ query: q }) => {
    setLoading(true);
    setSearched(true);
    const byName = await getDocs(
      query(collection(firestore, 'bookings'), where('customer', '>=', q), where('customer', '<=', q + ''))
    );
    const byNo = await getDocs(
      query(collection(firestore, 'bookings'), where('bookingNo', '==', q))
    );
    const combined = new Map<string, BookingRow>();
    [...byName.docs, ...byNo.docs].forEach((d) =>
      combined.set(d.id, { id: d.id, ...d.data() } as BookingRow)
    );
    setBookings([...combined.values()]);
    setLoading(false);
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(firestore, 'bookings', deleteTarget.id));
    const slotsSnap = await getDocs(
      query(collection(firestore, 'slots'), where('bookingNo', '==', deleteTarget.bookingNo))
    );
    await Promise.all(slotsSnap.docs.map((d) => deleteDoc(d.ref)));
    const paymentsSnap = await getDocs(
      query(collection(firestore, 'payments'), where('bookingNo', '==', deleteTarget.bookingNo))
    );
    await Promise.all(paymentsSnap.docs.map((d) => deleteDoc(d.ref)));
    setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  const navigateToBooking = (id: string) => navigate(`/booking/${id}`);

  return {
    form, bookings, loading, searched, deleteTarget,
    setDeleteTarget, onSubmit, handleDelete, statusVariant, navigateToBooking,
  };
}
```

- [ ] Create `src/pages/BookingsSearchPage/index.tsx`:

```tsx
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
import { useBookingsSearchPage } from './BookingsSearchPage.logic';

export function BookingsSearchPage() {
  const {
    form, bookings, loading, searched, deleteTarget,
    setDeleteTarget, onSubmit, handleDelete, statusVariant, navigateToBooking,
  } = useBookingsSearchPage();

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
          <Button type="submit" disabled={loading}>Search</Button>
        </Flex>
      </form>
      {bookings.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking No</TableHead><TableHead>Customer</TableHead>
              <TableHead>Date</TableHead><TableHead>Total</TableHead>
              <TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="cursor-pointer text-primary hover:underline" onClick={() => navigateToBooking(b.id)}>
                  {b.bookingNo}
                </TableCell>
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
      {bookings.length === 0 && searched && !loading && (
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}
```

- [ ] Delete `src/pages/BookingsSearchPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract BookingsSearchPage logic into BookingsSearchPage.logic.ts`

---

## Task 5: PaymentsPage

**Files:**
- Create: `src/pages/PaymentsPage/PaymentsPage.logic.ts`
- Create: `src/pages/PaymentsPage/index.tsx`
- Delete: `src/pages/PaymentsPage.tsx`

- [ ] Create `src/pages/PaymentsPage/PaymentsPage.logic.ts`:

```ts
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PaymentRow {
  id: string; type: string; date: string;
  referenceNo: string; amount: number; bookingNo: string;
}

export function usePaymentsPage() {
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

  return { form, dateValue, payments, loading, error, searched, grandTotal, grouped, onSubmit, handlePrint };
}
```

- [ ] Create `src/pages/PaymentsPage/index.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { usePaymentsPage } from './PaymentsPage.logic';

export function PaymentsPage() {
  const { form, dateValue, payments, loading, error, searched, grandTotal, grouped, onSubmit, handlePrint } = usePaymentsPage();

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
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    </Stack>
  );
}
```

- [ ] Delete `src/pages/PaymentsPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract PaymentsPage logic into PaymentsPage.logic.ts`

---

## Task 6: CalendarPage

**Files:**
- Create: `src/pages/CalendarPage/CalendarPage.logic.ts`
- Create: `src/pages/CalendarPage/index.tsx`
- Delete: `src/pages/CalendarPage.tsx`

Note: add error handling to the Firestore fetch (was missing before).

- [ ] Create `src/pages/CalendarPage/CalendarPage.logic.ts`:

```ts
import { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { type EventInput } from '@fullcalendar/core';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export function useCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const start = currentDate.startOf('month').format('YYYY-MM-DD');
    const end = currentDate.endOf('month').format('YYYY-MM-DD');

    async function fetchSlots() {
      try {
        const snap = await getDocs(
          query(collection(firestore, 'slots'), where('date', '>=', start), where('date', '<=', end))
        );
        const counts = snap.docs.reduce<Record<string, { day: number; night: number }>>((acc, d) => {
          const data = d.data() as { date?: string; type?: string };
          if (!data.date) return acc;
          if (!acc[data.date]) acc[data.date] = { day: 0, night: 0 };
          if (data.type === 'NIGHT') acc[data.date].night += 1;
          else acc[data.date].day += 1;
          return acc;
        }, {});
        setEvents(
          Object.entries(counts).map(([date, count]) => ({
            id: date,
            title: `D:${count.day} N:${count.night}`,
            start: date,
            allDay: true,
            className: count.day + count.night > 0 ? 'bg-secondary text-secondary-foreground' : '',
          }))
        );
      } catch {
        // silently ignore — calendar just shows no events on error
      }
    }

    fetchSlots();
  }, [currentDate]);

  const handleDatesSet = (arg: { start: Date }) => setCurrentDate(dayjs(arg.start));
  const handleDateClick = (arg: { dateStr: string }) => setSelectedDate(arg.dateStr);
  const handleEventClick = (arg: { event: { startStr: string } }) => setSelectedDate(arg.event.startStr);

  return { currentDate, setCurrentDate, events, selectedDate, handleDatesSet, handleDateClick, handleEventClick };
}
```

- [ ] Create `src/pages/CalendarPage/index.tsx`:

```tsx
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CurrentMonth } from '@/components/CurrentMonth';
import { CalendarMarker } from '@/components/CalendarMarker';
import { Box, Stack, Text } from '@/components/ui/primitives';
import '@fullcalendar/common/main.css';
import { useCalendarPage } from './CalendarPage.logic';

export function CalendarPage() {
  const { currentDate, setCurrentDate, events, selectedDate, handleDatesSet, handleDateClick, handleEventClick } = useCalendarPage();

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
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }}
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
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

- [ ] Delete `src/pages/CalendarPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract CalendarPage logic into CalendarPage.logic.ts`

---

## Task 7: PoolSlotPage

**Files:**
- Create: `src/pages/PoolSlotPage/PoolSlotPage.logic.ts`
- Create: `src/pages/PoolSlotPage/index.tsx`
- Delete: `src/pages/PoolSlotPage.tsx`

- [ ] Create `src/pages/PoolSlotPage/PoolSlotPage.logic.ts`:

```ts
import { useState, useEffect, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';

interface SlotRecord { pool: string; type: string; date: string; status: string; bookingNo: string; }

export function usePoolSlotPage() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [slots, setSlots] = useState<SlotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pools = useAppStore((s) => s.pools);

  useEffect(() => {
    let cancelled = false;
    async function fetchSlots() {
      setLoading(true);
      setSlots([]);
      setError('');
      const startDate = currentDate.startOf('month').format('YYYY-MM-DD');
      const endDate = currentDate.endOf('month').format('YYYY-MM-DD');
      try {
        const snap = await getDocs(
          query(collection(firestore, 'slots'), where('date', '>=', startDate), where('date', '<=', endDate))
        );
        if (!cancelled) setSlots(snap.docs.map((d) => d.data() as SlotRecord));
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSlots();
    return () => { cancelled = true; };
  }, [currentDate]);

  const slotMap = useMemo(() => {
    const m = new Map<string, string>();
    slots.forEach((s) => m.set(`${s.pool}|${s.type}|${s.date}`, s.status));
    return m;
  }, [slots]);

  const getSlotStatus = (poolName: string, type: 'DAY' | 'NIGHT', date: string) =>
    slotMap.get(`${poolName}|${type}|${date}`) ?? null;

  const days = useMemo(() =>
    Array.from({ length: currentDate.daysInMonth() }, (_, i) =>
      currentDate.startOf('month').add(i, 'day').format('YYYY-MM-DD')
    ),
  [currentDate]);

  return { currentDate, setCurrentDate, pools, loading, error, days, getSlotStatus };
}
```

- [ ] Create `src/pages/PoolSlotPage/index.tsx`:

```tsx
import dayjs from 'dayjs';
import { CurrentMonth } from '@/components/CurrentMonth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { usePoolSlotPage } from './PoolSlotPage.logic';

export function PoolSlotPage() {
  const { currentDate, setCurrentDate, pools, loading, error, days, getSlotStatus } = usePoolSlotPage();

  return (
    <Stack gap="s0">
      <Flex align="center" justify="between" wrap="wrap" gap="s-1">
        <Text as="h1" size="xxl" weight="bold">Slots per Pool</Text>
        <Flex align="center" className="gap-3">
          <CurrentMonth value={currentDate} onChange={setCurrentDate} />
          {loading && <Text as="span" size="small" color="muted">Loading...</Text>}
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
                <th key={d} className="border px-1 py-1 bg-muted min-w-[28px]">{dayjs(d).date()}</th>
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
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    </Stack>
  );
}
```

- [ ] Delete `src/pages/PoolSlotPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract PoolSlotPage logic into PoolSlotPage.logic.ts`

---

## Task 8: ReservePage

**Files:**
- Create: `src/pages/ReservePage/ReservePage.logic.ts`
- Create: `src/pages/ReservePage/index.tsx`
- Delete: `src/pages/ReservePage.tsx`

- [ ] Create `src/pages/ReservePage/ReservePage.logic.ts`:

```ts
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { reserveSchema, type ReserveInput, type SlotInput } from '@/lib/form-schemas';

export function useReservePage() {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const [submitError, setSubmitError] = useState('');

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

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError('');
    // eslint-disable-next-line react-hooks/purity
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
          })
        )
      );
      navigate(`/booking/${bookingRef.id}`);
    } catch (e: unknown) {
      setSubmitError((e as Error).message);
    }
  });

  return { form, pools, selectedSlots, bookingDateValue, subTotal, submitError, toggleSlot, isSelected, onSubmit };
}
```

- [ ] Create `src/pages/ReservePage/index.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { DatePicker } from '@/components/DatePicker';
import { useReservePage } from './ReservePage.logic';

export function ReservePage() {
  const { form, pools, selectedSlots, bookingDateValue, subTotal, submitError, toggleSlot, isSelected, onSubmit } = useReservePage();

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
                        <input type="checkbox" checked={isSelected(pool.pool, 'DAY')} onChange={() => toggleSlot(pool.pool, 'DAY', pool.dayRate)} className="cursor-pointer" />
                        <Text as="span" size="small">Day ₱{pool.dayRate.toLocaleString()}</Text>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isSelected(pool.pool, 'NIGHT')} onChange={() => toggleSlot(pool.pool, 'NIGHT', pool.nightRate)} className="cursor-pointer" />
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
                          <Badge key={`${s.pool}-${s.type}`} variant="secondary">{s.pool} {s.type}</Badge>
                        ))}
                      </Flex>
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <Text size="large" weight="bold" className="text-green-700">Total: ₱{subTotal.toLocaleString()}</Text>
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
            {submitError && <Alert variant="destructive"><AlertDescription>{submitError}</AlertDescription></Alert>}
            <Button type="submit" disabled={form.formState.isSubmitting || selectedSlots.length === 0} className="w-full">
              {form.formState.isSubmitting ? 'Reserving...' : 'Complete Reservation'}
            </Button>
          </div>
        </div>
      </Stack>
    </form>
  );
}
```

- [ ] Delete `src/pages/ReservePage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract ReservePage logic into ReservePage.logic.ts`

---

## Task 9: BookingDetailPage

**Files:**
- Create: `src/pages/BookingDetailPage/BookingDetailPage.logic.ts`
- Create: `src/pages/BookingDetailPage/index.tsx`
- Delete: `src/pages/BookingDetailPage.tsx`

Note: Fix the stale `loadBooking` reference bug — handlers called `loadBooking()` which was defined inside `useEffect` and out of scope. Replace with a `refreshKey` counter pattern.

- [ ] Create `src/pages/BookingDetailPage/BookingDetailPage.logic.ts`:

```ts
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BookingData {
  bookingNo: string; bookingDate: string; customer: string;
  email: string; phone: string;
  slots: { pool: string; type: string; rate: number }[];
  subTotal: number; discount: number; total: number;
  reserveFee: number; status: string; createdBy: string;
  discounts?: { careOfBy: string; others: string; amount: number }[];
  additionals?: { description: string; amount: number }[];
}

export interface PaymentRecord {
  id: string; type: string; date: string; referenceNo: string; amount: number;
}

export const STATUS_OPTIONS = ['PENDING', 'PENCIL', 'BOOKED', 'CANCELLED'];

export function useBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showAdditional, setShowAdditional] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!id) return;
    async function loadBooking() {
      const snap = await getDoc(doc(firestore, 'bookings', id!));
      if (snap.exists()) setBooking(snap.data() as BookingData);
      const paySnap = await getDocs(
        query(collection(firestore, 'payments'), where('bookingDocId', '==', id))
      );
      setPayments(paySnap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord)));
    }
    loadBooking();
  }, [id, refreshKey]);

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (booking?.total ?? 0) - totalPayments;

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await updateDoc(doc(firestore, 'bookings', id), { status });
    setBooking((b) => (b ? { ...b, status } : b));
  };

  const handleAddPayment = async (payment: { type: string; date: string; referenceNo: string; amount: number }) => {
    if (!id || !booking) return;
    await addDoc(collection(firestore, 'payments'), {
      ...payment,
      bookingNo: booking.bookingNo,
      bookingDocId: id,
      createdAt: Timestamp.now(),
    });
    setShowPayment(false);
    refresh();
  };

  const handleAddDiscount = async (discount: { careOfBy: string; others: string; amount: number }) => {
    if (!id || !booking) return;
    const newDiscounts = [...(booking.discounts ?? []), discount];
    const newTotal =
      booking.subTotal - newDiscounts.reduce((s, d) => s + d.amount, 0) +
      (booking.additionals ?? []).reduce((s, a) => s + a.amount, 0);
    await updateDoc(doc(firestore, 'bookings', id), {
      discounts: newDiscounts,
      discount: newDiscounts.reduce((s, d) => s + d.amount, 0),
      total: newTotal,
    });
    setShowDiscount(false);
    refresh();
  };

  const handleAddAdditional = async (item: { description: string; amount: number }) => {
    if (!id || !booking) return;
    const newAdditionals = [...(booking.additionals ?? []), item];
    const newTotal =
      booking.subTotal - (booking.discount ?? 0) +
      newAdditionals.reduce((s, a) => s + a.amount, 0);
    await updateDoc(doc(firestore, 'bookings', id), {
      additionals: newAdditionals,
      total: newTotal,
    });
    setShowAdditional(false);
    refresh();
  };

  const handlePrint = () => {
    if (!booking) return;
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

  return {
    booking, payments, totalPayments, balance,
    showAdditional, setShowAdditional,
    showDiscount, setShowDiscount,
    showPayment, setShowPayment,
    handleStatusChange, handleAddPayment, handleAddDiscount, handleAddAdditional, handlePrint,
  };
}
```

- [ ] Create `src/pages/BookingDetailPage/index.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdditionalAdd } from '@/components/AdditionalAdd';
import { DiscountAdd } from '@/components/DiscountAdd';
import { PaymentAdd } from '@/components/PaymentAdd';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';
import { STATUS_OPTIONS, useBookingDetailPage } from './BookingDetailPage.logic';

export function BookingDetailPage() {
  const {
    booking, payments, totalPayments, balance,
    showAdditional, setShowAdditional,
    showDiscount, setShowDiscount,
    showPayment, setShowPayment,
    handleStatusChange, handleAddPayment, handleAddDiscount, handleAddAdditional, handlePrint,
  } = useBookingDetailPage();

  if (!booking) return <Box className="p-8 text-center text-muted-foreground">Loading...</Box>;

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
                  <TableHead>Type</TableHead><TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead><TableHead>Amount</TableHead>
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

      <AdditionalAdd open={showAdditional} onClose={() => setShowAdditional(false)} onSave={handleAddAdditional} />
      <DiscountAdd open={showDiscount} onClose={() => setShowDiscount(false)} onSave={handleAddDiscount} />
      <PaymentAdd open={showPayment} onClose={() => setShowPayment(false)} onSave={handleAddPayment} />
    </Stack>
  );
}
```

- [ ] Delete `src/pages/BookingDetailPage.tsx`
- [ ] Run `npx tsc --noEmit` — expect no errors
- [ ] Commit: `refactor: extract BookingDetailPage logic into BookingDetailPage.logic.ts`

---

## Task 10: Final lint + push

- [ ] Run `npx eslint .` — expect zero errors
- [ ] Run `npx tsc --noEmit` — expect zero errors
- [ ] Commit any remaining changes
- [ ] `git push`

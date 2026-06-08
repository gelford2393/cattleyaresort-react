# React Hook Form + Zod + Primitives + Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add React Hook Form + Zod validation to every form, a CVA-powered layout primitive set (`Box`/`Stack`/`Flex`/`Text`), a design-token system (modular spacing + Cattleya brand colors), and a `FormError` component — then refactor the whole app to use them.

**Architecture:** Foundational layers first (tokens → primitives → schemas/FormError), then form-by-form RHF refactors, then a mechanical `div → primitive` sweep of display-only files. Each task ends with `npx tsc --noEmit` + `npm run build` both green and a commit. No unit-test harness exists; types + build are the verification gate.

**Tech Stack:** React 19 · Vite · TypeScript 6 · react-hook-form · zod · @hookform/resolvers · class-variance-authority · Tailwind v4 · shadcn/ui · Firebase 10

**Working directory:** `C:\Users\JhaiFord\Documents\proj\cattleyaresort-react`

---

## File Structure

**New files:**
- `src/styles/design-tokens.css` — CSS custom properties (spacing + brand colors)
- `src/lib/tokens.ts` — TypeScript token type unions
- `src/components/ui/primitives.tsx` — `Box`, `Stack`, `Flex`, `Text`
- `src/components/FormError.tsx` — inline field error text
- `src/lib/form-schemas.ts` — all Zod schemas + inferred types

**Modified — forms (RHF):** `LoginPage`, `ReservePage`, `AdditionalAdd`, `DiscountAdd`, `PaymentAdd`, `BookingsPage`, `BookingsSearchPage`, `SlotsPage`, `PaymentsPage`

**Modified — primitive sweep only:** `index.css`, `AuthLayout`, `MainLayout`, `BookingDetailPage`, `CalendarPage`, `CalendarViewPage`, `PoolSlotPage`, `ReportsPage`, `CalendarMarker`, `CurrentMonth`, `PinInput`

---

### Task 1: Dependencies + Design Tokens + tokens.ts

**Files:**
- Create: `src/styles/design-tokens.css`
- Modify: `src/index.css`
- Create: `src/lib/tokens.ts`

- [ ] **Step 1: Install RHF + Zod**

```bash
npm install react-hook-form zod @hookform/resolvers
```
Expected: three packages added, no peer warnings that fail install.

- [ ] **Step 2: Create `src/styles/design-tokens.css`**

```css
:root {
  /* Modular spacing scale */
  --s2: 2rem;     /* 32px */
  --s1: 1.5rem;   /* 24px */
  --s0: 1rem;     /* 16px (base) */
  --s-1: 0.5rem;  /* 8px  */
  --s-2: 0.25rem; /* 4px  */

  /* Cattleya brand colors (from react-cattleya-new-website) */
  --brand-primary: #509b48;
  --brand-accent: #a4d473;
  --brand-highlight: #feb234;
  --brand-surface: #383838;
  --brand-paper: #f8efe8;
  --brand-danger: #ef4444;
}
```

- [ ] **Step 3: Modify `src/index.css` — add import on line 2 (after the tailwind import)**

Change the top of the file from:
```css
@import "tailwindcss";
@import "tw-animate-css";
```
to:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "./styles/design-tokens.css";
```

- [ ] **Step 4: Modify `src/index.css` — register brand colors in `@theme inline`**

Inside the existing `@theme inline { ... }` block, immediately before its closing `}` (after the `--color-sidebar-ring` line), add:
```css
  --color-brand-primary: var(--brand-primary);
  --color-brand-accent: var(--brand-accent);
  --color-brand-highlight: var(--brand-highlight);
  --color-brand-surface: var(--brand-surface);
  --color-brand-paper: var(--brand-paper);
  --color-brand-danger: var(--brand-danger);
```
> Spacing tokens are NOT registered in `@theme` — primitives reference them via arbitrary
> values (`gap-[var(--s0)]`) to avoid Tailwind v4 negative-name parsing issues.

- [ ] **Step 5: Modify `src/index.css` — re-point shadcn primary to brand green**

In the `:root { ... }` block, change these three lines:
```css
  --primary: oklch(0.62 0.17 143);
```
→
```css
  --primary: #509b48;
```
and
```css
  --ring: oklch(0.62 0.17 143);
```
→
```css
  --ring: #509b48;
```
and
```css
  --sidebar-primary: oklch(0.62 0.17 143);
```
→
```css
  --sidebar-primary: #509b48;
```
(Leave the `.dark` block as-is.)

- [ ] **Step 6: Create `src/lib/tokens.ts`**

```ts
// Design-token type unions. Values live in src/styles/design-tokens.css.
export type SpacingToken = 's2' | 's1' | 's0' | 's-1' | 's-2';
export type TextSize = 'small' | 'default' | 'large' | 'xl' | 'xxl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextColor = 'default' | 'muted' | 'primary' | 'destructive';
```

- [ ] **Step 7: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed. If `npm run build` errors on a `gap-[var(--s-1)]`-style class, that is only used in Task 2; here just confirm the CSS import resolves and brand color utilities compile.

- [ ] **Step 8: Commit**

```bash
git add src/styles/design-tokens.css src/index.css src/lib/tokens.ts package.json package-lock.json
git commit -m "feat: add design tokens, brand colors, and install RHF + Zod"
```

---

### Task 2: Layout Primitives (`primitives.tsx`)

**Files:**
- Create: `src/components/ui/primitives.tsx`

- [ ] **Step 1: Create `src/components/ui/primitives.tsx`**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const GAP = {
  s2: 'gap-[var(--s2)]',
  s1: 'gap-[var(--s1)]',
  s0: 'gap-[var(--s0)]',
  's-1': 'gap-[var(--s-1)]',
  's-2': 'gap-[var(--s-2)]',
} as const;

const PAD = {
  s2: 'p-[var(--s2)]',
  s1: 'p-[var(--s1)]',
  s0: 'p-[var(--s0)]',
  's-1': 'p-[var(--s-1)]',
  's-2': 'p-[var(--s-2)]',
} as const;

const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;

const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

/* ---------- Box ---------- */
const boxVariants = cva('', {
  variants: { p: PAD },
});
export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boxVariants> {}
export function Box({ className, p, ...props }: BoxProps) {
  return <div className={cn(boxVariants({ p }), className)} {...props} />;
}

/* ---------- Stack (vertical) ---------- */
const stackVariants = cva('flex flex-col', {
  variants: { gap: GAP, align: ALIGN, justify: JUSTIFY },
});
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}
export function Stack({ className, gap, align, justify, ...props }: StackProps) {
  return <div className={cn(stackVariants({ gap, align, justify }), className)} {...props} />;
}

/* ---------- Flex (horizontal) ---------- */
const flexVariants = cva('flex', {
  variants: {
    gap: GAP,
    align: ALIGN,
    justify: JUSTIFY,
    wrap: { wrap: 'flex-wrap', nowrap: 'flex-nowrap' },
  },
});
export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {}
export function Flex({ className, gap, align, justify, wrap, ...props }: FlexProps) {
  return <div className={cn(flexVariants({ gap, align, justify, wrap }), className)} {...props} />;
}

/* ---------- Text ---------- */
const textVariants = cva('', {
  variants: {
    size: {
      small: 'text-sm',
      default: 'text-base',
      large: 'text-lg',
      xl: 'text-xl',
      xxl: 'text-2xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: { size: 'default', weight: 'normal', color: 'default' },
});
type TextElement = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}
export function Text({ className, size, weight, color, as = 'p', ...props }: TextProps) {
  const Comp = as;
  return <Comp className={cn(textVariants({ size, weight, color }), className)} {...props} />;
}
```

- [ ] **Step 2: Smoke-test the primitives compile and the arbitrary gap classes build**

Temporarily add to `src/App.tsx` (top of the returned tree is not possible — instead just rely on the build). Run:
```bash
npx tsc --noEmit
npm run build
```
Expected: both pass. The `gap-[var(--s-1)]` arbitrary values compile in Tailwind v4.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/primitives.tsx
git commit -m "feat: add Box, Stack, Flex, Text layout primitives"
```

---

### Task 3: FormError + Zod Schemas

**Files:**
- Create: `src/components/FormError.tsx`
- Create: `src/lib/form-schemas.ts`

- [ ] **Step 1: Create `src/components/FormError.tsx`**

```tsx
import { Text } from '@/components/ui/primitives';

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text as="span" size="small" color="destructive" className="mt-1">
      {message}
    </Text>
  );
}
```

- [ ] **Step 2: Create `src/lib/form-schemas.ts`**

```ts
import { z } from 'zod';

export const CHARGE_OPTIONS = [
  'Extra Head', 'Catering', 'Ice', 'Mattress', 'Sound System', 'Water', 'Others',
] as const;
export const CARE_OF_OPTIONS = ['Mr. Benito', 'Mrs. Benito', 'Others'] as const;
export const PAYMENT_TYPES = ['Cash', 'Bank Deposit', 'Bank Transfer', 'WTax', 'Refund'] as const;

/* ---------- Login ---------- */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ---------- Reserve ---------- */
export const slotSchema = z.object({
  pool: z.string(),
  type: z.enum(['DAY', 'NIGHT']),
  rate: z.number(),
});
export type SlotInput = z.infer<typeof slotSchema>;

export const reserveSchema = z.object({
  customer: z.string().min(1, 'Customer name is required'),
  email: z.literal('').or(z.string().email('Enter a valid email')),
  phone: z.string(),
  bookingDate: z.string().min(1, 'Booking date is required'),
  slots: z.array(slotSchema).min(1, 'Select at least one slot'),
});
export type ReserveInput = z.infer<typeof reserveSchema>;

/* ---------- Additional charge ---------- */
export const additionalSchema = z
  .object({
    description: z.enum(CHARGE_OPTIONS, { message: 'Select a charge type' }),
    customDesc: z.string().optional(),
    amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  })
  .superRefine((val, ctx) => {
    if (val.description === 'Others' && (!val.customDesc || val.customDesc.trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customDesc'], message: 'Description is required' });
    }
  });
export type AdditionalInput = z.infer<typeof additionalSchema>;

/* ---------- Discount ---------- */
export const discountSchema = z
  .object({
    careOfBy: z.enum(CARE_OF_OPTIONS, { message: 'Select who it is care of' }),
    others: z.string().optional(),
    amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  })
  .superRefine((val, ctx) => {
    if (val.careOfBy === 'Others' && (!val.others || val.others.trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['others'], message: 'Reason is required' });
    }
  });
export type DiscountInput = z.infer<typeof discountSchema>;

/* ---------- Payment ---------- */
export const paymentSchema = z.object({
  type: z.enum(PAYMENT_TYPES, { message: 'Select a payment type' }),
  date: z.string().optional(),
  referenceNo: z.string().optional(),
  amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/* ---------- Filters ---------- */
export const dateFilterSchema = z.object({
  date: z.string().min(1, 'Select a date'),
});
export type DateFilterInput = z.infer<typeof dateFilterSchema>;

export const searchSchema = z.object({
  query: z.string().min(1, 'Enter a search term'),
});
export type SearchInput = z.infer<typeof searchSchema>;
```

> **Zod version note:** the `z.enum(ARR, { message })` and `z.coerce.number({ message })`
> param forms above are Zod 4 syntax (current in 2026). If `npm install zod` resolved a
> Zod 3.x line and the build errors on those option objects, switch each to the v3 form
> `z.enum(ARR, { errorMap: () => ({ message: '...' }) })` and
> `z.coerce.number({ invalid_type_error: '...' })`. Verify which major version installed
> with `npm ls zod` before assuming.

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/FormError.tsx src/lib/form-schemas.ts
git commit -m "feat: add FormError component and Zod form schemas"
```

---

### Task 4: Refactor LoginPage (RHF + primitives)

**Files:**
- Modify: `src/pages/LoginPage.tsx` (full replace)

- [ ] **Step 1: Replace `src/pages/LoginPage.tsx`**

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { auth } from '@/lib/firebase';
import { loginSchema, type LoginInput } from '@/lib/form-schemas';

export function LoginPage() {
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
      setSubmitError((e as Error).message);
    }
  });

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

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "refactor: LoginPage with RHF + Zod + primitives"
```

---

### Task 5: Refactor ReservePage (RHF + primitives)

**Files:**
- Modify: `src/pages/ReservePage.tsx` (full replace)

**Context:** Pool selection stays in local state (it is a grid interaction, not a text field), but the selected slots are pushed into the RHF `slots` field via `form.setValue` so the schema's `.min(1)` validates them. Customer/email/phone/bookingDate become registered fields.

- [ ] **Step 1: Replace `src/pages/ReservePage.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ReservePage.tsx
git commit -m "refactor: ReservePage with RHF + Zod + primitives"
```

---

### Task 6: Refactor Dialog Forms (AdditionalAdd, DiscountAdd, PaymentAdd)

**Files:**
- Modify: `src/components/AdditionalAdd.tsx` (full replace)
- Modify: `src/components/DiscountAdd.tsx` (full replace)
- Modify: `src/components/PaymentAdd.tsx` (full replace)

**Context:** shadcn `Select` and the imask date input are uncontrolled → wrap each with RHF
`Controller`. `onSave` keeps the same shape consumers expect; values are now schema-parsed
(numbers coerced). `form.reset()` runs after a successful save and when the dialog closes.

- [ ] **Step 1: Replace `src/components/AdditionalAdd.tsx`**

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { additionalSchema, type AdditionalInput, CHARGE_OPTIONS } from '@/lib/form-schemas';

interface AdditionalItem { description: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (item: AdditionalItem) => void; }

export function AdditionalAdd({ open, onClose, onSave }: Props) {
  const form = useForm<AdditionalInput>({
    resolver: zodResolver(additionalSchema),
    defaultValues: { description: undefined, customDesc: '', amount: undefined },
  });
  const description = form.watch('description');

  const close = () => { form.reset(); onClose(); };

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      description: values.description === 'Others' ? (values.customDesc ?? '') : values.description,
      amount: values.amount,
    });
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Additional Charge</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label>Description</Label>
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select charge type" /></SelectTrigger>
                    <SelectContent>
                      {CHARGE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={form.formState.errors.description?.message} />
            </Stack>
            {description === 'Others' && (
              <Stack gap="s-2">
                <Label>Custom Description</Label>
                <Input {...form.register('customDesc')} />
                <FormError message={form.formState.errors.customDesc?.message} />
              </Stack>
            )}
            <Stack gap="s-2">
              <Label>Amount</Label>
              <Input type="number" {...form.register('amount')} />
              <FormError message={form.formState.errors.amount?.message} />
            </Stack>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Close</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Replace `src/components/DiscountAdd.tsx`**

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { discountSchema, type DiscountInput, CARE_OF_OPTIONS } from '@/lib/form-schemas';

interface Discount { careOfBy: string; others: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (d: Discount) => void; }

export function DiscountAdd({ open, onClose, onSave }: Props) {
  const form = useForm<DiscountInput>({
    resolver: zodResolver(discountSchema),
    defaultValues: { careOfBy: undefined, others: '', amount: undefined },
  });
  const careOfBy = form.watch('careOfBy');

  const close = () => { form.reset(); onClose(); };

  const onSubmit = form.handleSubmit((values) => {
    onSave({ careOfBy: values.careOfBy, others: values.others ?? '', amount: values.amount });
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Discount</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label>Care of By</Label>
              <Controller
                control={form.control}
                name="careOfBy"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CARE_OF_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={form.formState.errors.careOfBy?.message} />
            </Stack>
            {careOfBy === 'Others' && (
              <Stack gap="s-2">
                <Label>Reason</Label>
                <Input {...form.register('others')} />
                <FormError message={form.formState.errors.others?.message} />
              </Stack>
            )}
            <Stack gap="s-2">
              <Label>Amount</Label>
              <Input type="number" {...form.register('amount')} />
              <FormError message={form.formState.errors.amount?.message} />
            </Stack>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Close</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Replace `src/components/PaymentAdd.tsx`**

```tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IMaskInput } from 'react-imask';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { paymentSchema, type PaymentInput, PAYMENT_TYPES } from '@/lib/form-schemas';

interface Payment { type: string; date: string; referenceNo: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (p: Payment) => void; }

const DateMaskInput = React.forwardRef<
  HTMLInputElement,
  { value?: string; onChange: (value: string) => void }
>(({ value, onChange }, ref) => (
  <IMaskInput
    value={value}
    mask={'0000-00-00 00:00:00' as unknown as RegExp}
    inputRef={ref}
    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
    onAccept={(v: string) => onChange(v)}
  />
));
DateMaskInput.displayName = 'DateMaskInput';

export function PaymentAdd({ open, onClose, onSave }: Props) {
  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { type: undefined, date: '', referenceNo: '', amount: undefined },
  });
  const type = form.watch('type');

  const close = () => { form.reset(); onClose(); };

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      type: values.type,
      date: values.date ?? '',
      referenceNo: values.referenceNo ?? '',
      amount: values.amount,
    });
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label>Payment Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={form.formState.errors.type?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>{type === 'Bank Deposit' ? 'Deposit Date (YYYY-MM-DD HH:MM:SS)' : 'Date'}</Label>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) =>
                  type === 'Bank Deposit'
                    ? <DateMaskInput value={field.value} onChange={field.onChange} />
                    : <Input value={field.value ?? ''} onChange={field.onChange} />
                }
              />
              <FormError message={form.formState.errors.date?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Reference No.</Label>
              <Input {...form.register('referenceNo')} />
              <FormError message={form.formState.errors.referenceNo?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Amount</Label>
              <Input type="number" {...form.register('amount')} />
              <FormError message={form.formState.errors.amount?.message} />
            </Stack>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Close</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both pass. If `defaultValues: { description: undefined, ... }` triggers a
DeepPartial type error, that is acceptable — RHF `DefaultValues<T>` allows `undefined`
leaves. If `amount: undefined` errors, change those three defaults to omit the key (use
`defaultValues: { customDesc: '' }` style) — do NOT cast.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdditionalAdd.tsx src/components/DiscountAdd.tsx src/components/PaymentAdd.tsx
git commit -m "refactor: dialog forms with RHF + Zod + Controller + primitives"
```

---

### Task 7: Refactor Filter Forms (Bookings, BookingsSearch, Slots, Payments)

**Files:**
- Modify: `src/pages/BookingsPage.tsx`
- Modify: `src/pages/BookingsSearchPage.tsx`
- Modify: `src/pages/SlotsPage.tsx`
- Modify: `src/pages/PaymentsPage.tsx`

**Context:** Each filter input becomes an RHF form. The "Search" button becomes the form
submit. `dateFilterSchema` requires a date; `searchSchema` requires a query — both show an
inline `FormError`. Firestore loading/errors keep their existing `Alert`. Below shows the
two representative refactors (date-filter and search); apply the same pattern to SlotsPage
and PaymentsPage using `dateFilterSchema`.

- [ ] **Step 1: Replace `src/pages/BookingsPage.tsx`**

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Stack, Flex, Text } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { dateFilterSchema, type DateFilterInput } from '@/lib/form-schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookingRow {
  id: string; bookingNo: string; customer: string;
  total: number; reserveFee: number; status: string; bookingDate: string;
}

export function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');
  const form = useForm<DateFilterInput>({
    resolver: zodResolver(dateFilterSchema),
    defaultValues: { date: '' },
  });

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
      body: bookings.map((b) => [b.bookingNo, b.customer, `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status]),
    });
    pdf.save(`bookings-${searched}.pdf`);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Bookings</Text>
      <form onSubmit={onSubmit}>
        <Flex gap="s-1" align="end">
          <Stack gap="s-2">
            <Label>Date</Label>
            <Input type="date" {...form.register('date')} className="w-44" />
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
      {bookings.length === 0 && searched && !loading && (
        <Text size="small" color="muted" className="text-center py-8">No bookings found for {searched}</Text>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Replace `src/pages/BookingsSearchPage.tsx`**

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/lib/firebase';
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

interface BookingRow { id: string; bookingNo: string; customer: string; total: number; status: string; bookingDate: string; }

export function BookingsSearchPage() {
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
    const byName = await getDocs(query(collection(firestore, 'bookings'), where('customer', '>=', q), where('customer', '<=', q + '')));
    const byNo = await getDocs(query(collection(firestore, 'bookings'), where('bookingNo', '==', q)));
    const combined = new Map<string, BookingRow>();
    [...byName.docs, ...byNo.docs].forEach((d) => combined.set(d.id, { id: d.id, ...d.data() } as BookingRow));
    setBookings([...combined.values()]);
    setLoading(false);
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(firestore, 'bookings', deleteTarget.id));
    const slotsSnap = await getDocs(query(collection(firestore, 'slots'), where('bookingNo', '==', deleteTarget.bookingNo)));
    await Promise.all(slotsSnap.docs.map((d) => deleteDoc(d.ref)));
    const paymentsSnap = await getDocs(query(collection(firestore, 'payments'), where('bookingNo', '==', deleteTarget.bookingNo)));
    await Promise.all(paymentsSnap.docs.map((d) => deleteDoc(d.ref)));
    setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'BOOKED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Search Bookings</Text>
      <form onSubmit={onSubmit}>
        <Flex gap="s-1" align="end">
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
> Note: this also fixes a pre-existing bug — the old name range query used `search + ''`
> (no upper bound). The corrected upper bound is `q + ''`.

- [ ] **Step 3: Refactor `src/pages/SlotsPage.tsx`**

Apply the BookingsPage date-filter pattern: replace the `date` `useState` + `loadSlots`
with an RHF form using `dateFilterSchema`, submit button `type="submit"`, inline
`FormError` under the date input, and swap the page's outer `<div className="space-y-4">`
for `<Stack gap="s0">`, the filter row `<div className="flex items-end gap-3">` for
`<Flex gap="s-1" align="end">`, label group `<div className="flex flex-col gap-1.5">` for
`<Stack gap="s-2">`, the `<h1 className="text-2xl font-bold">` for
`<Text as="h1" size="xxl" weight="bold">`, and any `<p className="text-sm text-muted-foreground ...">`
empty-state for `<Text size="small" color="muted" className="...">`. Preserve the existing
`error` Alert and the slots Table exactly. Keep the `bookingDocId` navigation fix intact.

- [ ] **Step 4: Refactor `src/pages/PaymentsPage.tsx`**

Apply the same `dateFilterSchema` date-filter pattern as SlotsPage. Replace the `date`
`useState` with the RHF form, submit on the Search button, inline `FormError`, and swap
outer/`Flex`/`Stack`/`Text` primitives as above. Preserve the grouped-totals Cards, the
payments Table, the PDF `handlePrint`, and the existing `error` Alert exactly. The PDF
uses the submitted date — store it in a `searched` state on submit (same as BookingsPage).

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/BookingsPage.tsx src/pages/BookingsSearchPage.tsx src/pages/SlotsPage.tsx src/pages/PaymentsPage.tsx
git commit -m "refactor: filter/search forms with RHF + Zod + primitives"
```

---

### Task 8: Primitive Sweep — Display-Only Files

**Files:**
- Modify: `src/layouts/AuthLayout.tsx`
- Modify: `src/layouts/MainLayout.tsx`
- Modify: `src/pages/BookingDetailPage.tsx`
- Modify: `src/pages/CalendarPage.tsx`
- Modify: `src/pages/CalendarViewPage.tsx`
- Modify: `src/pages/PoolSlotPage.tsx`
- Modify: `src/pages/ReportsPage.tsx`
- Modify: `src/components/CalendarMarker.tsx`
- Modify: `src/components/CurrentMonth.tsx`
- Modify: `src/components/PinInput.tsx`

**Context:** No forms here — purely mechanical `div → primitive` and inline-typography →
`Text` conversion. Do NOT touch `src/components/ui/*` (generated shadcn). When a `<div>`
has only layout classes, convert; when it has grid or unrelated utility classes, use `Box`
and keep the classes in `className`.

**Conversion rules:**

| Before | After |
|---|---|
| `<div className="flex flex-col gap-4">` / `space-y-4` | `<Stack gap="s0">` |
| `<div className="flex flex-col gap-1.5">` | `<Stack gap="s-2">` |
| `<div className="flex flex-col gap-6">` / `space-y-6` | `<Stack gap="s1">` |
| `<div className="flex items-center gap-2">` | `<Flex gap="s-1" align="center">` |
| `<div className="flex items-center justify-between">` | `<Flex align="center" justify="between">` |
| `<div className="flex ... flex-wrap ...">` | `<Flex wrap="wrap" ...>` |
| `<div className="grid ...">` | `<Box className="grid ...">` |
| other wrapper `<div className="...">` | `<Box className="...">` |
| `<h1 className="text-2xl font-bold">` | `<Text as="h1" size="xxl" weight="bold">` |
| `<h2 className="text-sm font-semibold ...">` | `<Text as="h2" size="small" weight="semibold" className="...">` |
| `<p className="text-sm text-muted-foreground ...">` | `<Text size="small" color="muted" className="...">` |
| `<span className="text-xs ...">` | `<Text as="span" size="small" className="...">` |

Spacing not on the token scale (e.g. `gap-3`, `gap-1`, `py-8`, `mb-2`) stays as a
`className` on the primitive — only convert `gap`/`space-y` values that map cleanly
(`gap-1.5`→`s-2`, `gap-2`→`s-1`, `gap-4`→`s0`, `gap-6`→`s1`, `gap-8`→`s2`). For off-scale
gaps, keep `<Flex>`/`<Stack>` without the `gap` prop and pass the original gap in
`className` (e.g. `<Flex align="end" className="gap-3">`).

- [ ] **Step 1: Convert `src/layouts/AuthLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Flex } from '@/components/ui/primitives';

export function AuthLayout() {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-muted">
      <Outlet />
    </Flex>
  );
}
```

- [ ] **Step 2: Convert `src/layouts/MainLayout.tsx`**

Convert the nav `<nav className="flex flex-col gap-1 p-2">` to
`<nav className="flex flex-col gap-1 p-2">` UNCHANGED (gap-1 is off-scale — leave as plain
nav). Convert the page wrapper `<main className="p-4 max-w-5xl mx-auto">` UNCHANGED (semantic
main). Convert any inner `<div>` menu rows only if they use convertible layout classes;
otherwise leave. The topbar `<header>` stays. This file is mostly semantic elements — only
convert genuine layout `<div>`s. If nothing converts cleanly, leave the file and note it.

- [ ] **Step 3: Convert remaining 8 files**

Apply the conversion-rules table to:
`BookingDetailPage.tsx`, `CalendarPage.tsx`, `CalendarViewPage.tsx`, `PoolSlotPage.tsx`,
`ReportsPage.tsx`, `CalendarMarker.tsx`, `CurrentMonth.tsx`, `PinInput.tsx`.

For `PoolSlotPage.tsx` the large `<table>` grid stays as a native table — only convert the
outer page wrapper, the header `<Flex>` row, and the legend `<div>`s. For `CalendarPage.tsx`
the 7-column `grid` wrapper becomes `<Box className="grid grid-cols-7 ...">`. For
`ReportsPage.tsx` only the outer `<div className="space-y-4">` → `<Stack gap="s0">` and the
`<h1>` → `<Text as="h1" size="xxl" weight="bold">`; the iframe is untouched.

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/layouts src/pages src/components/CalendarMarker.tsx src/components/CurrentMonth.tsx src/components/PinInput.tsx
git commit -m "refactor: convert display files to Box/Stack/Flex/Text primitives"
```

---

## Verification

After Task 8, run the full gate and a manual smoke check:

1. `npx tsc --noEmit` → zero errors
2. `npm run build` → success
3. `npm run dev`, then in the browser:
   - **Login**: submit empty → inline "Email is required" / "Password must be at least 6 characters". Bad email → "Enter a valid email". Wrong creds → red Alert with Firebase message.
   - **Reserve**: submit with no slots/customer/date → inline errors on each; select slots + fill required → submits, navigates to booking detail.
   - **Dialogs** (booking detail → Add Payment/Discount/Additional): submit empty → inline errors; "Others"/"Bank Deposit" conditional fields appear and validate; valid save closes dialog and resets.
   - **Filters** (Bookings, Slots, Payments): submit empty date → "Select a date"; valid date → query runs. Search Bookings: empty → "Enter a search term".
   - **Brand**: buttons and topbar render brand green `#509b48`.

---

## Notes / Risk Mitigations

- **Spacing arbitrary values**: primitives use `gap-[var(--s0)]` etc., sidestepping
  Tailwind v4 theme-key parsing for negative names. Brand colors ARE registered in
  `@theme` (no negative-name issue) so `text-brand-primary` utilities work.
- **RHF defaultValues with `undefined` selects**: `DefaultValues<T>` is a DeepPartial, so
  `description: undefined` / `amount: undefined` are allowed without casts. If a specific
  TS version rejects a leaf, omit that key from `defaultValues` rather than casting.
- **`z.coerce.number()`**: lets numeric `<input>` string values validate/parse; `onSave`
  consumers receive real numbers, so downstream `parseFloat` calls were removed.
- **Off-scale spacing** (`gap-1`, `gap-3`, `py-8`): kept verbatim in `className` on the
  primitive — do not force them onto the token scale.

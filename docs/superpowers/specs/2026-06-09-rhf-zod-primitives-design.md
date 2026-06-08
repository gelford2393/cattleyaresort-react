# React Hook Form + Zod + Layout Primitives + Design Tokens — Design

**Date:** 2026-06-09
**Project:** `cattleyaresort-react`
**Status:** Approved (pending spec review)

## Goal

Introduce React Hook Form + Zod for all form validation, a reusable set of layout
primitives (`Box`, `Stack`, `Flex`, `Text`), a centralized design-token system
(spacing scale + Cattleya brand colors), and a reusable `FormError` component — then
refactor the entire app to use them, replacing raw `<div>` markup and ad-hoc `useState`
form handling.

## Motivation

- Forms currently use scattered `useState` + manual `if (!field) return` validation with
  no inline error messages and no schema. RHF + Zod gives typed schemas, declarative
  validation, and a single source of truth per form.
- Markup is full of repeated `<div className="flex flex-col gap-4">` and inline
  typography classes. Layout primitives + tokens collapse these into short, consistent,
  semantic components and eliminate magic spacing/typography strings at call sites.
- Brand colors should match the public Cattleya website (`react-cattleya-new-website`).

## Scope

**In scope:** All 5 data-entry forms, all 4 filter/search forms, the 4 new primitive/
helper files, the token system, and a full `div → primitive` refactor across every
layout, page, and component file.

**Out of scope:** Firebase backend, routing, business logic, the Zustand store shape.

## Dependencies to Add

```
react-hook-form
zod
@hookform/resolvers
```
(none currently installed; `class-variance-authority`, `clsx`, `tailwind-merge` already present)

## New Files

### 1. `src/styles/design-tokens.css`
Canonical CSS custom properties. Imported by `index.css`.

```css
:root {
  /* Spacing scale (modular) */
  --s2:  2rem;    /* 32px */
  --s1:  1.5rem;  /* 24px */
  --s0:  1rem;    /* 16px (base) */
  --s-1: 0.5rem;  /* 8px  */
  --s-2: 0.25rem; /* 4px  */

  /* Cattleya brand colors (from react-cattleya-new-website) */
  --brand-primary:   #509b48;
  --brand-accent:    #a4d473;
  --brand-highlight: #feb234;
  --brand-surface:   #383838;
  --brand-paper:     #f8efe8;
  --brand-danger:    #ef4444;
}
```

### 2. `src/index.css` (modified)
- Add `@import "./styles/design-tokens.css";` at top (after tailwind import).
- In `@theme inline`, register spacing + brand colors so Tailwind generates utilities
  (`gap-s0`, `p-s1`, `mt-s-2`, `text-brand-primary`, `bg-brand-paper`, etc.):

```css
@theme inline {
  /* ...existing... */
  --spacing-s2:  var(--s2);
  --spacing-s1:  var(--s1);
  --spacing-s0:  var(--s0);
  --spacing-s-1: var(--s-1);
  --spacing-s-2: var(--s-2);

  --color-brand-primary:   var(--brand-primary);
  --color-brand-accent:    var(--brand-accent);
  --color-brand-highlight: var(--brand-highlight);
  --color-brand-surface:   var(--brand-surface);
  --color-brand-paper:     var(--brand-paper);
  --color-brand-danger:    var(--brand-danger);
}
```
- Re-point shadcn `--primary` (and `--ring`, `--sidebar-primary`) to the brand green so
  buttons/topbar use `#509b48`. Use the hex directly: `--primary: #509b48;`.

### 3. `src/lib/tokens.ts`
TypeScript types only (values live in CSS):
```ts
export type SpacingToken = 's2' | 's1' | 's0' | 's-1' | 's-2';
export type TextSize     = 'small' | 'default' | 'large' | 'xl' | 'xxl';
export type TextWeight   = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextColor    = 'default' | 'muted' | 'primary' | 'destructive';
```

### 4. `src/components/ui/primitives.tsx`
Four CVA-powered components. All forward `className` (merged via `cn`) and rest props.

- **`Box`** — `<div>` with optional `p` (SpacingToken) padding. Base block.
- **`Stack`** — `flex flex-col` with `gap` (SpacingToken), optional `align`/`justify`.
- **`Flex`** — `flex` row with `gap` (SpacingToken), optional `align`/`justify`/`wrap`.
- **`Text`** — typography. Props: `size` (TextSize→text-sm/base/lg/xl/2xl),
  `weight` (TextWeight→font-*), `color` (TextColor→text-*), and `as`
  (`'p'|'span'|'h1'|'h2'|'h3'|'h4'|'div'`, default `p`).

Variant→class maps:
```
gap/p:   s2→{gap|p}-s2 ... s-2→{gap|p}-s-2
align:   start|center|end|stretch → items-*
justify: start|center|end|between → justify-*
size:    small→text-sm, default→text-base, large→text-lg, xl→text-xl, xxl→text-2xl
weight:  normal|medium|semibold|bold → font-*
color:   default→text-foreground, muted→text-muted-foreground,
         primary→text-primary, destructive→text-destructive
```

### 5. `src/components/FormError.tsx`
```tsx
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text as="span" size="small" color="destructive" className="mt-1">{message}</Text>;
}
```

### 6. `src/lib/form-schemas.ts`
All Zod schemas + inferred types in one file:

- `loginSchema`: `email` (string, nonempty, `.email()`), `password` (string, min 6).
- `reserveSchema`: `customer` (nonempty), `email` (optional, `.email()` when present),
  `phone` (optional string), `bookingDate` (nonempty), `slots` (array, `.min(1)`).
- `additionalSchema`: `description` (enum of CHARGE_OPTIONS), `customDesc` (optional),
  `amount` (coerced number, positive). `.superRefine`: if `description === 'Others'`
  then `customDesc` must be nonempty.
- `discountSchema`: `careOfBy` (enum of CARE_OF_OPTIONS), `others` (optional),
  `amount` (coerced number, positive). `.superRefine`: if `careOfBy === 'Others'`
  then `others` must be nonempty.
- `paymentSchema`: `type` (enum of PAYMENT_TYPES), `amount` (coerced number, positive),
  `date` (optional string), `referenceNo` (optional string).
- `dateFilterSchema`: `date` (optional string) — filter forms; RHF-controlled, lenient.
- `searchSchema`: `query` (string), `searchType` (enum `['name','bookingNo']`).

Each schema exports an inferred type, e.g. `export type LoginInput = z.infer<typeof loginSchema>`.

## Form Refactor Pattern

```tsx
const form = useForm<ReserveInput>({
  resolver: zodResolver(reserveSchema),
  defaultValues: { customer: '', email: '', phone: '', bookingDate: '', slots: [] },
});

const onSubmit = form.handleSubmit(async (values) => {
  setSubmitError('');
  try { /* firebase work */ } catch (e) { setSubmitError((e as Error).message); }
});

<form onSubmit={onSubmit}>
  <Stack gap="s0">
    <Stack gap="s-2">
      <Label>Customer Name</Label>
      <Input {...form.register('customer')} />
      <FormError message={form.formState.errors.customer?.message} />
    </Stack>
    {submitError && <Alert variant="destructive"><AlertDescription>{submitError}</AlertDescription></Alert>}
    <Button type="submit" disabled={form.formState.isSubmitting}>Reserve</Button>
  </Stack>
</form>
```

- **Inline errors** via `FormError` for every field.
- **Submit-level errors** (Firebase auth/Firestore failures) via existing `Alert`.
- **shadcn `Select`** is uncontrolled → wrap with RHF `Controller`:
```tsx
<Controller control={form.control} name="type" render={({ field }) => (
  <Select value={field.value} onValueChange={field.onChange}>...</Select>
)} />
```
- **Dialog forms** (AdditionalAdd/DiscountAdd/PaymentAdd): `form.reset()` on successful
  save and on close; `onSave` still called with parsed values (now type-safe).
- **Numeric inputs**: schema uses `z.coerce.number()` so `register` string values validate
  and parse correctly; no manual `parseFloat`.
- **react-imask** date field in PaymentAdd: keep `DateMaskInput`, drive via `Controller`.

## Filter Forms (Bookings, BookingsSearch, Slots, Payments)

Convert their date/search inputs to RHF using `dateFilterSchema` / `searchSchema`. These
have lenient validation (a missing date simply does not trigger a query). The "Search"
button becomes the form submit. Keeps these consistent with the rest of the app even
though their validation is minimal — per the requirement that everything is RHF-controlled.

## Div → Primitive Refactor

Every file in `src/layouts`, `src/pages`, `src/components` (excluding `src/components/ui/`
generated shadcn files, which stay as-is) gets its raw `<div>` layout markup converted:

| Before | After |
|---|---|
| `<div className="flex flex-col gap-4">` | `<Stack gap="s0">` |
| `<div className="flex items-center gap-2">` | `<Flex gap="s-1" align="center">` |
| `<div className="space-y-4">` | `<Stack gap="s0">` |
| `<h1 className="text-2xl font-bold">` | `<Text as="h1" size="xxl" weight="bold">` |
| `<p className="text-sm text-muted-foreground">` | `<Text size="small" color="muted">` |
| generic wrapper `<div className="...">` | `<Box className="...">` |

Grid layouts (`grid grid-cols-*`) stay as `<Box className="grid ...">` — primitives do not
model grid; `Box` is the passthrough escape hatch. shadcn `ui/` internals are not touched.

## Testing / Verification

This is a typed UI refactor with no unit-test harness in the project. Verification is:
1. `npx tsc --noEmit` passes (types prove schemas + primitive props are wired correctly).
2. `npm run build` passes.
3. Manual dev-server smoke check: each form shows inline errors on invalid submit,
   submits successfully on valid input; brand green visible on buttons/topbar.

## File-by-File Impact

**New:** `design-tokens.css`, `tokens.ts`, `primitives.tsx`, `FormError.tsx`, `form-schemas.ts`
**Modified (forms):** `LoginPage`, `ReservePage`, `AdditionalAdd`, `DiscountAdd`, `PaymentAdd`,
`BookingsPage`, `BookingsSearchPage`, `SlotsPage`, `PaymentsPage`
**Modified (primitive refactor only):** `index.css`, `AuthLayout`, `MainLayout`,
`BookingDetailPage`, `CalendarPage`, `CalendarViewPage`, `PoolSlotPage`, `ReportsPage`,
`CalendarMarker`, `CurrentMonth`, `PinInput`

## Risks

- **react-imask + Controller** typing in PaymentAdd may need a cast (already casts mask today).
- **Tailwind v4 dynamic class generation**: spacing tokens with negative names (`s-1`,
  `s-2`) must produce valid utility names. Verified pattern: `--spacing-s-1` → `gap-s-1`.
  If Tailwind rejects the `-` form, fall back to `sm1`/`sm2` naming (decided at impl time
  only if the build fails).
- **Large refactor surface**: mitigated by doing primitives + tokens first, then forms,
  then the mechanical div swap last, file-by-file with build checks between batches.

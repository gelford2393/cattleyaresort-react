# Page Folder Architecture Design

**Date:** 2026-06-10  
**Branch:** fix/calendar-modal-reserve-form-width  
**Scope:** Apply the LoginPage folder pattern to every page in `src/pages/`

---

## Goal

Consistent folder-per-page structure across the entire app. Each page folder owns its
sub-components and logic. The flat `src/components/` directory retains only truly shared
components. No logic or behavior changes — pure reorganization.

---

## Reference Pattern (LoginPage — already done)

```
src/pages/LoginPage/
  LoginPage.tsx          ← main component
  LoginForm.tsx          ← sub-component
  LoginPage.logic.ts     ← useLoginPage hook
  index.ts               ← re-exports LoginPage
```

---

## Target Structure

```
src/
  pages/
    LoginPage/                     ← UNTOUCHED
    CalendarPage/
      CalendarPage.tsx             ← slimmed (SlotSummary + ListSlotRow removed)
      SlotSummary.tsx              ← extracted from CalendarPage.tsx
      ListSlotRow.tsx              ← extracted from CalendarPage.tsx
      DateSlotsModal.tsx           ← moved from src/components/
      SlotButton.tsx               ← extracted from DateSlotsModal.tsx
      index.ts
    CalendarViewPage/
      index.ts                     ← re-exports CalendarPage (no behavior change)
    BookingDetailPage/
      BookingDetailPage.tsx        ← slimmed (PDF logic moved out)
      BookingDetailPage.logic.ts   ← useBookingPrint(booking, payments) hook
      AdditionalAdd.tsx            ← moved from src/components/
      DiscountAdd.tsx              ← moved from src/components/
      PaymentAdd.tsx               ← moved from src/components/
      index.ts
    BookingsPage/
      BookingsPage.tsx             ← slimmed (PDF logic moved out)
      BookingsPage.logic.ts        ← handlePrint plain function
      index.ts
    BookingsSearchPage/
      BookingsSearchPage.tsx       ← no code changes
      index.ts
    PaymentsPage/
      PaymentsPage.tsx             ← slimmed (PDF logic moved out)
      PaymentsPage.logic.ts        ← handlePrint plain function + grouping helper
      index.ts
    SlotsPage/
      SlotsPage.tsx                ← no code changes
      index.ts
    PoolSlotPage/
      PoolSlotPage.tsx             ← no code changes
      index.ts
    ReservePage/
      ReservePage.tsx              ← no code changes
      index.ts
    ReportsPage/
      ReportsPage.tsx              ← no code changes
      index.ts

  components/
    ReserveForm.tsx                ← STAYS (used by ReservePage + DateSlotsModal)
    CurrentMonth.tsx               ← STAYS (used by CalendarPage + PoolSlotPage)
    DatePicker.tsx                 ← STAYS (used by multiple pages)
    FormError.tsx                  ← STAYS (used by multiple pages)
    PinInput.tsx                   ← STAYS (used by login flow)
    ui/                            ← UNTOUCHED
```

---

## Extraction Details

### CalendarPage/

| File | Source |
|------|--------|
| `SlotSummary.tsx` | Lines 35–54 of `CalendarPage.tsx` — private function promoted to own file |
| `ListSlotRow.tsx` | Lines 58–72 of `CalendarPage.tsx` — private function promoted to own file |
| `DateSlotsModal.tsx` | Moved verbatim from `src/components/DateSlotsModal.tsx` |
| `SlotButton.tsx` | Lines 268–303 of `DateSlotsModal.tsx` — `SlotButton` function extracted |

### BookingDetailPage/

| File | Source |
|------|--------|
| `BookingDetailPage.logic.ts` | `handlePrint` block (lines 82–103) extracted as `useBookingPrint(booking, payments)` hook returning `{ handlePrint }` |
| `AdditionalAdd.tsx` | Moved from `src/components/AdditionalAdd.tsx` |
| `DiscountAdd.tsx` | Moved from `src/components/DiscountAdd.tsx` |
| `PaymentAdd.tsx` | Moved from `src/components/PaymentAdd.tsx` |

### BookingsPage/

| File | Source |
|------|--------|
| `BookingsPage.logic.ts` | `handlePrint` extracted as plain exported function `printBookings(date, bookings)` |

### PaymentsPage/

| File | Source |
|------|--------|
| `PaymentsPage.logic.ts` | `handlePrint` extracted as `printPayments(date, payments)` + `groupPaymentsByType(payments)` helper |

---

## Import Path Updates Required

After moving files, all consumers must be updated:

| Old path | New path |
|----------|----------|
| `@/components/DateSlotsModal` | `@/pages/CalendarPage/DateSlotsModal` |
| `@/components/AdditionalAdd` | `@/pages/BookingDetailPage/AdditionalAdd` |
| `@/components/DiscountAdd` | `@/pages/BookingDetailPage/DiscountAdd` |
| `@/components/PaymentAdd` | `@/pages/BookingDetailPage/PaymentAdd` |
| `@/pages/CalendarPage` (in CalendarViewPage) | `@/pages/CalendarPage` (index re-export, unchanged from outside) |

All pages export through `index.ts`, so outside consumers (App.tsx, router) use
`@/pages/CalendarPage` and get the named export through the barrel — no router changes needed
as long as App.tsx already imports the named export.

---

## What Does NOT Change

- No logic or behavior changes anywhere
- `src/hooks/`, `src/lib/`, `src/store/`, `src/layouts/`, `src/routes/` — untouched
- `src/components/ui/` — untouched
- `ReserveForm` stays in `components/` (shared between `ReservePage` and `DateSlotsModal`)
- `CurrentMonth` stays in `components/` (shared between `CalendarPage` and `PoolSlotPage`)
- TypeScript types within each file stay in the same file (no separate `types.ts` files)

---

## Success Criteria

- `src/components/` contains only: `ReserveForm`, `CurrentMonth`, `DatePicker`, `FormError`, `PinInput`, and `ui/`
- Every page directory has an `index.ts`
- `tsc --noEmit` passes with zero errors after the reorganization
- App behavior is identical — no runtime changes

# Page Logic Separation — Design Spec

**Date:** 2026-06-09
**Status:** Approved

## Goal

Extract all business logic out of page components into co-located custom hooks. Each page component becomes pure JSX; the hook owns all state, data fetching, event handlers, and derived computations.

## Folder Structure

Each page with logic becomes a folder containing `index.tsx` (UI) and `PageName.logic.ts` (logic). Pages with no logic stay as flat files.

```
src/pages/
  BookingDetailPage/
    index.tsx
    BookingDetailPage.logic.ts
  BookingsPage/
    index.tsx
    BookingsPage.logic.ts
  BookingsSearchPage/
    index.tsx
    BookingsSearchPage.logic.ts
  CalendarPage/
    index.tsx
    CalendarPage.logic.ts
  PaymentsPage/
    index.tsx
    PaymentsPage.logic.ts
  PoolSlotPage/
    index.tsx
    PoolSlotPage.logic.ts
  ReservePage/
    index.tsx
    ReservePage.logic.ts
  SlotsPage/
    index.tsx
    SlotsPage.logic.ts
  LoginPage/
    index.tsx
    LoginPage.logic.ts
  CalendarViewPage.tsx      ← stays flat (no logic)
  ReportsPage.tsx           ← stays flat (no logic)
```

## Logic Split Rule

### Into the hook (`PageName.logic.ts`)
- `useForm`, `useWatch`
- `useState` for data, loading, error, and UI flags
- All Firestore reads and writes (getDocs, getDoc, addDoc, updateDoc, deleteDoc)
- Event handlers (onSubmit, handleDelete, handlePrint, handleAddPayment, etc.)
- Derived computations (grandTotal, grouped, subTotal, slotMap, isSelected, statusVariant)
- Navigation (`useNavigate` + redirect calls)
- `useEffect`, `useMemo`

### Stays in the component (`index.tsx`)
- JSX only
- Destructures everything it needs from the hook's return value
- No `useState`, no `useEffect`, no Firebase imports, no business logic

## Hook Return Pattern

The logic file exports a `use...` function (React's rules of hooks require the `use` prefix on any function that calls hooks internally). The file is named `PageName.logic.ts` for readability; the exported function still uses the `use` prefix.

```ts
// BookingsPage.logic.ts
export function useBookingsPage() {
  // all logic here
  return {
    form,
    dateValue,
    bookings,
    loading,
    searched,
    onSubmit,
    handlePrint,
    statusVariant,
  };
}

// index.tsx
export function BookingsPage() {
  const props = useBookingsPage();
  return ( /* pure JSX using props */ );
}
```

## Per-Page Logic Inventory

| Page | Logic to extract |
|------|-----------------|
| BookingDetailPage | useEffect fetch (booking + payments), useState (booking, payments, modals), handleStatusChange, handleAddPayment, handleAddDiscount, handleAddAdditional, handlePrint, derived: totalPayments, balance |
| BookingsPage | useForm, useState (bookings, loading, searched), onSubmit, handlePrint, statusVariant |
| BookingsSearchPage | useForm, useState (bookings, loading, searched, deleteTarget), onSubmit, handleDelete (cascade), statusVariant |
| CalendarPage | useState (currentDate, events, selectedDate), useEffect (Firestore fetch + transform), datesSet, dateClick, eventClick |
| PaymentsPage | useForm, useState (payments, loading, error, searched), onSubmit, handlePrint, derived: grandTotal, grouped |
| PoolSlotPage | useState (currentDate, slots, loading, error), useEffect (Firestore fetch + cancel), useMemo (slotMap), getSlotStatus |
| ReservePage | useForm, useWatch (slots, bookingDate), useState (submitError), toggleSlot, isSelected, onSubmit, derived: subTotal |
| SlotsPage | useForm, useState (slots, loading, error, searched), onSubmit |
| LoginPage | useForm, useState (submitError), onSubmit |

## Route Imports

All page imports in `src/App.tsx` (or wherever routes are defined) use the folder path — React resolves `index.tsx` automatically, so no import changes are needed.

```ts
// No change required
import { BookingsPage } from './pages/BookingsPage';
// resolves to ./pages/BookingsPage/index.tsx
```

## Non-Goals

- No new data-fetching hooks (that's the TanStack Query refactor spec)
- No component extraction or UI changes
- No changes to CalendarViewPage or ReportsPage

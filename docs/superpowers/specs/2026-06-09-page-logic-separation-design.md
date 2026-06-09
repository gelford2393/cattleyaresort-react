# Page Logic Separation — Design Spec

**Date:** 2026-06-09
**Status:** Approved

## Goal

Extract all business logic out of page components into co-located custom hooks. Each page component becomes pure JSX; the hook owns all state, data fetching, event handlers, and derived computations.

## Folder Structure

Each page with logic becomes a folder containing `index.tsx` (UI) and `usePageName.ts` (logic). Pages with no logic stay as flat files.

```
src/pages/
  BookingDetailPage/
    index.tsx
    useBookingDetailPage.ts
  BookingsPage/
    index.tsx
    useBookingsPage.ts
  BookingsSearchPage/
    index.tsx
    useBookingsSearchPage.ts
  CalendarPage/
    index.tsx
    useCalendarPage.ts
  PaymentsPage/
    index.tsx
    usePaymentsPage.ts
  PoolSlotPage/
    index.tsx
    usePoolSlotPage.ts
  ReservePage/
    index.tsx
    useReservePage.ts
  SlotsPage/
    index.tsx
    useSlotsPage.ts
  LoginPage/
    index.tsx
    useLoginPage.ts
  CalendarViewPage.tsx      ← stays flat (no logic)
  ReportsPage.tsx           ← stays flat (no logic)
```

## Logic Split Rule

### Into the hook (`usePageName.ts`)
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

Every hook returns a flat object of values and handlers. The component destructures it at the top.

```ts
// useBookingsPage.ts
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

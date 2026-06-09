# TanStack Query Refactor — Design Spec

**Date:** 2026-06-09
**Status:** Approved

## Goal

Replace all manual `useState + useEffect` data-fetching patterns across the app with TanStack Query (`useQuery` / `useMutation`). Centralize Firestore logic in a query layer. Expose reusable hooks per collection.

## File Structure

```
src/
  lib/
    queries.ts        ← pure async Firestore fetchers (no React hooks)
    mutations.ts      ← pure async Firestore writers and deleters (no React hooks)
  hooks/
    useAuth.ts        ← already migrated
    useBookings.ts    ← useQuery wrappers for bookings collection
    useSlots.ts       ← useQuery wrappers for slots collection
    usePayments.ts    ← useQuery wrappers for payments collection
```

Pages are updated to consume these hooks. No new pages or components are created.

## Query Keys

| Key | Used by |
|-----|---------|
| `['bookings', { date }]` | BookingsPage |
| `['booking', id]` | BookingDetailPage |
| `['bookings', 'search', query]` | BookingsSearchPage |
| `['slots', { date }]` | SlotsPage, CalendarMarker |
| `['slots', { year, month }]` | CalendarPage, PoolSlotPage |
| `['payments', 'byBooking', id]` | BookingDetailPage |
| `['payments', { date }]` | PaymentsPage |

## Custom Hooks

### `useBookings.ts`
- `useBookingsByDate(date: string)` — fetches bookings where `bookingDate == date`
- `useBookingDetail(id: string)` — fetches single booking doc by ID
- `useBookingSearch(query: string, enabled: boolean)` — searches by customer name or booking number; `enabled` controls whether query runs

### `useSlots.ts`
- `useSlotsByDate(date: string)` — fetches slots where `date == date`
- `useSlotsByMonth(year: number, month: number)` — fetches slots in a date range covering the full month

### `usePayments.ts`
- `usePaymentsByBooking(bookingId: string)` — fetches payments where `bookingDocId == bookingId`
- `usePaymentsByDate(date: string)` — fetches payments where `date == date`

## On-Demand Queries

Pages that search on form submit (BookingsPage, SlotsPage, PaymentsPage, BookingsSearchPage) use `enabled: false` on their `useQuery` hook and call `refetch()` on form submit. This prevents queries from running on mount.

## Mutations

All mutation functions are defined in `mutations.ts` and consumed via `useMutation` in the relevant component.

| Mutation | Component | Invalidates After Success |
|----------|-----------|--------------------------|
| `createBooking` | ReservePage | `['bookings', ...]`, `['slots', ...]` |
| `updateBookingStatus` | BookingDetailPage | `['booking', id]` |
| `updateBookingDiscounts` | BookingDetailPage | `['booking', id]` |
| `updateBookingAdditionals` | BookingDetailPage | `['booking', id]` |
| `createPayment` | BookingDetailPage | `['payments', 'byBooking', id]`, `['booking', id]` |
| `deleteBookingCascade` | BookingsSearchPage | all `bookings`, `slots`, `payments` keys |

Cache invalidation is done via `queryClient.invalidateQueries` inside `onSuccess` of each mutation.

## Pages Affected

| Page | Current Pattern | After |
|------|----------------|-------|
| BookingDetailPage | useState + useEffect | useBookingDetail, usePaymentsByBooking, 4x useMutation |
| CalendarPage | useEffect | useSlotsByMonth |
| PoolSlotPage | useEffect + cancel flag | useSlotsByMonth |
| CalendarMarker | useState + useEffect | useSlotsByDate |
| BookingsPage | form submit + getDocs | useBookingsByDate (enabled: false) |
| SlotsPage | form submit + getDocs | useSlotsByDate (enabled: false) |
| PaymentsPage | form submit + getDocs | usePaymentsByDate (enabled: false) |
| BookingsSearchPage | form submit + getDocs | useBookingSearch (enabled: false) + useDeleteBookingCascade |
| ReservePage | direct addDoc calls | useCreateBooking mutation |

## Error Handling

Each `useQuery` call exposes `isError` / `error`. Pages should render an error message when `isError` is true. CalendarPage currently has no error handling — this will be fixed as part of the migration.

## Non-Goals

- No pagination added (out of scope)
- No optimistic updates (invalidate-and-refetch is sufficient)
- ReportsPage has no data fetching — untouched
- LoginPage uses Auth SDK directly — untouched

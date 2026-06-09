# Calendar View Modal — Design Spec

**Date:** 2026-06-09  
**Status:** Approved

---

## Overview

Upgrade the Calendar View so clicking any date opens a modal table showing all 19 pools with their Day and Night slot status. Staff can add new reservations or open existing bookings directly from the calendar without leaving the page.

---

## User Flows

### Clicking a date
- User clicks any date cell on the FullCalendar grid
- A Dialog modal opens titled with the formatted date (e.g., "Tue, Jun 09 2026")
- The modal shows a table: one row per pool, two columns — Day and Night

### Slot status buttons
Each cell renders one of three uniform-sized buttons based on slot state:

| Firestore slot record | Button | Color |
|---|---|---|
| No slot record for pool + type | **ADD** | Green |
| `slot.status === 'PENDING'` | **PENCIL** | Yellow |
| `slot.status === 'BOOKED'` | **BOOKED** | Red |

### ADD clicked
- Opens a reservation form Dialog (ReserveForm) 
- `pool`, `date`, and `slotType` are pre-filled from the cell that was clicked
- Fields are editable — staff can change them freely
- On successful submission: modal closes, cache invalidates, slot grid re-fetches and updates

### PENCIL / BOOKED clicked
- Navigates to `/booking/:bookingDocId` with `location.state = { modal: true }`
- `BookingDetailPage` detects the modal flag and renders inside a Dialog instead of a full page
- Staff can edit the booking normally
- Close button calls `navigate(-1)` — returns to Calendar View

---

## Architecture (Approach B)

### Component tree

```
CalendarPage
├── FullCalendar  (dateClick → setSelectedDate)
└── DateSlotsModal  (open, date, onClose)
    ├── Pool × Day/Night table
    │   reads: useSlotsByDate(date), pools from useAppStore
    └── nested modal state via useReducer:
        ├── ReserveForm Dialog  (pre-filled pool/date/slotType)
        └── → navigate to BookingDetailPage (modal mode)
```

### State ownership

| State | Owner | Pattern |
|---|---|---|
| `selectedDate: string \| null` | `CalendarPage` | `useState` — ephemeral UI, local to one component |
| Nested modal view | `DateSlotsModal` | `useReducer` — multiple related transitions |
| Slots data | TanStack Query (`useSlotsByDate`) | Server data — never duplicated into `useState` |
| Pools list | Zustand `useAppStore` | Already established |

### Discriminated union for nested modal state

```ts
type CalendarModalView =
  | { view: 'table' }
  | { view: 'reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { view: 'booking'; bookingDocId: string }
```

Impossible states are unrepresentable: `pool` and `bookingDocId` cannot be active simultaneously.

### Reducer actions

```ts
type CalendarModalAction =
  | { type: 'open_reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { type: 'open_booking'; bookingDocId: string }
  | { type: 'back_to_table' }
```

---

## Slot Grid Logic

`DateSlotsModal` calls `useSlotsByDate(date)` and cross-references the full pool list:

```
for each pool in pools:
  for each slotType in ['DAY', 'NIGHT']:
    find slot where slot.pool === pool.pool && slot.type === slotType
    if not found  → render ADD button
    if found && slot.status === 'PENDING' → render PENCIL button
    if found && slot.status === 'BOOKED'  → render BOOKED button
```

`slot.bookingDocId` (already on the `Slot` type) is captured at render time so it's available immediately when PENCIL/BOOKED is clicked.

---

## BookingDetailPage — Modal Mode

```ts
const location = useLocation()
const isModal = location.state?.modal === true
```

- `isModal === false` (default): renders as full page — no change to existing behavior
- `isModal === true`: wraps page content in a `<Dialog>` with a close button that calls `navigate(-1)`

Navigation from `DateSlotsModal`:
```ts
navigate(`/booking/${slot.bookingDocId}`, { state: { modal: true } })
```

---

## ReserveForm Extraction

`ReservePage` form body is extracted into a `ReserveForm` component:

```ts
interface ReserveFormProps {
  defaultPool?: string
  defaultDate?: string
  defaultSlotType?: 'DAY' | 'NIGHT'
  onSuccess?: (bookingDocId: string) => void
}
```

- `ReservePage` continues to use `ReserveForm` with no props (existing behavior unchanged)
- `DateSlotsModal` renders `ReserveForm` inside a Dialog with pre-filled defaults
- Fields are NOT disabled — staff can change pool, date, or slot type freely

---

## Files Changed

### New
| File | Purpose |
|---|---|
| `src/components/DateSlotsModal.tsx` | Date table modal with pool grid and nested modal state |

### Modified
| File | Change |
|---|---|
| `src/pages/CalendarPage.tsx` | Replace `CalendarMarker` inline panel with `<DateSlotsModal>` |
| `src/pages/ReservePage.tsx` | Extract form body into `ReserveForm` component |
| `src/pages/BookingDetailPage.tsx` | Add modal mode via `location.state?.modal` |

### Deleted
| File | Reason |
|---|---|
| `src/components/CalendarMarker.tsx` | Fully replaced by `DateSlotsModal` |

---

## Data Flow

### ADD path
```
dateClick → selectedDate set → DateSlotsModal opens
→ useSlotsByDate fetches → grid renders
→ ADD clicked → dispatch open_reserve
→ ReserveForm Dialog opens (pre-filled)
→ submit → useCreateBooking mutation
→ onSuccess → invalidate ['bookings'], ['slots']
→ DateSlotsModal re-fetches → grid updates
```

### PENCIL / BOOKED path
```
PENCIL/BOOKED clicked → dispatch open_booking
→ navigate(`/booking/${bookingDocId}`, { state: { modal: true } })
→ BookingDetailPage renders in Dialog
→ staff edits booking
→ close → navigate(-1) → back to Calendar
```

---

## TypeScript Patterns Applied

- **Discriminated union** for `CalendarModalView` — mutually exclusive modal states
- **`useReducer`** for nested modal transitions — multiple related state changes
- **TanStack Query** owns all server data — no `useState` duplication
- **Location state flag** for dual render mode — no router restructuring needed
- **`assertNever`** in the `useReducer` default case — compile error on unhandled variants

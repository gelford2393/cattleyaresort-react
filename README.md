# Cattleya Resort Management System

A full-stack resort reservation and booking management system built for internal staff use. Handles pool slot scheduling, guest bookings, payment tracking, and management reporting.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-resort--react.web.app-blue)](https://resort-react.web.app)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Hosting-FFCA28?logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)

---

## Features

### Login
- Firebase Authentication (email/password)
- Form validation with React Hook Form + Zod
- Role-based redirect on login (admin vs staff)
- Dark-themed UI with animated ring effect

### Calendar — Month View
- FullCalendar v6 day grid with custom event rendering
- Per-day counts: pending and booked slots (day + night)
- Month navigation synced with a custom current-month picker

### Calendar — Date Modal
- Pool grid for a selected date showing real-time slot availability
- Slot status per pool: PENDING / BOOKED / available
- Opens reserve form or booking detail inline
- Conflict detection prevents double-booking

### Reserve Form
- New reservation form with full Zod schema validation
- Automatic deposit calculation based on pool and slot type
- Slot conflict detection before submission

### Slots
- Paginated list of all pool slots across all dates
- Status badges: PENDING / BOOKED / CANCELLED
- TanStack Query for real-time Firestore data

### Pool Slot
- Per-pool slot management view
- Filter slots by pool number
- Quick status overview for a single pool

### Bookings
- Paginated bookings table
- Print-ready PDF export via jsPDF + jspdf-autotable
- Click any row to open booking detail

### Bookings Search
- Live search by guest name
- Filter by date range and status

### Booking Detail
- Full booking record: status, payments, additionals, and discounts
- Status management: PENDING → BOOKED → CANCELLED
- Add payments, additional charges, and discounts inline
- PDF export for individual booking

### Payments *(admin only)*
- Payments grouped by type
- PDF export of full payment report
- Restricted to admin role via `RestrictedRoute`

### Reports *(admin only)*
- Embedded Looker Studio dashboard
- Admin-only access via `RestrictedRoute`

---

## Tech Stack

| Frontend | Backend / Infra |
|----------|----------------|
| React 19 | Firebase Firestore |
| TypeScript 6 | Firebase Authentication |
| Vite 8 | Firebase Hosting |
| Tailwind CSS 4 | Firebase Realtime Database |
| TanStack Query v5 | Firebase Storage |
| React Hook Form v7 + Zod v4 | |
| FullCalendar v6 | |
| React Router v6 | |
| Zustand v5 | |
| jsPDF + jspdf-autotable | |
| Sonner (toasts) | |
| Radix UI + Lucide React | |

---

## Architecture

```
src/
├── pages/
│   └── PageName/
│       ├── index.ts           # Re-export
│       ├── PageName.tsx       # UI only
│       ├── PageName.logic.ts  # Business logic, PDF helpers
│       └── SubComponent.tsx   # Co-located sub-components
├── hooks/                     # TanStack Query hooks (Firestore reads + mutations)
├── components/ui/             # Radix UI primitives + shadcn
├── lib/
│   ├── firebase.ts            # Firebase app init
│   ├── mutations.ts           # Firestore write operations
│   └── form-schemas.ts        # Zod schemas (single source of truth)
└── routes/                    # PrivateRoute, RestrictedRoute
```

**Key patterns:**
- **Page folder pattern** — each page lives in its own folder with UI, logic, and sub-components co-located
- **TanStack Query** — all Firestore reads and mutations go through typed `useXxx` hooks
- **Zod schemas** — single source of truth for form shape and validation, no ad-hoc field checks
- **Role-based routing** — `RestrictedRoute` guards admin-only pages (`/payments`, `/reports`)
- **PDF generation** — jsPDF + jspdf-autotable for printable booking and payment reports

---

## How It Was Built — Spec-Driven Development

Every feature in this project started as a written design spec before any code was written.

**The cycle:**
1. Write a design spec in `docs/superpowers/specs/` — purpose, architecture, component breakdown, edge cases
2. Convert the spec into a step-by-step implementation plan
3. Implement task by task with AI-assisted pair programming
4. Code review against the original spec

**Specs produced during development:**

| Spec | What it designed |
|------|-----------------|
| `calendar-view-modal-design` | DateSlotsModal and pool grid overlay |
| `rhf-zod-primitives-design` | Form validation architecture with RHF + Zod |
| `tanstack-query-refactor-design` | Firestore data-fetching layer via TanStack Query |
| `page-logic-separation-design` | Separating business logic from UI components |
| `dark-mode-design` | Theming system and dark login screen |
| `page-folder-architecture-design` | Page folder conventions and co-location rules |

This process produced a codebase that is easy to navigate, review, and extend — each page has a predictable structure that any developer can pick up without onboarding.

---

## Local Setup

```bash
git clone https://github.com/gelford2393/cattleyaresort-react.git
cd cattleyaresort-react
cp .env.example .env.local
# Fill in your Firebase project values in .env.local
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Environment variables required (`.env.local`):**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=   # optional, for Realtime Database
```

> Never commit `.env.local` or any Firebase service account JSON to version control.

import { Routes, Route } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { PrivateRoute } from './routes/PrivateRoute';
import { RestrictedRoute } from './routes/RestrictedRoute';
import { LoginPage } from './pages/LoginPage';
import { ReservePage } from './pages/ReservePage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { BookingsPage } from './pages/BookingsPage';
import { BookingsSearchPage } from './pages/BookingsSearchPage';
import { CalendarPage } from './pages/CalendarPage';
import { CalendarViewPage } from './pages/CalendarViewPage';
import { SlotsPage } from './pages/SlotsPage';
import { PoolSlotPage } from './pages/PoolSlotPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<LoginPage />} />
      </Route>

      {/* Authenticated */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/calendar-view"    element={<CalendarViewPage />} />
          <Route path="/calendar"         element={<CalendarPage />} />
          <Route path="/reserve"          element={<ReservePage />} />
          <Route path="/slots"            element={<SlotsPage />} />
          <Route path="/poolslot"         element={<PoolSlotPage />} />
          <Route path="/bookings"         element={<BookingsPage />} />
          <Route path="/bookings-search"  element={<BookingsSearchPage />} />
          <Route path="/booking/:id"      element={<BookingDetailPage />} />

          {/* Admin only */}
          <Route element={<RestrictedRoute />}>
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/reports"  element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

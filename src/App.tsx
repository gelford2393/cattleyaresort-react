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

// Placeholder pages — will be replaced in Task 12
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8 text-center text-muted-foreground">
    <h2 className="text-xl font-semibold mb-2">{name}</h2>
    <p>This page is coming soon.</p>
  </div>
);

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
          <Route path="/calendar-view"    element={<Placeholder name="Calendar View" />} />
          <Route path="/calendar"         element={<Placeholder name="Calendar" />} />
          <Route path="/reserve"          element={<ReservePage />} />
          <Route path="/slots"            element={<Placeholder name="Slots" />} />
          <Route path="/poolslot"         element={<Placeholder name="Slots per Pool" />} />
          <Route path="/bookings"         element={<BookingsPage />} />
          <Route path="/bookings-search"  element={<BookingsSearchPage />} />
          <Route path="/booking/:id"      element={<BookingDetailPage />} />

          {/* Admin only */}
          <Route element={<RestrictedRoute />}>
            <Route path="/payments" element={<Placeholder name="Payments" />} />
            <Route path="/reports"  element={<Placeholder name="Reports" />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

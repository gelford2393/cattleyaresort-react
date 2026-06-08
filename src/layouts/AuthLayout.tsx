import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <Outlet />
    </div>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ADMIN_UIDS = [
  'BoY0tWkK2GZnjWJIlOF9FgFnv2Q2',
  'GfeK4h5Z4TTGqBEx33QLrBBaNv12',
  'JEoe73fKD1VSTYlhEXgGkftOiAW2',
  'LGn32HKDb3aY8wt2rD7g65eV7T83',
  'o1d2QyRShQh7OQjfbhZJ1ulvxNs2',
  '6IuPe9oR2vfkHCOWb1iKNv83Voo2',
];

export function RestrictedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !ADMIN_UIDS.includes(user.uid)) return <Navigate to="/" replace />;
  return <Outlet />;
}

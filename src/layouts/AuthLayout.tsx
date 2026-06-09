import { Outlet } from 'react-router-dom';
import { Flex } from '@/components/ui/primitives';

export function AuthLayout() {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-muted">
      <Outlet />
    </Flex>
  );
}

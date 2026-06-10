import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Flex } from '@/components/ui/primitives';

export function AuthLayout() {
  useEffect(() => {
    // Default to dark unless the user explicitly chose light
    const isDark = localStorage.getItem('theme') !== 'light';
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-background">
      <Outlet />
    </Flex>
  );
}

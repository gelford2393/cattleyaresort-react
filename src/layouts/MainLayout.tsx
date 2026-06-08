import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_UIDS = [
  'BoY0tWkK2GZnjWJIlOF9FgFnv2Q2',
  'GfeK4h5Z4TTGqBEx33QLrBBaNv12',
  'JEoe73fKD1VSTYlhEXgGkftOiAW2',
  'LGn32HKDb3aY8wt2rD7g65eV7T83',
  'o1d2QyRShQh7OQjfbhZJ1ulvxNs2',
  '6IuPe9oR2vfkHCOWb1iKNv83Voo2',
];

export function MainLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menus = useAppStore((s) => s.menus);
  const { user } = useAuth();
  const isAdmin = user ? ADMIN_UIDS.includes(user.uid) : false;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const visibleMenus = menus.filter((m) => !m.restricted || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-primary px-4 text-primary-foreground">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <img src="/cattleyaresortlogo.png" alt="logo" className="h-8 object-contain" />
        <span className="flex-1 font-semibold text-sm">Cattleya Resort</span>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Nav sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm font-semibold">Navigation</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-2">
            {visibleMenus.map((item) => {
              const IconComponent = (LucideIcons as unknown as Record<string, React.ElementType>)[item.icon] ?? LucideIcons.Circle;
              return (
                <button
                  key={item.route}
                  onClick={() => { navigate(item.route); setOpen(false); }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left w-full"
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  {item.title}
                </button>
              );
            })}
          </nav>
          <Separator />
        </SheetContent>
      </Sheet>

      {/* Page content */}
      <main className="p-4 max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

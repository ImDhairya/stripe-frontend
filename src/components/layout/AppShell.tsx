import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LayoutDashboard, CreditCard, Webhook, Users, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AppShell() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Webhooks', href: '/webhooks', icon: Webhook, requiresPaid: true },
    { name: 'Admin', href: '/admin/users', icon: Users, requiresAdmin: true },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-bold text-xl tracking-tight text-primary">PayGate</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            if (item.requiresAdmin && user?.role !== 'admin') return null;
            if (item.requiresPaid && user?.tier !== 'paid' && user?.role !== 'admin') {
              return (
                <div key={item.name} className="px-3 py-2 text-sm font-medium text-muted-foreground flex items-center opacity-50 cursor-not-allowed">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  <Badge className="ml-auto text-[10px] h-4 px-1 bg-transparent border">PRO</Badge>
                </div>
              );
            }

            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium truncate">{user?.email}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.tier} Tier</span>
          </div>
          <Button className="bg-transparent text-foreground hover:bg-secondary" size="icon" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

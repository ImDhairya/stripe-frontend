import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LayoutDashboard, CreditCard, Webhook, Users, LogOut, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

const isEvaluatorMode = import.meta.env.VITE_EVALUATOR_MODE !== 'false';

export function AppShell() {
  const { user, logout, login } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Webhooks', href: '/webhooks', icon: Webhook, requiresPaid: true },
    { name: 'Observability & Audit', href: '/telemetry', icon: Activity },
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
        {/* Assessor Sandbox Top Bar (active when isEvaluatorMode=true) */}
        {isEvaluatorMode && (
          <header className="h-11 border-b border-border/80 bg-muted/30 px-4 md:px-6 flex items-center justify-between text-xs flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-foreground">
                Assessor Sandbox:
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                Pre-authenticated as <code className="bg-background/80 px-1.5 py-0.5 rounded border border-border/80 font-mono text-[11px] text-foreground font-semibold">{user?.email}</code> ({user?.role} • {user?.tier} tier)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-medium"
                  onClick={() => {
                    login({ email: 'merchant@paygate.com', password: 'Merchant@12345' });
                  }}
                >
                  Switch to Merchant View
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-medium"
                  onClick={() => {
                    login({ email: 'admin@paygate.com', password: 'Admin@12345' });
                  }}
                >
                  Switch to Admin View
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => logout()}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
              </Button>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

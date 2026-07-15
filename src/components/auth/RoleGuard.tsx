import { useAuthStore } from '../../stores/authStore';

export function RoleGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: ('user' | 'admin')[] }) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

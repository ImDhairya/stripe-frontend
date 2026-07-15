import { useAuthStore } from '../../stores/authStore';

export function TierGuard({ children, allowedTiers }: { children: React.ReactNode, allowedTiers: ('free' | 'paid')[] }) {
  const { user } = useAuthStore();

  if (!user || (!allowedTiers.includes(user.tier) && user.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Upgrade Required</h2>
        <p className="text-muted-foreground">You must upgrade to a paid tier to access this feature.</p>
      </div>
    );
  }

  return <>{children}</>;
}

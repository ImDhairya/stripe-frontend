import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (s: string) => {
    switch (s.toLowerCase()) {
      case 'succeeded':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 animate-pulse';
      case 'failed':
      case 'canceled':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20';
      case 'requires_payment_method':
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20';
    }
  };

  return (
    <Badge variant="outline" className={cn('capitalize font-medium', getStatusStyles(status))}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

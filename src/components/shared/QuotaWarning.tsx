import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function QuotaWarning() {
  const [warning, setWarning] = useState<{ remaining?: string; retryAfter?: string } | null>(null);

  useEffect(() => {
    const handleQuota = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { remaining, retryAfter } = customEvent.detail;
      
      if (retryAfter) {
        setWarning({ retryAfter });
      } else if (remaining && parseInt(remaining) < 10) {
        setWarning({ remaining });
      } else {
        setWarning(null);
      }
    };

    window.addEventListener('api:quota', handleQuota);
    return () => window.removeEventListener('api:quota', handleQuota);
  }, []);

  if (!warning) return null;

  return (
    <div className="mb-4">
      <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>API Limits Reached</AlertTitle>
        <AlertDescription>
          {warning.retryAfter
            ? `Rate limit exceeded. Please try again after ${warning.retryAfter} seconds.`
            : `You are running low on API quota. Only ${warning.remaining} requests remaining.`}
        </AlertDescription>
      </Alert>
    </div>
  );
}

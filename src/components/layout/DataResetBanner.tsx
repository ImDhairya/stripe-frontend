import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export function DataResetBanner() {
  const [resetTime, setResetTime] = useState('');

  useEffect(() => {
    // Calculate next midnight UTC
    const now = new Date();
    const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    
    // Format to local time string
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    setResetTime(formatter.format(nextMidnightUTC));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[999] pointer-events-none animate-in fade-in duration-700">
      <div className="bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-full shadow-xl px-4 py-2 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[11px] sm:text-xs text-zinc-400 font-medium tracking-wide">
          Sandbox data resets: <span className="text-white">{resetTime}</span>
        </span>
      </div>
    </div>
  );
}

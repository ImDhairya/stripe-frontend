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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in duration-700">
      <div className="bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-full shadow-md px-3 py-1.5 flex items-center gap-2">
        <Info className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
          Sandbox resets: <span className="text-white">{resetTime}</span>
        </span>
      </div>
    </div>
  );
}

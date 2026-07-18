'use client';

import { useState, useEffect } from 'react';

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ date, time }: { date: string; time?: string }) {
  const target = new Date(time ? `${date.slice(0, 10)}T${time}` : date);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(target));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  if (!mounted || isNaN(target.getTime())) return null;

  if (!timeLeft) {
    return (
      <div className="glass rounded-2xl px-5 py-4 text-center">
        <p className="font-display font-bold text-lg">This event has started</p>
      </div>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="glass rounded-2xl px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 text-center">Starts in</p>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.label} className="text-center">
            <div className="text-2xl sm:text-3xl font-display font-black text-gradient tabular-nums">
              {String(u.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

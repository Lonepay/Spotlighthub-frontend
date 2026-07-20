'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A YouTube/NProgress-style top loading bar for dashboard navigation.
 * Next.js 14's App Router has no public "navigation started" event, so this
 * fakes it: a capture-phase click listener on internal <a> links starts the
 * bar immediately, and it completes once the pathname/search params actually
 * change. Deliberately kept out of the public site — dashboards only.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const key = `${pathname}?${searchParams.toString()}`;
  const prevKey = useRef(key);

  useEffect(() => {
    if (prevKey.current === key) return;
    prevKey.current = key;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
    return () => clearTimeout(t);
  }, [key]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement)?.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || link.target === '_blank') return;

      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      if (href === currentUrl) return;

      setVisible(true);
      setProgress(12);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
      }, 180);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, searchParams]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-primary shadow-glow-sm transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

'use client';

import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <span title="Verified organizer" className="inline-flex shrink-0">
      <BadgeCheck className={`${px} text-blue-500 fill-blue-500/20`} strokeWidth={2.5} />
    </span>
  );
}

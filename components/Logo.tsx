'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const LIGHT_LOGO = '/storage/logo.png';
// Both logos are local files now — previously the dark one lived on an
// external Cloudflare R2 bucket, which meant updating it needed separate
// storage credentials instead of just editing a file in the repo.
const DARK_LOGO = '/storage/dark-logo.png';

export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — next-themes can't know the resolved theme
  // until after mount, so default to the dark logo (matches this app's
  // defaultTheme="dark") until we actually know better.
  useEffect(() => setMounted(true), []);
  const src = mounted && resolvedTheme === 'light' ? LIGHT_LOGO : DARK_LOGO;

  return (
    <Image
      src={src}
      alt="Spotlighticket"
      width={219}
      height={99}
      className={className}
      priority={priority}
    />
  );
}

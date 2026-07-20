'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const LIGHT_LOGO = '/storage/logo.png';
const DARK_LOGO = 'https://pub-842aae4c90d54643a70e1822b6b9de7b.r2.dev/dark-logo.PNG';

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

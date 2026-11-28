import localFont from 'next/font/local';

// Dashboard typefaces (ITF Free Font License), self-hosted: General Sans for
// text, Cabinet Grotesk for headings and figures.
export const dashboardSans = localFont({
  src: [
    { path: './general-sans-400.woff2', weight: '400', style: 'normal' },
    { path: './general-sans-500.woff2', weight: '500', style: 'normal' },
    { path: './general-sans-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-dash-sans',
  display: 'swap',
});

export const dashboardHeading = localFont({
  src: [{ path: './cabinet-grotesk-700.woff2', weight: '700', style: 'normal' }],
  variable: '--font-dash-heading',
  display: 'swap',
});

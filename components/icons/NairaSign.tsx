import * as React from 'react';

/** Lucide-style icon for the Naira currency, since lucide-react has no Naira glyph. */
export const NairaSign = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, width = 24, height = 24, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 4v16" />
      <path d="M18 4v16" />
      <path d="M6 4l12 16" />
      <path d="M4 9h16" />
      <path d="M4 14h16" />
    </svg>
  )
);
NairaSign.displayName = 'NairaSign';

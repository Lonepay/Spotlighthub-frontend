'use client';

import * as React from 'react';
import PhoneInputWithCountrySelect, { type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  id?: string;
  value?: Value;
  onChange: (value?: Value) => void;
  defaultCountry?: string;
  onCountryChange?: (country?: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// Wraps react-phone-number-input, styled to match Input (see .PhoneInput* overrides in globals.css).
const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ id, value, onChange, defaultCountry = 'NG', onCountryChange, placeholder, required, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-11 w-full items-center gap-2 rounded-xl border border-input bg-background/50 px-4 text-sm text-foreground transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
          className
        )}
      >
        <PhoneInputWithCountrySelect
          id={id}
          className="PhoneInput"
          value={value}
          onChange={onChange}
          onCountryChange={(country) => onCountryChange?.(country)}
          defaultCountry={defaultCountry as any}
          international
          countryCallingCodeEditable={false}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
export type { Value as PhoneValue };

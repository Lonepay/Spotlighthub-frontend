'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import PhoneInputWithCountrySelect, { type Value, type Country, getCountryCallingCode } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type CountryOption = { value?: Country; label: string; divider?: boolean };

// The library's default country picker is a native <select> — its open
// dropdown is rendered by the OS/browser, ignoring the page's CSS entirely
// (a plain white, unthemed popup). This replaces it with a fully custom,
// searchable dropdown built on the app's own Radix dropdown-menu primitive.
function CountrySelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value?: Country;
  onChange: (value?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
}) {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const realOptions = React.useMemo(() => options.filter((o) => o.value && !o.divider), [options]);
  const filtered = search
    ? realOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : realOptions;

  const CurrentFlag = value ? flags[value] : undefined;

  React.useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  return (
    <DropdownMenuPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-1 shrink-0 outline-none disabled:opacity-50"
          aria-label="Select country"
        >
          <span className="w-5 h-3.5 overflow-hidden rounded-sm shrink-0 flex items-center justify-center bg-muted">
            {CurrentFlag && <CurrentFlag title={value || ''} />}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-elevated overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    return;
                  }
                  e.stopPropagation();
                }}
                placeholder="Search country…"
                className="w-full h-8 rounded-lg border border-input bg-background/50 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-primary"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matches</p>
            )}
            {filtered.map((o) => {
              const Flag = o.value ? flags[o.value] : undefined;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-primary/10 hover:text-primary',
                    value === o.value && 'bg-primary/10 text-primary'
                  )}
                >
                  <span className="w-5 h-3.5 overflow-hidden rounded-sm shrink-0 flex items-center justify-center bg-muted">
                    {Flag && <Flag title={o.label} />}
                  </span>
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value && <span className="text-xs text-muted-foreground shrink-0">+{getCountryCallingCode(o.value)}</span>}
                </button>
              );
            })}
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

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
          countrySelectComponent={CountrySelect}
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

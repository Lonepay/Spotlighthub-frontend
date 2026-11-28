'use client';

/** A four-step strength bar for a new password, with a hint for the next step up. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password) || password.length >= 14,
  ];
  const score = checks.filter(Boolean).length;
  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const color = ['bg-destructive', 'bg-destructive', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'][score];
  const hint = !checks[0]
    ? 'Use at least 8 characters.'
    : !checks[1]
    ? 'Mix upper and lower case.'
    : !checks[2]
    ? 'Add a number.'
    : !checks[3]
    ? 'Add a symbol or make it longer.'
    : 'Nice - that’s a strong password.';

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? color : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{label}.</span> {hint}</p>
    </div>
  );
}

export function Loader({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-block rounded-full animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 10)),
        borderStyle: 'solid',
        borderColor: 'hsl(var(--primary) / 0.15)',
        borderTopColor: 'hsl(var(--primary-glow))',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <Loader size={48} />
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}

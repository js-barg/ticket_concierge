type StatusBadgeProps = { status: string; variant?: 'default' | 'success' | 'warning' | 'muted' };

const variants: Record<string, string> = {
  default: 'bg-slate-600 text-slate-200',
  success: 'bg-emerald-800/60 text-emerald-200',
  warning: 'bg-amber-800/60 text-amber-200',
  muted: 'bg-slate-700/60 text-slate-400'
};

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${variants[variant] ?? variants.default}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

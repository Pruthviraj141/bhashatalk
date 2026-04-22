import clsx from 'clsx'

type StatusTone = 'online' | 'reconnecting' | 'offline' | 'sending' | 'delivered' | 'read' | 'error'

interface StatusChipProps {
  tone: StatusTone
  label: string
  compact?: boolean
}

const toneClass: Record<StatusTone, string> = {
  online: 'border-emerald-300/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300',
  reconnecting:
    'border-amber-300/80 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
  offline: 'border-rose-300/80 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300',
  sending: 'border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  delivered:
    'border-primary-300/80 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300',
  read: 'border-blue-300/80 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300',
  error: 'border-rose-300/80 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300',
}

export function StatusChip({ tone, label, compact = false }: StatusChipProps) {
  return (
    <span
      className={clsx('status-chip', toneClass[tone], compact ? 'px-2 py-0.5 text-[10px]' : undefined)}
      role="status"
      aria-live="polite"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}

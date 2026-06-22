import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function StatRow({ label, value, cls }: { label: string; value: ReactNode; cls?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm tabular-nums', cls)}>{value}</span>
    </div>
  )
}

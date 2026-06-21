import { type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

export function PagePlaceholder({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{description}</p>
      <Card className="mt-6">
        {children ?? <p className="text-sm text-muted-foreground">Coming soon in a later phase.</p>}
      </Card>
    </div>
  )
}

import { Newspaper } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <Card className="sticky top-20">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Market News</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          A curated market news feed lands in a later phase.
        </p>
        <div className="mt-4 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-surface" />
              <div className="h-2 w-1/2 rounded bg-surface" />
            </div>
          ))}
        </div>
      </Card>
    </aside>
  )
}

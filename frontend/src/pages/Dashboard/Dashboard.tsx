import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useLayout } from '@/store/useLayout'
import { useRefresh } from '@/store/useRefresh'
import { AddWidgetMenu } from './AddWidgetMenu'
import { DashboardGrid } from './DashboardGrid'

export default function Dashboard() {
  const load = useLayout((s) => s.load)
  const loaded = useLayout((s) => s.loaded)
  const editMode = useLayout((s) => s.editMode)
  const toggleEdit = useLayout((s) => s.toggleEdit)
  const reset = useLayout((s) => s.reset)
  const bump = useRefresh((s) => s.bump)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          {editMode && <AddWidgetMenu />}
          {editMode && (
            <Button size="sm" variant="ghost" onClick={reset}>
              Reset
            </Button>
          )}
          <IconButton onClick={bump} aria-label="Refresh all widgets" title="Refresh all">
            <RefreshCw className="h-4 w-4" />
          </IconButton>
          <Button size="sm" variant={editMode ? 'primary' : 'secondary'} onClick={toggleEdit}>
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>

      {loaded ? (
        <DashboardGrid />
      ) : (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading your dashboard…
        </div>
      )}
    </div>
  )
}

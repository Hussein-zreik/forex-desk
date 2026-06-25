import { Spinner } from '@/components/ui/Spinner'

/** Centered loading spinner sized for a widget body. Back-compat wrapper over `Spinner`. */
export function WidgetLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="md" label="Loading widget" />
    </div>
  )
}

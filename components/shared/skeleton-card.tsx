export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-full" />
      <div className="flex gap-2 pt-1">
        <div className="h-5 bg-muted rounded-full w-14" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
    </div>
  )
}

export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-3 bg-muted rounded ${width} animate-pulse`} />
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* User message */}
      <div className="flex justify-end">
        <div className="bg-muted rounded-lg px-4 py-2 w-48 h-10" />
      </div>
      {/* AI message */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-4/5" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <main className="p-6 max-w-5xl mx-auto animate-pulse">
      {/* タイトル */}
      <div className="h-8 w-40 bg-muted rounded-md mb-6" />
      {/* サマリーカード行 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      {/* セクション */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-5 w-32 bg-muted rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 bg-muted rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  )
}

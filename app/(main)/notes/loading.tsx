export default function NotesLoading() {
  return (
    <main className="p-6 max-w-4xl mx-auto animate-pulse">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 bg-muted rounded-md" />
        <div className="h-8 w-28 bg-muted rounded-md" />
      </div>
      {/* 検索 */}
      <div className="h-10 w-full bg-muted rounded-md mb-4" />
      {/* カード一覧 */}
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 w-full bg-muted rounded-lg" />
        ))}
      </div>
    </main>
  )
}

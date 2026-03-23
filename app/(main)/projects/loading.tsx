export default function ProjectsLoading() {
  return (
    <main className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-muted rounded-md" />
        <div className="h-8 w-28 bg-muted rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    </main>
  )
}

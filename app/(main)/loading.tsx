export default function MainLoading() {
  return (
    <main className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-md mb-6" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-muted rounded-md" />
        <div className="h-4 w-5/6 bg-muted rounded-md" />
        <div className="h-4 w-4/6 bg-muted rounded-md" />
      </div>
    </main>
  )
}

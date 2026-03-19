import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">ダッシュボード</h1>
      <p className="text-muted-foreground">ようこそ、{user.email} さん</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Phase 3 でサイドバー・ノート一覧・ToDo が追加されます。
      </p>
    </main>
  )
}

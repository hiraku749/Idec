import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'
import { MobileNav } from '@/components/shared/mobile-nav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 最近のノート（直近5件）をサイドバー用に取得
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(5)

  return (
    <div className="flex min-h-screen bg-background">
      {/* デスクトップ：固定サイドバー */}
      <div className="hidden md:block">
        <Sidebar recentNotes={recentNotes ?? []} />
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* モバイル：トップバー */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-30">
          <MobileNav recentNotes={recentNotes ?? []} />
          <span className="font-bold text-base">Idec</span>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoteCard } from '@/components/notes/note-card'
import { buttonVariants } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/format'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ピン留めノート
  const { data: pinnedNotes } = await supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, updated_at')
    .eq('user_id', user.id)
    .eq('is_pinned', true)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(6)

  // 最近のノート（ピン留め除く）
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, updated_at')
    .eq('user_id', user.id)
    .eq('is_pinned', false)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(6)

  // 未完了 ToDo
  const { data: todos } = await supabase
    .from('todos')
    .select('id, content, is_done, note_id, created_at')
    .eq('is_done', false)
    .order('created_at', { ascending: false })
    .limit(10)

  const hasPinned = (pinnedNotes ?? []).length > 0
  const hasRecent = (recentNotes ?? []).length > 0
  const hasTodos  = (todos ?? []).length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* ウェルカム */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            今日は {formatDate(new Date())} です
          </p>
        </div>
        <Link href="/notes/new" className={buttonVariants()}>
          ＋ 新規ノート
        </Link>
      </div>

      {/* ピン留めノート */}
      {hasPinned && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <span>📌</span> ピン留め
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(pinnedNotes ?? []).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* 最近のノート */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <span>🕐</span> 最近のノート
          </h2>
          <Link href="/notes" className="text-xs text-muted-foreground hover:text-foreground underline">
            すべて見る
          </Link>
        </div>
        {hasRecent ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(recentNotes ?? []).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border rounded-lg">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm">まだノートがありません</p>
            <Link href="/notes/new" className="text-xs underline mt-1 inline-block">
              最初のノートを作る
            </Link>
          </div>
        )}
      </section>

      {/* 未完了 ToDo */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <span>✅</span> 未完了の ToDo
        </h2>
        {hasTodos ? (
          <div className="space-y-2">
            {(todos ?? []).map((todo) => (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-3 border rounded-md bg-card text-sm"
              >
                <span className="mt-0.5 text-muted-foreground">◻</span>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug">{todo.content}</p>
                  <Link
                    href={`/notes/${todo.note_id}`}
                    className="text-xs text-muted-foreground underline mt-0.5 inline-block"
                  >
                    ノートを開く
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
            未完了の ToDo はありません 🎉
          </p>
        )}
      </section>
    </div>
  )
}

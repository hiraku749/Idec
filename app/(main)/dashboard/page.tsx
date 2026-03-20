import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoteCard } from '@/components/notes/note-card'
import { formatDate } from '@/lib/utils/format'
import type { ProjectStatus } from '@/types'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: '計画中',
  active: '進行中',
  completed: '完了',
  archived: 'アーカイブ',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 最近のノート（5件）
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, updated_at')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(5)

  // プロジェクト一覧（ステータス付き）
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, progress_percent, deadline')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(6)

  // AI使用量（今月）
  const yearMonth = new Date().toISOString().slice(0, 7)
  const { data: aiUsage } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('year_month', yearMonth)
    .single()

  // 壁打ちセッション（直近3件）
  const { data: wallSessions } = await supabase
    .from('wall_sessions')
    .select('id, summary, ai_type, is_active, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  // 未完了 ToDo
  const { data: todos } = await supabase
    .from('todos')
    .select('id, content, is_done, note_id, created_at')
    .eq('is_done', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const hasRecentNotes = (recentNotes ?? []).length > 0
  const hasProjects = (projects ?? []).length > 0
  const hasSessions = (wallSessions ?? []).length > 0
  const hasTodos = (todos ?? []).length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* ウェルカム */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            今日は {formatDate(new Date())} です
          </p>
        </div>
        <Link
          href="/notes/new"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 transition-all"
        >
          ＋ 新規ノート
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">ノート</p>
          <p className="text-xl font-bold">{(recentNotes ?? []).length}</p>
          <p className="text-xs text-muted-foreground">直近の更新</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">プロジェクト</p>
          <p className="text-xl font-bold">{(projects ?? []).length}</p>
          <p className="text-xs text-muted-foreground">進行中</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">AI使用量</p>
          <p className="text-xl font-bold">{aiUsage?.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">今月</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">未完了ToDo</p>
          <p className="text-xl font-bold">{(todos ?? []).length}</p>
          <p className="text-xs text-muted-foreground">件</p>
        </div>
      </div>

      {/* 最近のノート */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <span>📝</span> 最近のノート
          </h2>
          <Link href="/notes" className="text-xs text-muted-foreground hover:text-foreground underline">
            すべて見る
          </Link>
        </div>
        {hasRecentNotes ? (
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

      {/* プロジェクト */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <span>📁</span> プロジェクト
          </h2>
          <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground underline">
            すべて見る
          </Link>
        </div>
        {hasProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(projects ?? []).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block border rounded-lg p-3 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm truncate">{project.title}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {STATUS_LABELS[(project.status as ProjectStatus) ?? 'planning']}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.progress_percent}%` }}
                    />
                  </div>
                  <span>{project.progress_percent}%</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <p className="text-sm">プロジェクトを作成してアイデアを実行に移しましょう</p>
            <Link href="/projects/new" className="text-xs underline mt-1 inline-block">
              プロジェクトを作る
            </Link>
          </div>
        )}
      </section>

      {/* 壁打ちセッション */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <span>💬</span> 最近の壁打ち
          </h2>
          <Link href="/wall" className="text-xs text-muted-foreground hover:text-foreground underline">
            すべて見る
          </Link>
        </div>
        {hasSessions ? (
          <div className="space-y-2">
            {(wallSessions ?? []).map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 p-3 border rounded-md bg-card text-sm"
              >
                <span className="mt-0.5">
                  {session.is_active ? '🟢' : '⚪'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug truncate">
                    {session.summary || 'セッション進行中...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI: {session.ai_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
            壁打ちセッションがありません
          </p>
        )}
      </section>

      {/* 未完了 ToDo */}
      {hasTodos && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <span>✅</span> 未完了の ToDo
          </h2>
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
        </section>
      )}
    </div>
  )
}

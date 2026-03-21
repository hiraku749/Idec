import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoteCard } from '@/components/notes/note-card'
import { formatDate } from '@/lib/utils/format'
import {
  FileText,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Plus,
  Timer,
  Sparkles,
} from 'lucide-react'
import { DailyDigestBanner } from '@/components/shared/daily-digest-banner'
import { TodoCalendar } from '@/components/shared/todo-calendar'
import { TodoSection } from '@/components/dashboard/todo-section'
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

  // プロジェクト一覧
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
    .eq('user_id', user.id)
    .eq('is_done', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // カレンダー用：due: タグ付きノート
  const { data: dueDateNotes } = await supabase
    .from('notes')
    .select('id, title, user_tags')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .eq('tag', 'ToDo')
    .contains('user_tags', ['due:'])
    .order('updated_at', { ascending: false })
    .limit(50)

  // インキュベーション通知
  const { data: readyIncubations } = await supabase
    .from('incubations')
    .select('id, note_id, review_date, notes!inner(id, title)')
    .eq('user_id', user.id)
    .eq('status', 'incubating')
    .lte('review_date', new Date().toISOString())
    .limit(5)

  const hasRecentNotes = (recentNotes ?? []).length > 0
  const hasProjects = (projects ?? []).length > 0
  const hasSessions = (wallSessions ?? []).length > 0
  const hasTodos = (todos ?? []).length > 0
  const isFirstTime = !hasRecentNotes && !hasProjects && !hasSessions

  // due: タグからカレンダーイベントを生成
  const calendarEvents: { date: string; title: string; noteId: string }[] = []
  for (const note of dueDateNotes ?? []) {
    for (const tag of note.user_tags ?? []) {
      if (tag.startsWith('due:')) {
        const date = tag.slice(4)
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          calendarEvents.push({ date, title: note.title || '無題', noteId: note.id })
        }
      }
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* デイリーダイアリーバナー */}
      <DailyDigestBanner />

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
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          新規ノート
        </Link>
      </div>

      {/* オンボーディング（初回ユーザー向け） */}
      {isFirstTime && (
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5">
          <p className="text-3xl mb-3">Welcome to Idec!</p>
          <h2 className="text-lg font-bold mb-2">はじめてのノートを作成してみましょう</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Idecはノート・プロジェクト・AIを統合したナレッジワークスペースです。
            まずはノートを作成して、あなたのアイデアを記録しましょう。
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/notes/new"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-5 hover:bg-primary/80 transition-all"
            >
              最初のノートを作る
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center rounded-lg border text-sm font-medium h-9 px-5 hover:bg-accent transition-all"
            >
              プロジェクトを作る
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="border rounded-lg p-3 bg-card">
              <p className="text-sm font-medium mb-1">1. ノートを作成</p>
              <p className="text-xs text-muted-foreground">アイデアや情報をメモしましょう</p>
            </div>
            <div className="border rounded-lg p-3 bg-card">
              <p className="text-sm font-medium mb-1">2. AIに質問</p>
              <p className="text-xs text-muted-foreground">OwnAIがあなたのノートを元に回答します</p>
            </div>
            <div className="border rounded-lg p-3 bg-card">
              <p className="text-sm font-medium mb-1">3. プロジェクト化</p>
              <p className="text-xs text-muted-foreground">アイデアをプロジェクトにして実行に移しましょう</p>
            </div>
          </div>
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
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

      {/* ToDoカレンダー + インキュベーション通知 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodoCalendar events={calendarEvents} />

        {(readyIncubations ?? []).length > 0 && (
          <div className="border rounded-xl p-4 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
            <h2 className="text-sm font-medium flex items-center gap-1.5 mb-3">
              <Timer className="w-4 h-4 text-purple-500" />
              レビュー待ちのアイデア（{(readyIncubations ?? []).length}件）
            </h2>
            <div className="space-y-2">
              {(readyIncubations ?? []).map((inc) => (
                <Link
                  key={inc.id}
                  href="/incubator"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {(inc.notes as unknown as { title: string })?.title ?? '無題のノート'}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 最近のノート */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> 最近のノート
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
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
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
            <FolderKanban className="w-4 h-4" /> プロジェクト
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
            <MessageSquare className="w-4 h-4" /> 最近の壁打ち
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
                  <span className={`w-2 h-2 rounded-full shrink-0 ${session.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
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
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" /> 未完了の ToDo
            {hasTodos && (
              <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                {(todos ?? []).length}
              </span>
            )}
          </h2>
          <Link href="/notes?tag=ToDo" className="text-xs text-muted-foreground hover:text-foreground underline">
            すべて見る
          </Link>
        </div>
        <TodoSection
          initialTodos={(todos ?? []).map((t) => ({
            id: t.id,
            content: t.content,
            note_id: t.note_id,
            created_at: t.created_at,
          }))}
        />
      </section>
    </div>
  )
}

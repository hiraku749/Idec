import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelative, truncate } from '@/lib/utils/format'
import { tiptapToText } from '@/lib/utils/tiptap'
import {
  FileText,
  FolderKanban,
  Sparkles,
  Flame,
  Plus,
  Timer,
  MessageSquare,
  Lightbulb,
  Zap,
  Bot,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  CheckSquare,
} from 'lucide-react'
import { DailyDigestBanner } from '@/components/shared/daily-digest-banner'
import { DesktopPromoBanner } from '@/components/shared/desktop-promo-banner'
import { TodoCalendar } from '@/components/shared/todo-calendar'
import { TodoSection } from '@/components/dashboard/todo-section'
import { LiveClock, ActivityChart, AnimatedCount } from '@/components/dashboard/dashboard-client'
import type { ProjectStatus, TiptapContent } from '@/types'

// ---- Constants ----

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: '計画中',
  active: '進行中',
  completed: '完了',
  archived: 'アーカイブ',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const TAG_COLORS: Record<string, string> = {
  アイデア: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  情報: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  ToDo: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
}

const TAG_BORDERS: Record<string, string> = {
  アイデア: 'border-l-yellow-400',
  情報: 'border-l-blue-400',
  ToDo: 'border-l-green-400',
}

const DAILY_QUOTES = [
  '小さな一歩が、大きな変化を生む。',
  'アイデアは行動によって価値を持つ。',
  '今日の知識が、明日の創造力になる。',
  '完璧を目指すより、まず始めよう。',
  '思考を記録する者が、未来を創る。',
  '一つの良い問いが、百の答えを生む。',
  '積み重ねた知識は、やがて知恵になる。',
]

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

// ---- Helper functions ----

function getShortDayLabel(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]}`
}

function formatJapaneseDate(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const dow = WEEKDAY_NAMES[date.getDay()]
  return `${y}年${m}月${d}日（${dow}）`
}

function daysUntil(deadline: string): number {
  const target = new Date(deadline)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  // Get unique dates (YYYY-MM-DD), sorted descending
  const uniqueDays = Array.from(new Set(dates.map((d) => d.slice(0, 10)))).sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Streak must start from today or yesterday
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// ---- Page Component ----

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  // Parallel data fetching
  const [
    profileRes,
    recentNotesRes,
    totalNotesRes,
    todayNotesRes,
    projectsRes,
    aiUsageRes,
    streakNotesRes,
    activityNotesRes,
    wallSessionsRes,
    todosRes,
    dueDateNotesRes,
    readyIncubationsRes,
  ] = await Promise.all([
    // Profile
    supabase.from('profiles').select('display_name, plan').eq('id', user.id).single(),
    // Recent notes (6)
    supabase
      .from('notes')
      .select('id, title, tag, user_tags, content, is_pinned, updated_at')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(6),
    // Total notes count
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false),
    // Today's notes count
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .gte('created_at', todayStart),
    // Projects
    supabase
      .from('projects')
      .select('id, title, status, progress_percent, deadline, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6),
    // AI usage (this month)
    supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('year_month', now.toISOString().slice(0, 7))
      .single(),
    // Streak data (last 30 days of note activity)
    supabase
      .from('notes')
      .select('updated_at')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .gte('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: false }),
    // Activity data (last 7 days)
    supabase
      .from('notes')
      .select('updated_at')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .gte('updated_at', sevenDaysAgo),
    // Wall sessions
    supabase
      .from('wall_sessions')
      .select('id, summary, ai_type, is_active, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3),
    // Todos
    supabase
      .from('todos')
      .select('id, content, is_done, note_id, created_at')
      .eq('user_id', user.id)
      .eq('is_done', false)
      .order('created_at', { ascending: false })
      .limit(10),
    // Due date notes
    supabase
      .from('notes')
      .select('id, title, user_tags')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .eq('tag', 'ToDo')
      .contains('user_tags', ['due:'])
      .order('updated_at', { ascending: false })
      .limit(50),
    // Incubations
    supabase
      .from('incubations')
      .select('id, note_id, review_date, notes!inner(id, title)')
      .eq('user_id', user.id)
      .eq('status', 'incubating')
      .lte('review_date', now.toISOString())
      .limit(5),
  ])

  const profile = profileRes.data
  const recentNotes = recentNotesRes.data ?? []
  const totalNotes = totalNotesRes.count ?? 0
  const todayNotes = todayNotesRes.count ?? 0
  const projects = projectsRes.data ?? []
  const aiUsageCount = aiUsageRes.data?.count ?? 0
  const streakDates = (streakNotesRes.data ?? []).map((n) => n.updated_at)
  const activityNotes = activityNotesRes.data ?? []
  const wallSessions = wallSessionsRes.data ?? []
  const todos = todosRes.data ?? []
  const dueDateNotes = dueDateNotesRes.data ?? []
  const readyIncubations = readyIncubationsRes.data ?? []

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'ユーザー'
  const plan = (profile?.plan as string) ?? 'free'
  const planLimit = plan === 'pro' ? 500 : 30
  const streak = calculateStreak(streakDates)
  const activeProjects = projects.filter((p) => p.status === 'active')
  const dailyQuote = DAILY_QUOTES[now.getDay()]

  // Build 7-day activity data
  const activityMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    activityMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const note of activityNotes) {
    const day = note.updated_at.slice(0, 10)
    if (activityMap.has(day)) {
      activityMap.set(day, (activityMap.get(day) ?? 0) + 1)
    }
  }
  const activityData = Array.from(activityMap.entries()).map(([dateStr, count]) => ({
    label: getShortDayLabel(new Date(dateStr)),
    count,
  }))

  // Calendar events from due: tags
  const calendarEvents: { date: string; title: string; noteId: string }[] = []
  for (const note of dueDateNotes) {
    for (const tag of note.user_tags ?? []) {
      if (tag.startsWith('due:')) {
        const date = tag.slice(4)
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          calendarEvents.push({ date, title: note.title || '無題', noteId: note.id })
        }
      }
    }
  }

  const isFirstTime = recentNotes.length === 0 && projects.length === 0

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Banners */}
      <DesktopPromoBanner />
      <DailyDigestBanner />

      {/* ======== Hero Greeting ======== */}
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-purple-950/10 border border-blue-100/50 dark:border-blue-900/30 p-6 sm:p-8 animate-fade-in-up"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-transparent dark:from-blue-800/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                おかえりなさい、{displayName}さん
              </h1>
              <LiveClock />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatJapaneseDate(now)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground/80 italic max-w-md">
              &ldquo;{dailyQuote}&rdquo;
            </p>
          </div>
          <Link
            href="/notes/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium h-10 px-5 hover:bg-primary/80 transition-all active:scale-95 shadow-soft"
          >
            <Plus className="w-4 h-4" />
            新規ノート
          </Link>
        </div>
      </section>

      {/* ======== Onboarding (first-time) ======== */}
      {isFirstTime && (
        <section className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center bg-primary/5 animate-fade-in-up">
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
        </section>
      )}

      {/* ======== Stats Cards ======== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Notes */}
        <div
          className="group relative border rounded-xl p-4 sm:p-5 bg-card hover-lift shadow-soft overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-blue-400 to-blue-600" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            {todayNotes > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                +{todayNotes} 今日
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedCount value={totalNotes} />
          </p>
          <p className="text-xs text-muted-foreground mt-1">総ノート数</p>
        </div>

        {/* Active Projects */}
        <div
          className="group relative border rounded-xl p-4 sm:p-5 bg-card hover-lift shadow-soft overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <FolderKanban className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedCount value={activeProjects.length} />
          </p>
          <p className="text-xs text-muted-foreground mt-1">プロジェクト進行中</p>
        </div>

        {/* AI Usage */}
        <div
          className="group relative border rounded-xl p-4 sm:p-5 bg-card hover-lift shadow-soft overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '160ms' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-purple-400 to-purple-600" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100/60 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
              {plan === 'pro' ? 'Pro' : 'Free'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedCount value={aiUsageCount} />
            <span className="text-sm font-normal text-muted-foreground">/{planLimit}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">AI使用回数（今月）</p>
          {/* Usage bar */}
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-700"
              style={{ width: `${Math.min((aiUsageCount / planLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div
          className="group relative border rounded-xl p-4 sm:p-5 bg-card hover-lift shadow-soft overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '240ms' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-orange-400 to-red-500" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <Flame className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
            </div>
            {streak >= 7 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                {streak >= 30 ? 'Legend!' : 'On Fire!'}
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedCount value={streak} />
            <span className="text-sm font-normal text-muted-foreground">日</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">連続アクティブ</p>
        </div>
      </section>

      {/* ======== Activity Chart + Incubation ======== */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 7-day Activity */}
        <div
          className="lg:col-span-3 border rounded-xl p-5 bg-card shadow-soft animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              7日間のアクティビティ
            </h2>
            <span className="text-xs text-muted-foreground">
              合計 {activityNotes.length} 件
            </span>
          </div>
          <ActivityChart data={activityData} />
        </div>

        {/* Calendar + Incubation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '360ms' }}>
            <TodoCalendar events={calendarEvents} />
          </div>
          {readyIncubations.length > 0 && (
            <div
              className="border rounded-xl p-4 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 shadow-soft animate-fade-in-up"
              style={{ animationDelay: '420ms' }}
            >
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-purple-500" />
                レビュー待ち（{readyIncubations.length}件）
              </h2>
              <div className="space-y-2">
                {readyIncubations.map((inc) => (
                  <Link
                    key={inc.id}
                    href="/incubator"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">
                      {(inc.notes as unknown as { title: string })?.title ?? '無題のノート'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======== Quick Actions ======== */}
      <section
        className="animate-fade-in-up"
        style={{ animationDelay: '350ms' }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          クイックアクション
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: '/notes/new', icon: Plus, label: '新規ノート', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { href: '/notes?capture=true', icon: Lightbulb, label: 'クイックキャプチャ', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { href: '/agent', icon: Bot, label: 'OwnAI', color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
            { href: '/wall', icon: MessageSquare, label: 'ブレスト', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { href: '/enhance', icon: Sparkles, label: '文章増強', color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
          ].map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border ${action.bg} hover-lift shadow-soft transition-all`}
              style={{ animationDelay: `${400 + i * 60}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ======== Recent Notes ======== */}
      <section
        className="animate-fade-in-up"
        style={{ animationDelay: '450ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            最近のノート
          </h2>
          <Link
            href="/notes"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            すべて見る
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentNotes.map((note, i) => {
              const preview = tiptapToText((note.content ?? {}) as TiptapContent)
              return (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className={`group block border rounded-xl p-4 bg-card hover-lift shadow-soft transition-all border-l-[3px] ${
                    note.tag ? (TAG_BORDERS[note.tag] ?? 'border-l-border') : 'border-l-border'
                  } animate-fade-in-up`}
                  style={{ animationDelay: `${500 + i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {note.title || '無題のノート'}
                    </h3>
                    {note.is_pinned && (
                      <span className="text-xs text-muted-foreground shrink-0">📌</span>
                    )}
                  </div>
                  {preview && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {truncate(preview, 80)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-wrap gap-1">
                      {note.tag && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[note.tag] ?? ''}`}>
                          {note.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelative(note.updated_at)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">まだノートがありません</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">アイデアや情報を記録してみましょう</p>
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> 最初のノートを作る
            </Link>
          </div>
        )}
      </section>

      {/* ======== Active Projects ======== */}
      <section
        className="animate-fade-in-up"
        style={{ animationDelay: '500ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-500" />
            プロジェクト
          </h2>
          <Link
            href="/projects"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            すべて見る
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project, i) => {
              const status = (project.status as ProjectStatus) ?? 'planning'
              const deadline = project.deadline
              const daysLeft = deadline ? daysUntil(deadline) : null
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group block border rounded-xl p-4 bg-card hover-lift shadow-soft transition-all animate-fade-in-up"
                  style={{ animationDelay: `${550 + i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>進捗</span>
                      <span className="font-medium">{project.progress_percent}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          project.progress_percent >= 100
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                            : project.progress_percent >= 60
                              ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                              : 'bg-gradient-to-r from-blue-300 to-blue-400'
                        }`}
                        style={{ width: `${project.progress_percent}%` }}
                      />
                    </div>
                  </div>
                  {/* Deadline */}
                  {deadline && daysLeft !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <CalendarClock className="w-3 h-3 text-muted-foreground" />
                      <span
                        className={`text-[10px] font-medium ${
                          daysLeft < 0
                            ? 'text-red-500'
                            : daysLeft <= 3
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {daysLeft < 0
                          ? `${Math.abs(daysLeft)}日超過`
                          : daysLeft === 0
                            ? '今日が締切'
                            : `あと${daysLeft}日`}
                      </span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border rounded-xl bg-card">
            <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">プロジェクトを作成して実行に移しましょう</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> プロジェクトを作る
            </Link>
          </div>
        )}
      </section>

      {/* ======== Wall Sessions ======== */}
      {wallSessions.length > 0 && (
        <section
          className="animate-fade-in-up"
          style={{ animationDelay: '550ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-500" />
              最近の壁打ち
            </h2>
            <Link
              href="/wall"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              すべて見る
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {wallSessions.map((session) => (
              <Link
                key={session.id}
                href="/wall"
                className="flex items-start gap-3 p-3 border rounded-xl bg-card text-sm hover-lift shadow-soft transition-all"
              >
                <div className="mt-1 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${session.is_active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-muted-foreground/30'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug truncate font-medium">
                    {session.summary || 'セッション進行中...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI: {session.ai_type} -- {formatRelative(session.updated_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ======== Todos ======== */}
      <section
        className="animate-fade-in-up"
        style={{ animationDelay: '600ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-green-500" />
            未完了の ToDo
            {todos.length > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                {todos.length}
              </span>
            )}
          </h2>
          <Link
            href="/notes?tag=ToDo"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            すべて見る
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <TodoSection
          initialTodos={todos.map((t) => ({
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

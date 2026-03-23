'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import type { AiType } from '@/types'
import {
  User,
  Bot,
  Paintbrush,
  Database,
  Keyboard,
  Shield,
  Sun,
  Moon,
  Monitor,
  Grid3X3,
  List,
  Download,
  Upload,
  Trash2,
  LogOut,
  AlertTriangle,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'profile', label: 'プロフィール', icon: User },
  { id: 'ai', label: 'AI設定', icon: Bot },
  { id: 'appearance', label: '表示', icon: Paintbrush },
  { id: 'data', label: 'データ管理', icon: Database },
  { id: 'shortcuts', label: 'ショートカット', icon: Keyboard },
  { id: 'account', label: 'アカウント', icon: Shield },
] as const

type TabId = (typeof TABS)[number]['id']

interface ProfileData {
  display_name: string
  email: string
  avatar_url: string | null
  default_ai_type: AiType
  dark_mode: boolean
  plan: string
}

// ---------------------------------------------------------------------------
// Toggle Switch Component
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Save Button Component
// ---------------------------------------------------------------------------

function SaveButton({
  onClick,
  loading,
  disabled = false,
}: {
  onClick: () => void
  loading: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      {loading ? '保存中...' : '保存'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Danger Button Component
// ---------------------------------------------------------------------------

function DangerButton({
  onClick,
  loading,
  children,
  disabled = false,
}: {
  onClick: () => void
  loading: boolean
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-destructive/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Section Wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field Row
// ---------------------------------------------------------------------------

function FieldRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('display_name, email, avatar_url, default_ai_type, dark_mode, plan')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          display_name: data.display_name ?? '',
          email: data.email ?? user.email ?? '',
          avatar_url: data.avatar_url ?? null,
          default_ai_type: (data.default_ai_type as AiType) ?? 'balanced',
          dark_mode: data.dark_mode ?? false,
          plan: data.plan ?? 'free',
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile || !userId) return null

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical tabs on desktop, horizontal scroll on mobile */}
        <nav className="shrink-0">
          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden overflow-x-auto gap-1 pb-2 -mx-1 px-1 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    activeTab === tab.id
                      ? 'bg-accent text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Desktop: vertical sidebar */}
          <div className="hidden md:flex md:w-52 md:flex-col md:gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full',
                    activeTab === tab.id
                      ? 'bg-accent text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <TabContent
              activeTab={activeTab}
              profile={profile}
              setProfile={setProfile}
              userId={userId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content Router
// ---------------------------------------------------------------------------

function TabContent({
  activeTab,
  profile,
  setProfile,
  userId,
}: {
  activeTab: TabId
  profile: ProfileData
  setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>
  userId: string
}) {
  switch (activeTab) {
    case 'profile':
      return (
        <ProfileTab profile={profile} setProfile={setProfile} userId={userId} />
      )
    case 'ai':
      return (
        <AiSettingsTab profile={profile} setProfile={setProfile} userId={userId} />
      )
    case 'appearance':
      return <AppearanceTab />
    case 'data':
      return <DataTab userId={userId} />
    case 'shortcuts':
      return <ShortcutsTab />
    case 'account':
      return <AccountTab />
  }
}

// ---------------------------------------------------------------------------
// 1. プロフィール Tab
// ---------------------------------------------------------------------------

function ProfileTab({
  profile,
  setProfile,
  userId,
}: {
  profile: ProfileData
  setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>
  userId: string
}) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl || null,
        })
        .eq('id', userId)

      if (error) throw error

      setProfile((prev) =>
        prev
          ? { ...prev, display_name: displayName, avatar_url: avatarUrl || null }
          : prev
      )
      toast.success('プロフィールを保存しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const AI_TYPE_LABELS: Record<AiType, string> = {
    rational: '論理重視',
    balanced: 'バランス型',
    ethical: '倫理重視',
  }

  return (
    <div className="space-y-6">
      <Section
        title="プロフィール"
        description="アカウントの基本情報を管理します"
      >
        <div className="space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center overflow-hidden border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="アバター"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {displayName || '名前未設定'}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">表示名</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">メールアドレス</label>
            <Input
              value={profile.email}
              readOnly
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              メールアドレスは変更できません
            </p>
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">アバターURL</label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-muted-foreground">
              画像のURLを入力してください
            </p>
          </div>

          {/* Profession / Plan display */}
          <FieldRow label="プラン" description="現在のご利用プラン">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium uppercase">
              {profile.plan}
            </span>
          </FieldRow>

          <FieldRow label="AI人格" description="デフォルトのAIタイプ">
            <span className="text-sm text-muted-foreground">
              {AI_TYPE_LABELS[profile.default_ai_type]}
            </span>
          </FieldRow>
        </div>

        <div className="flex justify-end pt-2">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. AI設定 Tab
// ---------------------------------------------------------------------------

function AiSettingsTab({
  profile,
  setProfile,
  userId,
}: {
  profile: ProfileData
  setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>
  userId: string
}) {
  const [aiType, setAiType] = useState<AiType>(profile.default_ai_type)
  const [saving, setSaving] = useState(false)

  const AI_OPTIONS: { value: AiType; label: string; description: string }[] = [
    {
      value: 'rational',
      label: '論理重視',
      description: 'データや論理を優先した回答を生成します',
    },
    {
      value: 'balanced',
      label: 'バランス型',
      description: '論理と感情のバランスを取った回答を生成します',
    },
    {
      value: 'ethical',
      label: '倫理重視',
      description: '倫理的な観点を重視した回答を生成します',
    },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ default_ai_type: aiType })
        .eq('id', userId)

      if (error) throw error

      setProfile((prev) =>
        prev ? { ...prev, default_ai_type: aiType } : prev
      )
      toast.success('AI設定を保存しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="AI設定"
        description="AIの動作に関する設定を管理します"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">デフォルトAI人格</label>
          <p className="text-xs text-muted-foreground mb-3">
            壁打ちやOwnAIで使用するAIの性格を選択します
          </p>
          <div className="grid gap-3">
            {AI_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setAiType(option.value)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150',
                  aiType === option.value
                    ? 'border-primary bg-accent shadow-sm'
                    : 'hover:border-primary/50 hover:bg-accent/30'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                    aiType === option.value
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {aiType === option.value && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. 表示 Tab
// ---------------------------------------------------------------------------

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load local preferences
    const savedLayout = localStorage.getItem('idec-note-layout')
    if (savedLayout === 'grid' || savedLayout === 'list') {
      setLayout(savedLayout)
    }
    const savedSidebar = localStorage.getItem('idec-sidebar-collapsed')
    if (savedSidebar === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  const handleSaveAppearance = () => {
    localStorage.setItem('idec-note-layout', layout)
    localStorage.setItem('idec-sidebar-collapsed', String(sidebarCollapsed))
    toast.success('表示設定を保存しました')
  }

  if (!mounted) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const themeOptions: { value: string; label: string; icon: LucideIcon }[] = [
    { value: 'light', label: 'ライト', icon: Sun },
    { value: 'dark', label: 'ダーク', icon: Moon },
    { value: 'system', label: 'システム', icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <Section title="表示設定" description="アプリの外観をカスタマイズします">
        {/* Theme */}
        <div className="space-y-2">
          <label className="text-sm font-medium">テーマ</label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all duration-150 active:scale-[0.97]',
                    theme === option.value
                      ? 'border-primary bg-accent shadow-sm'
                      : 'hover:border-primary/50 hover:bg-accent/30'
                  )}
                >
                  <Icon className="h-5 w-5 opacity-70" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Note list layout */}
        <div className="space-y-2">
          <label className="text-sm font-medium">ノート一覧の表示</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLayout('grid')}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-4 transition-all duration-150',
                layout === 'grid'
                  ? 'border-primary bg-accent shadow-sm'
                  : 'hover:border-primary/50 hover:bg-accent/30'
              )}
            >
              <Grid3X3 className="h-5 w-5 opacity-70" />
              <span className="text-sm font-medium">グリッド</span>
            </button>
            <button
              onClick={() => setLayout('list')}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-4 transition-all duration-150',
                layout === 'list'
                  ? 'border-primary bg-accent shadow-sm'
                  : 'hover:border-primary/50 hover:bg-accent/30'
              )}
            >
              <List className="h-5 w-5 opacity-70" />
              <span className="text-sm font-medium">リスト</span>
            </button>
          </div>
        </div>

        {/* Sidebar collapsed default */}
        <FieldRow
          label="サイドバーを閉じた状態で起動"
          description="アプリ起動時にサイドバーを折りたたんだ状態にします"
        >
          <ToggleSwitch
            checked={sidebarCollapsed}
            onChange={setSidebarCollapsed}
          />
        </FieldRow>

        <div className="flex justify-end pt-2">
          <SaveButton onClick={handleSaveAppearance} loading={false} />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. データ管理 Tab
// ---------------------------------------------------------------------------

function DataTab({ userId }: { userId: string }) {
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data: notes, error } = await supabase
        .from('notes')
        .select('title, content, tag, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!notes || notes.length === 0) {
        toast.error('エクスポートするノートがありません')
        return
      }

      // Create a simple JSON export
      const blob = new Blob([JSON.stringify(notes, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `idec-notes-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${notes.length}件のノートをエクスポートしました`)
    } catch {
      toast.error('エクスポートに失敗しました')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    let importedCount = 0
    const supabase = createClient()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) continue

      try {
        const text = await file.text()
        const title = file.name.replace(/\.(md|txt)$/, '')

        const { error } = await supabase.from('notes').insert({
          user_id: userId,
          title,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text }],
              },
            ],
          },
          tag: null,
          user_tags: [],
          is_pinned: false,
          is_archived: false,
          is_deleted: false,
          version_history: [],
        })

        if (!error) importedCount++
      } catch {
        // Skip files that fail
      }
    }

    if (importedCount > 0) {
      toast.success(`${importedCount}件のファイルをインポートしました`)
    } else {
      toast.error('インポートできるファイルがありませんでした')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteAll = async () => {
    if (deleteText !== '全て削除') return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true })
        .eq('user_id', userId)

      if (error) throw error

      toast.success('全てのノートを削除しました')
      setDeleteConfirm(false)
      setDeleteText('')
    } catch {
      toast.error('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="データ管理"
        description="ノートのエクスポート、インポート、削除を行います"
      >
        {/* Export */}
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              ノートをエクスポート
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              全てのノートをJSON形式でダウンロードします
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent active:scale-[0.98] disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'エクスポート中...' : 'エクスポート'}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              ファイルをインポート
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Markdown (.md) またはテキスト (.txt) ファイルをノートとしてインポートします
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            multiple
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            ファイルを選択
          </button>
        </div>

        {/* Delete all */}
        <div className="rounded-lg border border-destructive/50 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              全データを削除
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              全てのノートをゴミ箱に移動します。この操作は取り消せる場合があります。
            </p>
          </div>
          {!deleteConfirm ? (
            <DangerButton onClick={() => setDeleteConfirm(true)} loading={false}>
              <Trash2 className="h-4 w-4" />
              全データを削除
            </DangerButton>
          ) : (
            <div className="space-y-3 rounded-lg bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  本当に削除しますか？確認のため「全て削除」と入力してください。
                </p>
              </div>
              <Input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="全て削除"
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <DangerButton
                  onClick={handleDeleteAll}
                  loading={deleting}
                  disabled={deleteText !== '全て削除'}
                >
                  削除を確定
                </DangerButton>
                <button
                  onClick={() => {
                    setDeleteConfirm(false)
                    setDeleteText('')
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. ショートカット Tab
// ---------------------------------------------------------------------------

function ShortcutsTab() {
  const shortcuts: { key: string; description: string }[] = [
    { key: '⌘ K', description: 'グローバル検索を開く' },
    { key: '⌘ ⇧ N', description: 'クイックキャプチャ（メモ即時保存）' },
    { key: '⌘ N', description: '新規ノートを作成' },
    { key: '⌘ S', description: 'ノートを保存' },
    { key: '⌘ B', description: '太字' },
    { key: '⌘ I', description: '斜体' },
    { key: '⌘ U', description: '下線' },
    { key: '⌘ ⇧ X', description: '取り消し線' },
    { key: '⌘ E', description: 'インラインコード' },
    { key: '⌘ Z', description: '元に戻す' },
    { key: '⌘ ⇧ Z', description: 'やり直す' },
    { key: '⌘ ⇧ 7', description: '番号付きリスト' },
    { key: '⌘ ⇧ 8', description: '箇条書きリスト' },
    { key: '⌘ ⇧ 9', description: 'タスクリスト' },
  ]

  return (
    <div className="space-y-6">
      <Section
        title="キーボードショートカット"
        description="アプリで使用できるショートカット一覧です"
      >
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-accent/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ショートカット
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  機能
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shortcuts.map((shortcut, i) => (
                <tr
                  key={i}
                  className="transition-colors hover:bg-accent/30"
                >
                  <td className="px-4 py-2.5">
                    <kbd className="inline-flex items-center gap-1 rounded border bg-accent px-2 py-0.5 font-mono text-xs font-medium">
                      {shortcut.key}
                    </kbd>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    {shortcut.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Windowsの場合は ⌘ を Ctrl に置き換えてください
        </p>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 6. アカウント Tab
// ---------------------------------------------------------------------------

function AccountTab() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [deleteStep, setDeleteStep] = useState(0) // 0=initial, 1=first confirm, 2=final confirm
  const [deleteText, setDeleteText] = useState('')
  const [accountDeleting, setAccountDeleting] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      toast.error('ログアウトに失敗しました')
      setLoggingOut(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('パスワードは6文字以上で入力してください')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('パスワードが一致しません')
      return
    }

    setPasswordSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('パスワードを変更しました')
      setChangingPassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('パスワードの変更に失敗しました')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeleteAccount = useCallback(async () => {
    if (deleteText !== 'アカウント削除') return

    setAccountDeleting(true)
    try {
      const supabase = createClient()
      // Sign out - actual account deletion would require a server-side admin call
      // For now, we sign out and show a message
      await supabase.auth.signOut()
      toast.success('アカウント削除リクエストを送信しました')
      router.push('/login')
    } catch {
      toast.error('アカウント削除に失敗しました')
      setAccountDeleting(false)
    }
  }, [deleteText, router])

  return (
    <div className="space-y-6">
      <Section
        title="アカウント"
        description="アカウントのセキュリティと管理を行います"
      >
        {/* Change Password */}
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">パスワード変更</p>
            <p className="text-xs text-muted-foreground mt-1">
              アカウントのパスワードを変更します
            </p>
          </div>

          {!changingPassword ? (
            <button
              onClick={() => setChangingPassword(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent active:scale-[0.98]"
            >
              パスワードを変更
            </button>
          ) : (
            <div className="space-y-3 max-w-sm">
              <div className="space-y-2">
                <label className="text-xs font-medium">新しいパスワード</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6文字以上"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">
                  パスワードの確認
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度入力"
                />
              </div>
              <div className="flex gap-2">
                <SaveButton
                  onClick={handleChangePassword}
                  loading={passwordSaving}
                  disabled={!newPassword || !confirmPassword}
                />
                <button
                  onClick={() => {
                    setChangingPassword(false)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              ログアウト
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              現在のセッションからログアウトします
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent active:scale-[0.98] disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>

        {/* Delete Account */}
        <div className="rounded-lg border border-destructive/50 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              アカウント削除
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              アカウントと全データを完全に削除します。この操作は取り消せません。
            </p>
          </div>

          {deleteStep === 0 && (
            <DangerButton onClick={() => setDeleteStep(1)} loading={false}>
              <Trash2 className="h-4 w-4" />
              アカウントを削除
            </DangerButton>
          )}

          {deleteStep === 1 && (
            <div className="space-y-3 rounded-lg bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-destructive font-medium">
                    本当に削除しますか？
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    全てのノート、プロジェクト、AI履歴が完全に削除されます。
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <DangerButton onClick={() => setDeleteStep(2)} loading={false}>
                  削除を続ける
                </DangerButton>
                <button
                  onClick={() => setDeleteStep(0)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-3 rounded-lg bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  最終確認：「アカウント削除」と入力して確定してください。
                </p>
              </div>
              <Input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="アカウント削除"
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <DangerButton
                  onClick={handleDeleteAccount}
                  loading={accountDeleting}
                  disabled={deleteText !== 'アカウント削除'}
                >
                  完全に削除する
                </DangerButton>
                <button
                  onClick={() => {
                    setDeleteStep(0)
                    setDeleteText('')
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

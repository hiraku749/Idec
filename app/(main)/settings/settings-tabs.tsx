'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const TABS = [
  { id: 'theme', label: 'テーマ' },
  { id: 'profile', label: 'プロフィール' },
] as const

type TabId = (typeof TABS)[number]['id']

interface SettingsTabsProps {
  displayName: string
  email: string
}

export function SettingsTabs({ displayName, email }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('theme')

  return (
    <div>
      {/* タブヘッダー */}
      <div className="flex border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'theme' && <ThemeTab />}
      {activeTab === 'profile' && <ProfileTab displayName={displayName} email={email} />}
    </div>
  )
}

function ThemeTab() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-20" />

  const options: { value: string; label: string; icon: LucideIcon }[] = [
    { value: 'light', label: 'ライト', icon: Sun },
    { value: 'dark', label: 'ダーク', icon: Moon },
    { value: 'system', label: 'システム', icon: Monitor },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">テーマ設定</h3>
        <p className="text-xs text-muted-foreground mb-4">
          アプリケーションの外観を切り替えます
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'border rounded-lg p-4 text-center transition-all duration-150 active:scale-95',
                theme === option.value
                  ? 'border-primary bg-accent shadow-sm'
                  : 'hover:border-primary/50'
              )}
            >
              <Icon className="w-6 h-6 mx-auto mb-1.5 opacity-70" />
              <p className="text-sm font-medium">{option.label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProfileTab({ displayName, email }: { displayName: string; email: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">プロフィール</h3>
        <p className="text-xs text-muted-foreground mb-4">
          アカウント情報の確認
        </p>
      </div>
      <div className="space-y-3">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">表示名</p>
          <p className="text-sm font-medium">{displayName || '未設定'}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">メールアドレス</p>
          <p className="text-sm font-medium">{email}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        プロフィール編集機能は今後のアップデートで追加予定です
      </p>
    </div>
  )
}

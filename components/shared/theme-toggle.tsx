'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button
        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70"
        disabled
      >
        <span>🌓</span>
        テーマ
      </button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-colors"
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      {isDark ? 'ライトモード' : 'ダークモード'}
    </button>
  )
}

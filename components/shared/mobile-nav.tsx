'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import type { Note } from '@/types'

interface MobileNavProps {
  recentNotes: Pick<Note, 'id' | 'title'>[]
}

export function MobileNav({ recentNotes }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="メニューを開く"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>

      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ドロワー */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar recentNotes={recentNotes} />
      </div>
    </>
  )
}

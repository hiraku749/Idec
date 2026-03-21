'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Link2 } from 'lucide-react'

interface NoteOption {
  id: string
  label: string
  tag: string | null
}

interface WikiLinkSuggestionListProps {
  items: NoteOption[]
  command: (item: NoteOption) => void
}

export interface WikiLinkSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const TAG_COLORS: Record<string, string> = {
  アイデア: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  情報: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ToDo: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

export const WikiLinkSuggestionList = forwardRef<WikiLinkSuggestionListRef, WikiLinkSuggestionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="wiki-link-popup">
          <p className="text-xs text-muted-foreground px-3 py-2">
            一致するノートがありません
          </p>
        </div>
      )
    }

    return (
      <div className="wiki-link-popup">
        <div className="px-2 py-1 border-b">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            ノートリンクを挿入
          </p>
        </div>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
            }`}
            onClick={() => command(item)}
          >
            <span className="truncate flex-1">{item.label}</span>
            {item.tag && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${TAG_COLORS[item.tag] ?? ''}`}>
                {item.tag}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  },
)

WikiLinkSuggestionList.displayName = 'WikiLinkSuggestionList'

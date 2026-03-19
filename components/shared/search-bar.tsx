'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { NoteTag } from '@/types'

const TAGS: NoteTag[] = ['アイデア', '情報', 'ToDo']

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const activeTag = searchParams.get('tag') as NoteTag | null

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder="ノートを検索..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          updateParams('search', e.target.value || null)
        }}
        className="sm:w-64"
      />

      <div className="flex gap-1">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => updateParams('tag', activeTag === tag ? null : tag)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeTag === tag
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

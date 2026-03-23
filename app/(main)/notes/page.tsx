import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoteList } from '@/components/notes/note-list'
import { SearchBar } from '@/components/shared/search-bar'
import { UrlClipButton } from '@/components/notes/url-clip-button'
import { ImportButton } from '@/components/notes/import-button'
import { Plus } from 'lucide-react'
import type { NoteTag } from '@/types'

interface PageProps {
  searchParams: {
    search?: string
    tag?: string
    is_archived?: string
    is_deleted?: string
  }
}

export default async function NotesPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isArchived = searchParams.is_archived === 'true'
  const isDeleted = searchParams.is_deleted === 'true'
  const tag = searchParams.tag as NoteTag | undefined
  const search = searchParams.search

  let query = supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, updated_at')
    .eq('user_id', user.id)
    .eq('is_archived', isArchived)
    .eq('is_deleted', isDeleted)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (tag) query = query.eq('tag', tag)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data: notes } = await query

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isDeleted ? 'ゴミ箱' : isArchived ? 'アーカイブ' : 'ノート'}
        </h1>
        {!isDeleted && !isArchived && (
          <div className="flex items-center gap-2">
            <ImportButton />
            <UrlClipButton />
            <Link
              href="/notes/new"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              新規作成
            </Link>
          </div>
        )}
      </div>

      <div className="mb-4">
        <SearchBar />
      </div>

      <NoteList notes={notes ?? []} />
    </main>
  )
}

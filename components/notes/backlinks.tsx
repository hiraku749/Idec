'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Link2, ArrowRight } from 'lucide-react'

interface BacklinksProps {
  noteId: string
}

interface LinkItem {
  noteId: string
  title: string
}

export function Backlinks({ noteId }: BacklinksProps) {
  const [forwardLinks, setForwardLinks] = useState<LinkItem[]>([])
  const [backLinks, setBackLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/note-links?noteId=${noteId}`)
      .then((r) => r.json())
      .then((data) => {
        setForwardLinks(data.forwardLinks ?? [])
        setBackLinks(data.backLinks ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [noteId])

  if (loading) return null

  const hasLinks = forwardLinks.length > 0 || backLinks.length > 0
  if (!hasLinks) return null

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" />
        リンク
      </h3>

      {forwardLinks.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">参照先</p>
          <div className="space-y-1">
            {forwardLinks.map((link) => (
              <Link
                key={link.noteId}
                href={`/notes/${link.noteId}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowRight className="w-3 h-3" />
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {backLinks.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">このノートを参照しているノート</p>
          <div className="space-y-1">
            {backLinks.map((link) => (
              <Link
                key={link.noteId}
                href={`/notes/${link.noteId}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

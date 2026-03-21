'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Check, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

interface Todo {
  id: string
  content: string
  note_id: string
  created_at: string
}

export function TodoSection({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  async function handleComplete(id: string) {
    setCompleting(id)
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'PATCH' })
      if (res.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== id))
      }
    } finally {
      setCompleting(null)
      setConfirming(null)
    }
  }

  if (todos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
        未完了のToDoはありません
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:border-primary/30 transition-colors"
        >
          {/* チェックボタン */}
          <button
            type="button"
            onClick={() => setConfirming(confirming === todo.id ? null : todo.id)}
            className="mt-0.5 w-5 h-5 rounded border-2 border-muted-foreground/40 hover:border-primary hover:bg-primary/10 transition-colors shrink-0 flex items-center justify-center"
            title="完了にする"
          >
            {completing === todo.id && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">{todo.content}</p>

            {/* 確認ダイアログ（インライン） */}
            {confirming === todo.id && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md">
                <span className="text-xs text-foreground">完了にしますか？</span>
                <button
                  type="button"
                  onClick={() => void handleComplete(todo.id)}
                  disabled={completing === todo.id}
                  className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  完了
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="text-xs px-2 py-0.5 rounded border hover:bg-accent transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mt-1">
              <Link
                href={`/notes/${todo.note_id}`}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
              >
                ノートを開く
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDate(new Date(todo.created_at))}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

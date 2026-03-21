import type { TiptapContent } from '@/types'

interface ExtractedTodo {
  content: string
  is_done: boolean
}

/**
 * Tiptap JSON から TaskList のアイテムを再帰的に抽出する
 */
export function extractTodosFromContent(content: TiptapContent): ExtractedTodo[] {
  const todos: ExtractedTodo[] = []

  function walk(node: Record<string, unknown>) {
    if (node.type === 'taskItem') {
      const checked = (node.attrs as Record<string, unknown> | undefined)?.checked === true
      const text = extractTextFromNode(node)
      if (text.trim()) {
        todos.push({ content: text.trim(), is_done: checked })
      }
    }
    const children = node.content as Record<string, unknown>[] | undefined
    if (Array.isArray(children)) {
      for (const child of children) {
        walk(child)
      }
    }
  }

  walk(content)
  return todos
}

function extractTextFromNode(node: Record<string, unknown>): string {
  if (node.type === 'text') {
    return (node.text as string) || ''
  }
  const children = node.content as Record<string, unknown>[] | undefined
  if (!Array.isArray(children)) return ''
  return children.map(extractTextFromNode).join('')
}

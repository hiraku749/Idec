import type { TiptapContent } from '@/types'

// Tiptap の JSON ノードを再帰的にテキストとして結合する
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>

  if (n.type === 'text' && typeof n.text === 'string') {
    return n.text
  }

  if (Array.isArray(n.content)) {
    return n.content.map(extractText).join('')
  }

  return ''
}

/**
 * Tiptap JSON → プレーンテキスト
 * ベクトル埋め込み生成・全文検索用
 */
export function tiptapToText(content: TiptapContent): string {
  if (!content || typeof content !== 'object') return ''
  const doc = content as Record<string, unknown>

  if (!Array.isArray(doc.content)) return ''

  return doc.content
    .map((node) => extractText(node))
    .filter(Boolean)
    .join('\n')
    .trim()
}

/**
 * 空の Tiptap ドキュメントを返す
 */
export function emptyTiptapContent(): TiptapContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  }
}

/**
 * ToDo テンプレート — タスクリスト付きの初期コンテンツ
 */
export function todoTiptapContent(): TiptapContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'タスク 1' }] }],
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'タスク 2' }] }],
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'タスク 3' }] }],
          },
        ],
      },
    ],
  }
}

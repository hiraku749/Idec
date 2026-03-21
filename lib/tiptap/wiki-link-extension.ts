// =================================================
// WikiLink — [[ノートタイトル]] 形式のノート間リンク拡張
// [[ と入力するとサジェストポップアップが表示され、
// ノートを選択すると [[タイトル]] が挿入される。
// =================================================

import { Mark, mergeAttributes } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'

export interface WikiLinkOptions {
  suggestion: Partial<SuggestionOptions>
  HTMLAttributes: Record<string, unknown>
}

// WikiLink Mark — [[タイトル]] を styled chip として描画する
export const WikiLink = Mark.create<WikiLinkOptions>({
  name: 'wikiLink',

  addOptions() {
    return {
      HTMLAttributes: {},
      suggestion: {
        char: '[[',
        pluginKey: undefined,
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: 'text',
                marks: [
                  {
                    type: 'wikiLink',
                    attrs: {
                      noteId: (props as { id: string; label: string }).id,
                      title: (props as { id: string; label: string }).label,
                    },
                  },
                ],
                text: `[[${(props as { id: string; label: string }).label}]]`,
              },
              { type: 'text', text: ' ' },
            ])
            .run()
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          const type = state.schema.marks.wikiLink
          return !!$from.parent.type.allowsMarkType(type)
        },
      },
    }
  },

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-note-id'),
        renderHTML: (attrs) => ({ 'data-note-id': attrs.noteId ?? '' }),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-title'),
        renderHTML: (attrs) => ({ 'data-title': attrs.title ?? '' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wiki-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-wiki-link': '',
        class: 'wiki-link',
      }),
      0,
    ]
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

// Tiptap JSON からウィキリンクの noteId を一覧抽出するユーティリティ
export function extractWikiLinkIds(content: Record<string, unknown>): string[] {
  const ids: string[] = []

  function walk(node: Record<string, unknown>) {
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks as Record<string, unknown>[]) {
        if (
          mark.type === 'wikiLink' &&
          mark.attrs &&
          typeof (mark.attrs as Record<string, unknown>).noteId === 'string'
        ) {
          const id = (mark.attrs as Record<string, string>).noteId
          if (id && !ids.includes(id)) ids.push(id)
        }
      }
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content as Record<string, unknown>[]) {
        walk(child)
      }
    }
  }

  walk(content)
  return ids
}

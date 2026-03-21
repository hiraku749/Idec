import { Node, mergeAttributes } from '@tiptap/react'

/**
 * トグルブロック — <details><summary>…</summary><div>…</div></details>
 *
 * content を 'block+' にして柔軟に子ノードを受け入れる。
 * detailsSummary / detailsContent は isolating: true にして
 * 内部でのキー操作がブロック外に漏れないようにする。
 */
export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'detailsSummary detailsContent',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.hasAttribute('open'),
        renderHTML: (attrs) => (attrs.open ? { open: '' } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'details' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes, { class: 'toggle-block' }), 0]
  },

  addKeyboardShortcuts() {
    return {
      // details 内で Enter を押したとき、detailsContent 内に新しい段落を作る
      Enter: ({ editor }) => {
        if (!editor.isActive('details')) return false
        return false // デフォルト動作に任せる
      },
    }
  },
})

export const DetailsSummary = Node.create({
  name: 'detailsSummary',
  content: 'inline*',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'summary' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes, { class: 'toggle-summary' }), 0]
  },

  addKeyboardShortcuts() {
    return {
      // summary 内で Enter を押したら detailsContent にフォーカス移動
      Enter: ({ editor }) => {
        if (!editor.isActive('detailsSummary')) return false
        // デフォルトのEnter処理で次ブロック（detailsContent）に移動
        return false
      },
    }
  },
})

export const DetailsContent = Node.create({
  name: 'detailsContent',
  content: 'block+',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-details-content]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-details-content': '', class: 'toggle-content' }), 0]
  },
})

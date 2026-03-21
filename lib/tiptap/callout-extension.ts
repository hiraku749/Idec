import { Node, mergeAttributes } from '@tiptap/react'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: '💡',
        parseHTML: (element) => element.getAttribute('data-emoji') || '💡',
        renderHTML: (attributes) => ({ 'data-emoji': attributes.emoji as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        class: 'callout',
      }),
      ['span', { class: 'callout-emoji', contenteditable: 'false' }, HTMLAttributes['data-emoji'] || '💡'],
      ['div', { class: 'callout-content' }, 0],
    ]
  },
})

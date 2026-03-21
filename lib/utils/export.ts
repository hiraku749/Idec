import type { TiptapContent } from '@/types'

/**
 * Tiptap JSON → Markdown 変換
 * サーバーサイドで使用（turndownは使わず自前で変換）
 */
export function tiptapToMarkdown(content: TiptapContent, title?: string): string {
  const lines: string[] = []

  if (title) {
    lines.push(`# ${title}`, '')
  }

  if (!content || typeof content !== 'object') return lines.join('\n')
  const doc = content as Record<string, unknown>
  if (!Array.isArray(doc.content)) return lines.join('\n')

  for (const node of doc.content) {
    lines.push(convertNode(node as Record<string, unknown>))
  }

  return lines.join('\n').trim() + '\n'
}

function convertNode(node: Record<string, unknown>, depth: number = 0): string {
  const type = node.type as string

  switch (type) {
    case 'heading': {
      const level = (node.attrs as Record<string, unknown>)?.level as number ?? 1
      const prefix = '#'.repeat(level)
      return `${prefix} ${extractInlineText(node)}\n`
    }

    case 'paragraph':
      return `${extractInlineText(node)}\n`

    case 'bulletList':
      return convertListItems(node, '- ', depth)

    case 'orderedList':
      return convertOrderedListItems(node, depth)

    case 'taskList':
      return convertTaskItems(node, depth)

    case 'blockquote': {
      const children = (node.content as Record<string, unknown>[]) ?? []
      return children
        .map((child) => `> ${convertNode(child, depth)}`)
        .join('')
    }

    case 'codeBlock': {
      const lang = (node.attrs as Record<string, unknown>)?.language ?? ''
      const code = extractInlineText(node)
      return `\`\`\`${lang}\n${code}\n\`\`\`\n`
    }

    case 'horizontalRule':
      return '---\n'

    case 'table':
      return convertTable(node)

    case 'callout': {
      const emoji = (node.attrs as Record<string, unknown>)?.emoji ?? '💡'
      const text = (node.content as Record<string, unknown>[])
        ?.map((child) => extractInlineText(child))
        .join(' ') ?? ''
      return `> ${emoji} ${text}\n`
    }

    default:
      return extractInlineText(node) + '\n'
  }
}

function extractInlineText(node: Record<string, unknown>): string {
  if (node.type === 'text') {
    let text = node.text as string
    const marks = (node.marks as Record<string, unknown>[]) ?? []

    for (const mark of marks) {
      switch (mark.type) {
        case 'bold':
          text = `**${text}**`
          break
        case 'italic':
          text = `*${text}*`
          break
        case 'strike':
          text = `~~${text}~~`
          break
        case 'code':
          text = `\`${text}\``
          break
        case 'link': {
          const href = (mark.attrs as Record<string, unknown>)?.href ?? ''
          text = `[${text}](${href})`
          break
        }
      }
    }

    return text
  }

  if (Array.isArray(node.content)) {
    return node.content.map((child: unknown) => extractInlineText(child as Record<string, unknown>)).join('')
  }

  return ''
}

function convertListItems(node: Record<string, unknown>, prefix: string, depth: number): string {
  const items = (node.content as Record<string, unknown>[]) ?? []
  const indent = '  '.repeat(depth)

  return items
    .map((item) => {
      const children = (item.content as Record<string, unknown>[]) ?? []
      const textParts: string[] = []
      const nestedLists: string[] = []

      for (const child of children) {
        if ((child.type as string) === 'bulletList' || (child.type as string) === 'orderedList') {
          nestedLists.push(convertNode(child, depth + 1))
        } else {
          textParts.push(extractInlineText(child))
        }
      }

      return `${indent}${prefix}${textParts.join('')}\n${nestedLists.join('')}`
    })
    .join('')
}

function convertOrderedListItems(node: Record<string, unknown>, depth: number): string {
  const items = (node.content as Record<string, unknown>[]) ?? []
  const indent = '  '.repeat(depth)

  return items
    .map((item, i) => {
      const children = (item.content as Record<string, unknown>[]) ?? []
      const text = children.map((c) => extractInlineText(c)).join('')
      return `${indent}${i + 1}. ${text}\n`
    })
    .join('')
}

function convertTaskItems(node: Record<string, unknown>, depth: number): string {
  const items = (node.content as Record<string, unknown>[]) ?? []
  const indent = '  '.repeat(depth)

  return items
    .map((item) => {
      const checked = (item.attrs as Record<string, unknown>)?.checked ? 'x' : ' '
      const children = (item.content as Record<string, unknown>[]) ?? []
      const text = children.map((c) => extractInlineText(c)).join('')
      return `${indent}- [${checked}] ${text}\n`
    })
    .join('')
}

function convertTable(node: Record<string, unknown>): string {
  const rows = (node.content as Record<string, unknown>[]) ?? []
  if (rows.length === 0) return ''

  const lines: string[] = []

  rows.forEach((row, rowIndex) => {
    const cells = (row.content as Record<string, unknown>[]) ?? []
    const cellTexts = cells.map((cell) => {
      const content = (cell.content as Record<string, unknown>[]) ?? []
      return content.map((c) => extractInlineText(c)).join('')
    })
    lines.push(`| ${cellTexts.join(' | ')} |`)

    // ヘッダー行の後にセパレータを追加
    if (rowIndex === 0) {
      lines.push(`| ${cellTexts.map(() => '---').join(' | ')} |`)
    }
  })

  return lines.join('\n') + '\n'
}

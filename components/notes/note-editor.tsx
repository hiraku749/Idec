'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import tippy, { type Instance } from 'tippy.js'
// --- 個別拡張（StarterKit を使わず明示的に追加） ---
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import BoldExt from '@tiptap/extension-bold'
import ItalicExt from '@tiptap/extension-italic'
import StrikeExt from '@tiptap/extension-strike'
import CodeExt from '@tiptap/extension-code'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import HardBreak from '@tiptap/extension-hard-break'
import History from '@tiptap/extension-history'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
// --- 追加拡張 ---
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import UnderlineExt from '@tiptap/extension-underline'
import LinkExt from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { common, createLowlight } from 'lowlight'
import { Callout } from '@/lib/tiptap/callout-extension'
import { Details, DetailsSummary, DetailsContent } from '@/lib/tiptap/details-extension'
import { WikiLink } from '@/lib/tiptap/wiki-link-extension'
import {
  WikiLinkSuggestionList,
  type WikiLinkSuggestionListRef,
} from './wiki-link-suggestion-list'
import { EditorToolbar } from './editor-toolbar'
import type { TiptapContent } from '@/types'

const lowlight = createLowlight(common)

export interface NoteOption {
  id: string
  label: string
  tag: string | null
}

interface NoteEditorProps {
  content: TiptapContent
  onChange: (content: TiptapContent) => void
  editable?: boolean
  noteOptions?: NoteOption[]  // ウィキリンクサジェスト用のノート一覧
}

export function NoteEditor({ content, onChange, editable = true, noteOptions = [] }: NoteEditorProps) {
  const noteOptionsRef = useRef(noteOptions)
  noteOptionsRef.current = noteOptions

  // extensions は一度だけ生成する（毎 render で再生成すると tiptap v3 が
  // options 変更を検知して suggestion plugin が再初期化され、items の
  // クロージャが意図しないタイミングで評価されるため useMemo で固定する）
  const extensions = useMemo(() => [
    // コア（必須）
    Document,
    Paragraph,
    Text,
    // マーク（インライン書式）
    BoldExt,
    ItalicExt,
    StrikeExt,
    CodeExt,
    UnderlineExt,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    LinkExt.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { class: 'editor-link' },
    }),
    // ブロック
    Heading.configure({ levels: [1, 2, 3] }),
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    TaskItem.configure({ nested: true }),
    Blockquote,
    HorizontalRule,
    CodeBlockLowlight.configure({ lowlight }),
    HardBreak,
    // テーブル
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    // 画像
    Image.configure({ inline: false, allowBase64: true }),
    // テキスト配置
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    // カスタム
    Callout,
    Details,
    DetailsSummary,
    DetailsContent,
    // ウィキリンク [[]] サジェスト
    WikiLink.configure({
      HTMLAttributes: {},
      suggestion: {
        char: '[[',
        items: ({ query }: { query: string }) => {
          // noteOptionsRef は毎 render で .current が更新されるため、
          // useMemo 内でも常に最新のノートリストを参照できる
          return noteOptionsRef.current
            .filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8)
        },
        render: () => {
          let component: ReactRenderer<WikiLinkSuggestionListRef>
          let popup: Instance[]

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(WikiLinkSuggestionList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) return

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate: (props: SuggestionProps) => {
              component.updateProps(props)
              if (!props.clientRect) return
              popup[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              })
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide()
                return true
              }
              return component.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              popup[0]?.destroy()
              component.destroy()
            },
          }
        },
      },
    }),
    // ユーティリティ
    History,
    Dropcursor,
    Gapcursor,
    Placeholder.configure({ placeholder: 'ここにノートを書いてください... （[[ でノートリンクを挿入）' }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: content as Parameters<typeof useEditor>[0]['content'],
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as TiptapContent)
    },
  })

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor || !editable) return
      const target = e.target as HTMLElement
      if (target.closest('.tiptap')) return
      editor.chain().focus('end').run()
    },
    [editor, editable],
  )

  return (
    <div className="note-editor-wrapper">
      {editor && editable && <EditorToolbar editor={editor} />}
      <div
        className="note-editor-content prose prose-sm dark:prose-invert max-w-none"
        onClick={handleWrapperClick}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

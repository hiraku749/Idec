'use client'

import { useState, useCallback, useEffect, useReducer, useRef, type MouseEvent } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Palette,
  Highlighter,
  CodeSquare,
  Undo2,
  Redo2,
  RemoveFormatting,
  ChevronDown,
  MessageSquareQuote,
  ToggleRight,
  Table as TableIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Indent,
  Outdent,
  Columns3,
  RowsIcon,
  Trash2,
  Mic,
  MicOff,
  ScanText,
} from 'lucide-react'
import { useSpeechInput } from '@/lib/hooks/use-speech-input'

interface EditorToolbarProps {
  editor: Editor
}

const TEXT_COLORS = [
  { name: '黒（デフォルト）', value: '#000000' },
  { name: '赤', value: '#dc2626' },
  { name: '橙', value: '#ea580c' },
  { name: '黄', value: '#ca8a04' },
  { name: '緑', value: '#16a34a' },
  { name: '青', value: '#2563eb' },
  { name: '紫', value: '#9333ea' },
  { name: '灰', value: '#6b7280' },
]

const HIGHLIGHT_COLORS = [
  { name: 'なし', value: '' },
  { name: '赤', value: '#fecaca' },
  { name: '橙', value: '#fed7aa' },
  { name: '黄', value: '#fef08a' },
  { name: '緑', value: '#bbf7d0' },
  { name: '青', value: '#bfdbfe' },
  { name: '紫', value: '#e9d5ff' },
  { name: '灰', value: '#e5e7eb' },
]

const CODE_LANGUAGES = [
  { label: 'プレーン', value: '' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'python' },
  { label: 'JSON', value: 'json' },
  { label: 'SQL', value: 'sql' },
  { label: 'Bash', value: 'bash' },
  { label: 'Markdown', value: 'markdown' },
]

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    onClick()
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-30 ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5" />
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const interimRef = useRef('')

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  // 音声入力: 確定テキストをエディタに挿入
  const handleSpeechResult = useCallback((text: string) => {
    // 暫定テキストが表示されていれば先に削除してから確定テキストを挿入
    editor.chain().focus().insertContent(text + '。').run()
    interimRef.current = ''
  }, [editor])

  const { status: speechStatus, start: startSpeech, isSupported: speechSupported } = useSpeechInput({
    onResult: handleSpeechResult,
  })

  // OCR: 画像ファイルを選択してテキスト抽出
  const [ocrLoading, setOcrLoading] = useState(false)
  const ocrInputRef = useRef<HTMLInputElement>(null)

  const handleOcrFile = useCallback(async (file: File) => {
    setOcrLoading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1] ?? '')
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const data = await res.json() as { text?: string }
      if (data.text && data.text !== 'テキストなし') {
        editor.chain().focus().insertContent('\n' + data.text + '\n').run()
      }
    } catch {
      // OCR失敗は静かに処理
    } finally {
      setOcrLoading(false)
      if (ocrInputRef.current) ocrInputRef.current.value = ''
    }
  }, [editor])

  useEffect(() => {
    const handler = () => forceUpdate()
    editor.on('transaction', handler)
    return () => {
      editor.off('transaction', handler)
    }
  }, [editor])

  const iconSize = 16

  const closeAllPopups = useCallback(() => {
    setShowColorPicker(false)
    setShowHighlightPicker(false)
    setShowLinkInput(false)
    setShowImageInput(false)
    setShowTableMenu(false)
  }, [])

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setShowLinkInput(false)
      return
    }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    const { from, to } = editor.state.selection
    if (from === to) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const insertImage = useCallback(() => {
    if (!imageUrl) {
      setShowImageInput(false)
      return
    }
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setShowImageInput(false)
  }, [editor, imageUrl])

  const isInTable = editor.isActive('table')

  return (
    <div
      className="border-b px-2 py-1.5 flex flex-wrap items-center gap-0.5 bg-muted/30 sticky top-0 z-10"
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT') {
          e.preventDefault()
        }
      }}
    >
      {/* ===== 行1: 基本書式 ===== */}

      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="元に戻す">
        <Undo2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="やり直し">
        <Redo2 size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="太字 (⌘B)">
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="斜体 (⌘I)">
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="下線 (⌘U)">
        <Underline size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="取り消し線">
        <Strikethrough size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="インラインコード">
        <Code size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Text color */}
      <div className="relative">
        <ToolbarButton
          onClick={() => { closeAllPopups(); setShowColorPicker(!showColorPicker) }}
          title="文字色"
        >
          <div className="flex items-center gap-0.5">
            <Palette size={iconSize} />
            <ChevronDown size={10} />
          </div>
        </ToolbarButton>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 z-20 flex gap-1">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (c.value === '#000000') {
                    editor.chain().focus().unsetColor().run()
                  } else {
                    editor.chain().focus().setColor(c.value).run()
                  }
                  setShowColorPicker(false)
                }}
                className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative">
        <ToolbarButton
          onClick={() => { closeAllPopups(); setShowHighlightPicker(!showHighlightPicker) }}
          isActive={editor.isActive('highlight')}
          title="背景色"
        >
          <div className="flex items-center gap-0.5">
            <Highlighter size={iconSize} />
            <ChevronDown size={10} />
          </div>
        </ToolbarButton>
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 z-20 flex gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value || 'none'}
                type="button"
                title={c.name}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (!c.value) {
                    editor.chain().focus().unsetHighlight().run()
                  } else {
                    editor.chain().focus().toggleHighlight({ color: c.value }).run()
                  }
                  setShowHighlightPicker(false)
                }}
                className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value || 'transparent' }}
              >
                {!c.value && <span className="text-xs text-muted-foreground">✕</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Text alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="左揃え">
        <AlignLeft size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="中央揃え">
        <AlignCenter size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="右揃え">
        <AlignRight size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Indent */}
      <ToolbarButton
        onClick={() => {
          if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
            editor.chain().focus().sinkListItem('listItem').run()
          }
        }}
        disabled={!(editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList'))}
        title="字下げ"
      >
        <Indent size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) {
            editor.chain().focus().liftListItem('listItem').run()
          }
        }}
        disabled={!(editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList'))}
        title="字上げ"
      >
        <Outdent size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="見出し1">
        <Heading1 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="見出し2">
        <Heading2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="見出し3">
        <Heading3 size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="箇条書き">
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="番号付きリスト">
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="チェックリスト">
        <ListChecks size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Block elements */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="引用">
        <Quote size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="区切り線">
        <Minus size={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="コードブロック">
        <CodeSquare size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          editor.chain().focus().insertContent({
            type: 'callout',
            attrs: { emoji: '💡' },
            content: [{ type: 'paragraph' }],
          }).run()
        }}
        isActive={editor.isActive('callout')}
        title="コールアウト"
      >
        <MessageSquareQuote size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          editor.chain().focus().insertContent({
            type: 'details',
            content: [
              { type: 'detailsSummary', content: [{ type: 'text', text: 'トグル' }] },
              { type: 'detailsContent', content: [{ type: 'paragraph' }] },
            ],
          }).run()
        }}
        isActive={editor.isActive('details')}
        title="トグルリスト"
      >
        <ToggleRight size={iconSize} />
      </ToolbarButton>

      <Divider />

      {/* Table */}
      <div className="relative">
        <ToolbarButton
          onClick={() => { closeAllPopups(); setShowTableMenu(!showTableMenu) }}
          isActive={isInTable}
          title="テーブル"
        >
          <div className="flex items-center gap-0.5">
            <TableIcon size={iconSize} />
            <ChevronDown size={10} />
          </div>
        </ToolbarButton>
        {showTableMenu && (
          <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-1.5 z-20 min-w-[160px]">
            {!isInTable ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                  setShowTableMenu(false)
                }}
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-foreground/5 flex items-center gap-2"
              >
                <TableIcon size={14} /> 3×3 テーブルを挿入
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false) }}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-foreground/5 flex items-center gap-2"
                >
                  <Columns3 size={14} /> 列を追加
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); setShowTableMenu(false) }}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-foreground/5 flex items-center gap-2"
                >
                  <RowsIcon size={14} /> 行を追加
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); setShowTableMenu(false) }}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-foreground/5 text-destructive flex items-center gap-2"
                >
                  <Columns3 size={14} /> 列を削除
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); setShowTableMenu(false) }}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-foreground/5 text-destructive flex items-center gap-2"
                >
                  <RowsIcon size={14} /> 行を削除
                </button>
                <div className="border-t my-1" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); setShowTableMenu(false) }}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-foreground/5 text-destructive flex items-center gap-2"
                >
                  <Trash2 size={14} /> テーブルを削除
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative">
        <ToolbarButton
          onClick={() => { closeAllPopups(); setShowImageInput(!showImageInput) }}
          title="画像を挿入"
        >
          <ImageIcon size={iconSize} />
        </ToolbarButton>
        {showImageInput && (
          <div
            className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 z-20 flex gap-1"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              type="url"
              placeholder="画像URLを入力..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') insertImage()
                if (e.key === 'Escape') { setShowImageInput(false); editor.chain().focus().run() }
              }}
              className="text-sm border rounded px-2 py-1 bg-background w-52 outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertImage() }}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80"
            >
              挿入
            </button>
          </div>
        )}
      </div>

      {/* Link */}
      <div className="relative">
        {editor.isActive('link') ? (
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} isActive title="リンク解除">
            <Unlink size={iconSize} />
          </ToolbarButton>
        ) : (
          <ToolbarButton
            onClick={() => { closeAllPopups(); setShowLinkInput(!showLinkInput) }}
            title="リンク挿入"
          >
            <LinkIcon size={iconSize} />
          </ToolbarButton>
        )}
        {showLinkInput && (
          <div
            className="absolute top-full right-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 z-20 flex gap-1"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setLink()
                if (e.key === 'Escape') { setShowLinkInput(false); editor.chain().focus().run() }
              }}
              className="text-sm border rounded px-2 py-1 bg-background w-48 outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setLink() }}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80"
            >
              適用
            </button>
          </div>
        )}
      </div>

      <Divider />

      {/* Clear formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="書式クリア">
        <RemoveFormatting size={iconSize} />
      </ToolbarButton>

      {/* 音声入力 */}
      {speechSupported && (
        <>
          <Divider />
          <button
            type="button"
            title={speechStatus === 'listening' ? '録音停止' : '音声入力'}
            onMouseDown={(e) => {
              e.preventDefault()
              startSpeech()
            }}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${
              speechStatus === 'listening'
                ? 'bg-red-500 text-white animate-pulse shadow-sm'
                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            {speechStatus === 'listening' ? (
              <><MicOff size={iconSize} /> 停止</>
            ) : (
              <><Mic size={iconSize} /></>
            )}
          </button>
        </>
      )}

      {/* 画像OCR */}
      <>
        <input
          ref={ocrInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleOcrFile(file)
          }}
        />
        <button
          type="button"
          title="画像からテキストを読み取り（OCR）"
          disabled={ocrLoading}
          onMouseDown={(e) => {
            e.preventDefault()
            ocrInputRef.current?.click()
          }}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${
            ocrLoading
              ? 'text-muted-foreground opacity-60 cursor-wait'
              : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
          }`}
        >
          <ScanText size={iconSize} />
          {ocrLoading && <span>解析中...</span>}
        </button>
      </>

      {/* Code block language selector (contextual) */}
      {editor.isActive('codeBlock') && (
        <>
          <Divider />
          <select
            value={(editor.getAttributes('codeBlock').language as string) || ''}
            onChange={(e) => editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()}
            className="text-xs border rounded px-1.5 py-1 bg-background outline-none"
            title="コードブロックの言語"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}

'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import type { TiptapContent } from '@/types'

interface NoteEditorProps {
  content: TiptapContent
  onChange: (content: TiptapContent) => void
  editable?: boolean
}

export function NoteEditor({ content, onChange, editable = true }: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'ここにノートを書いてください...' }),
    ],
    content: content as Parameters<typeof useEditor>[0]['content'],
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapContent)
    },
  })

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none min-h-[300px]">
      <EditorContent editor={editor} />
    </div>
  )
}

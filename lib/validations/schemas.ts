import { z } from 'zod'

const noteTagSchema = z.union([z.literal('アイデア'), z.literal('情報'), z.literal('ToDo')])

// ノート作成
export const createNoteSchema = z.object({
  title: z.string().max(200, 'タイトルは200文字以内で入力してください'),
  content: z.record(z.string(), z.unknown()).default({}),
  tag: noteTagSchema.optional(),
  user_tags: z.array(z.string().max(50)).max(10).optional().default([]),
  project_id: z.string().uuid().optional(),
  parent_note_id: z.string().uuid().optional(),
})

// ノート更新
export const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tag: noteTagSchema.nullable().optional(),
  user_tags: z.array(z.string().max(50)).max(10).optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>

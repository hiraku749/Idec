// =================================================
// アイデアインキュベーター パイプライン
// 寝かせたアイデアをAIが新しい視点で再分析
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNote, searchNotesByVector } from '../retrieve'
import { estimateTokens, notesToContextBlocks } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { IncubatorInput, ToolResult, ContextBlock } from '../types'

interface IncubatorReview {
  newPerspectives: string[]
  relatedIdeas: string[]
  developmentSuggestions: string[]
  summary: string
}

export const runIncubator = async (
  input: IncubatorInput
): Promise<ToolResult<IncubatorReview>> => {
  try {
    const note = await fetchNote(input.userId, input.noteId)
    if (!note) {
      return { success: false, error: 'ノートが見つかりません', tokensUsed: 0, stubbed: true }
    }

    // インキュベーション期間中に作成された関連ノートを検索
    const relatedNotes = await searchNotesByVector({
      userId: input.userId,
      query: note.content,
      limit: 5,
    })

    // 対象ノート自身を除外
    const otherNotes = relatedNotes.filter((r) => r.noteId !== input.noteId)

    const blocks: ContextBlock[] = []

    const noteText = `【インキュベーション対象: ${note.title}】\n${note.content}`
    blocks.push({
      role: 'retrieved',
      label: `対象ノート: ${note.title}`,
      content: noteText,
      tokenEstimate: estimateTokens(noteText),
      priority: 10,
    })

    if (otherNotes.length > 0) {
      blocks.push(...notesToContextBlocks(otherNotes, 5))
    }

    const context = assembleContext(blocks, TOKEN_BUDGET.incubator)

    const response = await callAi({
      tool: 'incubator',
      context,
      userMessage: [
        'このアイデアは一定期間「寝かせて」ありました。新鮮な目で再分析してください。',
        '関連ノートがあれば、それらとの繋がりも考慮してください。',
        '',
        '以下のJSON形式で返してください：',
        '{',
        '  "newPerspectives": ["新しい視点1", "新しい視点2"],',
        '  "relatedIdeas": ["関連するアイデアとの繋がり1"],',
        '  "developmentSuggestions": ["発展提案1", "発展提案2"],',
        '  "summary": "全体のまとめ"',
        '}',
      ].join('\n'),
      aiType: input.aiType,
      customInstruction: input.customInstruction,
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        success: true,
        data: {
          newPerspectives: [],
          relatedIdeas: [],
          developmentSuggestions: [],
          summary: response.content,
        },
        tokensUsed: response.tokensUsed,
        stubbed: response.stubbed,
      }
    }

    const parsed = JSON.parse(jsonMatch[0]) as IncubatorReview

    return {
      success: true,
      data: {
        newPerspectives: Array.isArray(parsed.newPerspectives) ? parsed.newPerspectives : [],
        relatedIdeas: Array.isArray(parsed.relatedIdeas) ? parsed.relatedIdeas : [],
        developmentSuggestions: Array.isArray(parsed.developmentSuggestions) ? parsed.developmentSuggestions : [],
        summary: parsed.summary || '',
      },
      tokensUsed: response.tokensUsed,
      stubbed: response.stubbed,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '不明なエラー',
      tokensUsed: 0,
      stubbed: true,
    }
  }
}

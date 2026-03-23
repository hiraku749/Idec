// =================================================
// SWOT分析ジェネレーター パイプライン
// ノート/プロジェクトを基にSWOT分析を自動生成
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNote, fetchProjectWithNotes } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { incrementUsage } from '../output'
import type { SwotInput, ToolResult, ContextBlock } from '../types'

interface SwotData {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export const runSwot = async (
  input: SwotInput
): Promise<ToolResult<SwotData>> => {
  try {
    const blocks: ContextBlock[] = []

    // プロジェクト指定時はプロジェクト+関連ノートを取得
    if (input.projectId) {
      const result = await fetchProjectWithNotes(input.userId, input.projectId)
      if (result) {
        const projectText = `【プロジェクト: ${result.project.title}】\n目標: ${result.project.goal}\n説明: ${result.project.description}`
        blocks.push({
          role: 'retrieved',
          label: `プロジェクト: ${result.project.title}`,
          content: projectText,
          tokenEstimate: estimateTokens(projectText),
          priority: 10,
        })
        result.notes.forEach((note) => {
          const text = `【関連ノート: ${note.title}】\n${note.content}`
          blocks.push({
            role: 'retrieved',
            label: note.title,
            content: text,
            tokenEstimate: estimateTokens(text),
            priority: 5,
          })
        })
      }
    }

    // ノート指定時
    const note = await fetchNote(input.userId, input.noteId)
    if (!note && blocks.length === 0) {
      return { success: false, error: '対象が見つかりません', tokensUsed: 0, stubbed: true }
    }

    if (note) {
      const text = `【対象ノート: ${note.title}】\n${note.content}`
      blocks.push({
        role: 'retrieved',
        label: `対象ノート: ${note.title}`,
        content: text,
        tokenEstimate: estimateTokens(text),
        priority: 10,
      })
    }

    const context = assembleContext(blocks, TOKEN_BUDGET.swot)

    const response = await callAi({
      tool: 'swot',
      context,
      userMessage: [
        '上記のアイデア/プロジェクトに対してSWOT分析を行い、JSON形式で返してください。',
        '各項目は3〜5個の具体的なポイントを含めてください。',
        '',
        '以下のJSON形式のみを返してください：',
        '{"strengths": ["強み1", "強み2", "強み3"], "weaknesses": ["弱み1", "弱み2"], "opportunities": ["機会1", "機会2"], "threats": ["脅威1", "脅威2"]}',
      ].join('\n'),
      aiType: input.aiType,
      customInstruction: input.customInstruction,
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: 'AIからの応答をパースできませんでした', tokensUsed: response.tokensUsed, stubbed: response.stubbed }
    }

    const parsed = JSON.parse(jsonMatch[0]) as SwotData

    return {
      success: true,
      data: {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
        threats: Array.isArray(parsed.threats) ? parsed.threats : [],
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

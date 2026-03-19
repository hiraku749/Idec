// =================================================
// ロードマップ パイプライン
// プロジェクトからステップ生成
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchProjectWithNotes } from '../retrieve'
import { notesToContextBlocks, projectToContextBlock } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { executeOutputAction, incrementUsage } from '../output'
import type { RoadmapInput, ToolResult, VectorSearchResult } from '../types'

export const runRoadmap = async (
  input: RoadmapInput
): Promise<ToolResult<{ roadmapId: string; structuredText: string }>> => {
  try {
    // 1. プロジェクトとノート取得
    const result = await fetchProjectWithNotes(input.userId, input.projectId)
    if (!result) {
      return {
        success: false,
        error: 'プロジェクトが見つかりません',
        tokensUsed: 0,
        stubbed: true,
      }
    }

    // 2. コンテキスト組み立て
    const projectBlock = projectToContextBlock(result.project, 20)
    const noteResults: VectorSearchResult[] = result.notes.map((n) => ({
      noteId: n.noteId,
      title: n.title,
      content: n.content,
      similarity: 1,
    }))
    const noteBlocks = notesToContextBlocks(noteResults, 10)
    const context = assembleContext(
      [projectBlock, ...noteBlocks],
      TOKEN_BUDGET.roadmap
    )

    // 3. AI呼び出し
    const response = await callAi({
      tool: 'roadmap',
      context,
      userMessage:
        'このプロジェクトの実行ロードマップを作成してください。具体的なステップ、順序、依存関係を含めてください。',
      aiType: input.aiType,
    })

    // 4. 使用回数カウント
    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    // 5. ロードマップ保存
    const saved = await executeOutputAction(input.userId, {
      type: 'save-roadmap',
      projectId: input.projectId,
      title: `${result.project.title} — ロードマップ`,
      steps: [], // TODO: AI応答をパースしてステップに分解
      structuredText: response.content,
    })

    return {
      success: true,
      data: { roadmapId: saved.id, structuredText: response.content },
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

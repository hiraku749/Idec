// =================================================
// アイデア統合 パイプライン
// 複数ノートの共通テーマ・矛盾点・シナジーを分析し統合ドキュメント生成
// =================================================

import { TOKEN_BUDGET } from '../config'
import { fetchNotes } from '../retrieve'
import { estimateTokens } from '../transform'
import { assembleContext } from '../context'
import { callAi } from '../ai'
import { executeOutputAction, incrementUsage } from '../output'
import type { SynthesisInput, ToolResult, ContextBlock } from '../types'

export const runSynthesis = async (
  input: SynthesisInput
): Promise<ToolResult<{ noteId: string; content: string }>> => {
  try {
    if (input.noteIds.length < 2) {
      return { success: false, error: '2つ以上のノートを選択してください', tokensUsed: 0, stubbed: true }
    }
    if (input.noteIds.length > 5) {
      return { success: false, error: 'ノートは5つまで選択できます', tokensUsed: 0, stubbed: true }
    }

    const notes = await fetchNotes(input.userId, input.noteIds)
    if (notes.length === 0) {
      return { success: false, error: 'ノートが見つかりません', tokensUsed: 0, stubbed: true }
    }

    const blocks: ContextBlock[] = notes.map((note, i) => {
      const text = `【ノート${i + 1}: ${note.title}】\n${note.content}`
      return {
        role: 'retrieved' as const,
        label: `ノート${i + 1}: ${note.title}`,
        content: text,
        tokenEstimate: estimateTokens(text),
        priority: 10,
      }
    })

    const context = assembleContext(blocks, TOKEN_BUDGET.synthesis)

    const response = await callAi({
      tool: 'synthesis',
      context,
      userMessage: [
        '上記の複数ノートを分析し、以下の構造で統合レポートを作成してください：',
        '',
        '## 共通テーマ',
        '各ノートに共通するテーマ・コンセプト',
        '',
        '## 相違点・矛盾点',
        'ノート間の視点の違いや矛盾する点',
        '',
        '## シナジー・統合提案',
        'これらのアイデアを組み合わせることで生まれる新しい価値',
        '',
        '## アクションアイテム',
        '次のステップとして取るべき具体的な行動',
      ].join('\n'),
      aiType: input.aiType,
    })

    if (!response.stubbed) {
      await incrementUsage(input.userId)
    }

    const titles = notes.map((n) => n.title).join(' + ')
    const result = await executeOutputAction(input.userId, {
      type: 'create-note',
      title: `統合レポート: ${titles}`,
      content: response.content,
      tag: 'アイデア',
    })

    return {
      success: true,
      data: { noteId: result.id, content: response.content },
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

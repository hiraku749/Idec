# app/api/swot/route.ts

## このファイルは何をするのか
SWOT分析を生成するAPIエンドポイント。

## なぜこのファイルが必要なのか
フロントエンドからAI SWOT分析を安全に実行するための窓口。ノートIDに加え、オプションでプロジェクトIDも指定でき、より広い文脈での分析が可能。

## コードの概要
- **POST**: `noteId`（必須）、`projectId`（任意）、`aiType` をZodでバリデーション
- `runSwot()` パイプラインを実行し、4象限（strengths/weaknesses/opportunities/threats）のJSON結果を返却
- エラー時は500ステータスとエラーメッセージを返却

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `@/lib/pipeline`（runSwot）, `zod`
- 使われているもの: `app/(main)/swot/page.tsx`

## 関連ファイル
- `lib/pipeline/tools/swot.ts` — SWOT分析パイプラインの実装
- `app/(main)/swot/page.tsx` — SWOT分析の4象限UIページ

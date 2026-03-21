# app/api/scoring/route.ts

## このファイルは何をするのか
アイデアスコアリング機能のAPIエンドポイント。POST でスコアリング実行、GET でスコア取得。

## なぜこのファイルが必要なのか
フロントエンドからAIスコアリングを安全に実行するため。サーバー側で認証・バリデーション・AI処理・DB保存を一括で行う窓口。

## コードの概要
- **POST**: Zodで `noteId` と `aiType` をバリデーション後、`runScoring()` パイプラインを実行。結果を `note_scores` テーブルにupsert（既存スコアは上書き）
- **GET**: `noteId` パラメータ付きなら特定ノートのスコアを返却、なしなら全スコアをノートタイトル付きで返却
- upsertが失敗した場合のフォールバックとしてinsertも試行する安全設計

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `@/lib/pipeline`（runScoring）, `zod`
- 使われているもの: `app/(main)/scoring/page.tsx`

## 関連ファイル
- `lib/pipeline/tools/scoring.ts` — スコアリングパイプラインの実装
- `app/(main)/scoring/page.tsx` — スコアリングUIページ

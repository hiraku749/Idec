# app/api/synthesis/route.ts

## このファイルは何をするのか
複数ノートのアイデア統合を実行するAPIエンドポイント。

## なぜこのファイルが必要なのか
フロントエンドからAI統合分析を安全に実行するための窓口。認証・バリデーション・パイプライン実行をサーバー側で処理する。

## コードの概要
- **POST**: `noteIds`（UUID配列、2〜5個）と `aiType` をZodでバリデーション
- `runSynthesis()` パイプラインを実行し、統合レポートの内容と新規作成されたノートIDを返却
- エラー時は500ステータスとエラーメッセージを返却

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `@/lib/pipeline`（runSynthesis）, `zod`
- 使われているもの: `app/(main)/synthesis/page.tsx`

## 関連ファイル
- `lib/pipeline/tools/synthesis.ts` — 統合パイプラインの実装
- `app/(main)/synthesis/page.tsx` — ノート選択・統合結果表示のUIページ

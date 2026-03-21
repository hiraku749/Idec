# app/api/digest/route.ts

## このファイルは何をするのか
デイリーダイジェスト（今日のまとめ）を生成するAPIエンドポイント。

## なぜこのファイルが必要なのか
フロントエンドのダイジェストウィジェットから安全にAIダイジェスト生成を呼び出すため。認証チェック・バリデーション・パイプライン実行をサーバー側で処理する。

## コードの概要
- **POST**: `aiType` のみをバリデーション（デフォルト: balanced）
- `runDigest()` パイプラインにユーザーIDとAIタイプを渡して実行
- 成功時はサマリーと提案リストのJSONを返却

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `@/lib/pipeline`（runDigest）, `zod`
- 使われているもの: `components/shared/daily-digest.tsx`

## 関連ファイル
- `lib/pipeline/tools/digest.ts` — ダイジェスト生成パイプラインの実装
- `components/shared/daily-digest.tsx` — ダイジェスト表示UIウィジェット

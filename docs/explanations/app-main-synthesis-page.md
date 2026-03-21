# app/(main)/synthesis/page.tsx

## このファイルは何をするのか
複数ノートを選択してAIに統合分析させ、統合レポートを生成するページ。

## なぜこのファイルが必要なのか
アイデア統合機能のフロントエンドUI。ノートの複数選択、分析実行、結果表示、生成されたレポートノートへの遷移を提供する。

## コードの概要
- ノート一覧を `/api/notes` で取得し、チェックボックス付きリストで表示
- `toggleNote()` で選択状態を管理（最大5件まで）
- 統合ボタンクリックで `/api/synthesis` にPOSTリクエスト
- 結果の `content`（Markdown形式テキスト）を簡易パースして見出し・リスト・段落に分けて表示
- 「ノートを開く」ボタンで生成されたレポートノートの詳細ページに遷移

## 依存関係
- 使っているもの: `react`, `next/navigation`, `@/components/ui/button`, `lucide-react`
- 使われているもの: サイドバーナビゲーション

## 関連ファイル
- `app/api/synthesis/route.ts` — 統合APIエンドポイント
- `lib/pipeline/tools/synthesis.ts` — 統合パイプライン

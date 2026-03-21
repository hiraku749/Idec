# app/(main)/swot/page.tsx

## このファイルは何をするのか
ノートを基にAIがSWOT分析を生成し、4象限UIで結果を表示するページ。

## なぜこのファイルが必要なのか
SWOT分析機能のフロントエンドUI。ノート選択、分析実行、4象限の色分け表示、結果のノート保存までをワンストップで提供する。

## コードの概要
- `QUADRANTS` 配列で4象限（Strengths/Weaknesses/Opportunities/Threats）の表示設定（ラベル・色）を定義
- URLパラメータ `noteId` で初期選択ノートを設定可能（他ページからの遷移用）
- 分析結果を4色の枠（青・赤・緑・黄）で表示
- `handleSaveAsNote()` で分析結果をTiptap JSON形式に変換し、ノートとして保存後に詳細ページへ遷移

## 依存関係
- 使っているもの: `react`, `next/navigation`, `@/components/ui/button`, `lucide-react`
- 使われているもの: サイドバーナビゲーション、ノート詳細ページからのリンク

## 関連ファイル
- `app/api/swot/route.ts` — SWOT分析APIエンドポイント
- `lib/pipeline/tools/swot.ts` — SWOT分析パイプライン

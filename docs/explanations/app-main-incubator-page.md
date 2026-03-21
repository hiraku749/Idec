# app/(main)/incubator/page.tsx

## このファイルは何をするのか
インキュベーション中のアイデア一覧を管理し、レビュー可能なものをAIレビューするページ。

## なぜこのファイルが必要なのか
インキュベーター機能のフロントエンドUI。寝かせ中のアイデアの残日数表示、レビュー可能になったアイデアのAIレビュー実行、結果表示を提供する。

## コードの概要
- `/api/incubator` からインキュベーション一覧を取得し、レビュー日が過ぎたもの（ready）と待機中のもの（waiting）に分類
- readyなアイテムは黄色の背景で強調表示し、「AIレビュー実行」ボタンを表示
- waitingなアイテムは残日数（`daysLeft`）を計算して表示
- レビュー結果は「新しい視点」「関連アイデア」「発展提案」「サマリー」の4セクションで表示
- `formatDate()` ユーティリティで日付をフォーマット

## 依存関係
- 使っているもの: `react`, `next/navigation`, `@/components/ui/button`, `lucide-react`, `@/lib/utils/format`
- 使われているもの: サイドバーナビゲーション

## 関連ファイル
- `app/api/incubator/route.ts` — インキュベーターAPIエンドポイント
- `lib/pipeline/tools/incubator.ts` — インキュベーターパイプライン

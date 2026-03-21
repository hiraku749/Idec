# lib/utils/export.ts

## このファイルは何をするのか
Tiptap JSON形式のリッチテキストをMarkdown形式に変換するエクスポートユーティリティ。

## なぜこのファイルが必要なのか
ノートのエクスポート機能（Markdown形式）を実現するため。Tiptapエディタの内部JSONを人間が読めるMarkdownに変換する必要がある。turndownライブラリに依存せず自前で変換することで、カスタム拡張（Calloutなど）にも対応。

## コードの概要
- `tiptapToMarkdown()` がメイン関数。TiptapのJSONドキュメントを走査し、各ノード型に応じたMarkdownに変換
- `convertNode()` でheading/paragraph/bulletList/codeBlock/table等をswitch文で処理
- `extractInlineText()` がテキストノードのマーク（bold/italic/strike/code/link）をMarkdown記法に変換
- リストはネスト対応（depth引数でインデント管理）、テーブルはパイプ記法で出力

## 依存関係
- 使っているもの: `@/types`（TiptapContent型）
- 使われているもの: `app/api/export/route.ts`

## 関連ファイル
- `app/api/export/route.ts` — Markdown/Text/HTMLエクスポートのAPIエンドポイント
- `lib/utils/tiptap.ts` — プレーンテキスト変換（`tiptapToText`）を提供する類似ユーティリティ
- `components/notes/export-button.tsx` — エクスポートボタンUI

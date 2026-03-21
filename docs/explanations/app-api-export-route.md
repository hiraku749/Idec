# app/api/export/route.ts

## このファイルは何をするのか
ノートをMarkdown / テキスト / HTML形式でファイルダウンロードするためのAPIエンドポイント。

## なぜこのファイルが必要なのか
ユーザーがノートの内容を外部ファイルとしてエクスポートするため。フォーマット変換とContent-Dispositionヘッダーの設定をサーバー側で行い、ブラウザにファイルダウンロードを促す。

## コードの概要
- **GET**: `noteId` と `format`（markdown/text/html）のクエリパラメータを受け取る
- `markdown`: `tiptapToMarkdown()` でMarkdown変換し、`.md` ファイルとして返却
- `text`: `tiptapToText()` でプレーンテキスト変換し、`.txt` ファイルとして返却
- `html`: 簡易HTMLテンプレートにプレーンテキストを埋め込み、`.html` ファイルとして返却
- ファイル名は `Content-Disposition` ヘッダーでURLエンコードして設定

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `@/lib/utils/tiptap`, `@/lib/utils/export`, `@/types`
- 使われているもの: `components/notes/export-button.tsx`

## 関連ファイル
- `lib/utils/export.ts` — Markdown変換ロジック
- `lib/utils/tiptap.ts` — プレーンテキスト変換ロジック
- `components/notes/export-button.tsx` — エクスポートボタンUI

# components/notes/export-button.tsx

## このファイルは何をするのか
ノートをMarkdown / テキスト / HTML形式でダウンロードするエクスポートボタン。

## なぜこのファイルが必要なのか
ノートの内容をIdec外で利用したい場合（共有・バックアップ・他ツールへの移行）にファイルとしてダウンロードできる機能が必要。

## コードの概要
- ドロップダウンメニューで3つのフォーマット（Markdown, テキスト, HTML）を選択可能
- 選択すると `/api/export?noteId=xxx&format=xxx` にGETリクエストを送信
- レスポンスのBlobを一時URLに変換し、`<a>` タグの `download` 属性でファイルダウンロードを実行
- `Content-Disposition` ヘッダーからファイル名を取得

## 依存関係
- 使っているもの: `react`, `lucide-react`
- 使われているもの: ノート詳細ページ（`app/(main)/notes/[id]/page.tsx`）

## 関連ファイル
- `app/api/export/route.ts` — エクスポートAPIエンドポイント
- `lib/utils/export.ts` — Markdown変換ロジック
- `lib/utils/tiptap.ts` — プレーンテキスト変換ロジック

# components/notes/version-diff.tsx

## このファイルは何をするのか
ノートの過去バージョンと現在の内容をテキスト差分で比較表示するコンポーネント。

## なぜこのファイルが必要なのか
ノートの編集履歴を確認し、何がいつ変更されたかを把握するため。追加部分は緑、削除部分は赤でハイライトされ、変更箇所が一目でわかる。

## コードの概要
- `currentContent` と `versionHistory`（TiptapContent配列）をpropsで受け取る
- `tiptapToText()` でリッチテキストをプレーンテキストに変換後、`diff-match-patch` ライブラリで差分計算
- `diff-match-patch` は動的インポート（`import()`）で遅延読み込みし、初期バンドルサイズを抑制
- 差分結果をHTML（`<ins>` / `<del>` タグ）に変換し、`dangerouslySetInnerHTML` で表示
- バージョンをプルダウンで切り替え可能

## 依存関係
- 使っているもの: `react`, `lucide-react`, `@/lib/utils/tiptap`, `diff-match-patch`（動的インポート）, `@/types`
- 使われているもの: ノート詳細ページ（`app/(main)/notes/[id]/page.tsx`）

## 関連ファイル
- `lib/utils/tiptap.ts` — `tiptapToText()` でTiptap JSONからプレーンテキストへ変換

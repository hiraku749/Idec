# components/notes/backlinks.tsx

## このファイルは何をするのか
ノート間の前方リンク（参照先）と後方リンク（被参照）を表示するコンポーネント。

## なぜこのファイルが必要なのか
ノート間のリンク関係を可視化することで、知識のネットワークを把握できる。Wikiのようなバックリンク機能により、あるノートがどこから参照されているかを確認でき、情報の発見性が向上する。

## コードの概要
- `noteId` をpropsで受け取り、`/api/note-links` からリンクデータを取得
- `forwardLinks`（このノートが参照しているノート）と `backLinks`（このノートを参照しているノート）を分けて表示
- リンクがない場合は何も表示しない（`null` を返す）
- 各リンクは `next/link` でノート詳細ページへ遷移可能

## 依存関係
- 使っているもの: `react`, `next/link`, `lucide-react`
- 使われているもの: ノート詳細ページ（`app/(main)/notes/[id]/page.tsx`）

## 関連ファイル
- `app/api/note-links/route.ts` — リンクデータ取得API
- `app/(main)/graph/page.tsx` — グラフでリンク関係を可視化するページ

# components/notes/url-clip-button.tsx

## このファイルは何をするのか

URLを入力するとWebページの内容をAIが要約し、ノートとして自動保存するモーダルコンポーネント。

## なぜこのファイルが必要なのか

情報収集・リサーチ時に「URLをコピーしてノートアプリを開いて貼り付けて要約する」という手間を1クリックに短縮するため。

## コードの各部分の解説

1. ボタンクリック → モーダルが開く
2. URLを入力 → `POST /api/clip` を呼ぶ
3. API が Claude でページを要約 → Tiptap JSON コンテンツを返す
4. `POST /api/notes` でノートを保存（タグ: 情報、user_tags に `source:URL`）
5. 作成されたノート詳細ページへ遷移

## 依存関係

- 使っているもの: `app/api/clip/route.ts`、`app/api/notes/route.ts`、`next/navigation`
- 使われているもの: `app/(main)/notes/page.tsx`

## 関連ファイル

- `app/api/clip/route.ts` — URL取得 + Claude要約ロジック

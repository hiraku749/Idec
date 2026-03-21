# app/api/note-links/route.ts

## このファイルは何をするのか
ノート間リンクの取得（GET）・作成（POST）・一括更新（PUT）を提供するAPIエンドポイント。

## なぜこのファイルが必要なのか
ノート同士の参照関係（前方リンク・後方リンク）を管理するため。Wiki的な `[[ノート名]]` 記法でリンクを張り、ナレッジグラフやバックリンク表示に活用する。

## コードの概要
- **GET**: `noteId` パラメータで指定されたノートの前方リンク（参照先）と後方リンク（被参照）をJOINで取得し、タイトル付きで返却
- **POST**: `sourceNoteId` と `targetNoteId` で単一リンクを作成（自己参照は拒否）。upsertで重複防止
- **PUT**: バッチ更新。`sourceNoteId` の既存リンクを全削除し、`targetNoteIds` 配列で新しいリンクを一括作成。ノート保存時の `[[]]` パース結果を反映する用途

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `zod`
- 使われているもの: `components/notes/backlinks.tsx`, ノート保存処理

## 関連ファイル
- `components/notes/backlinks.tsx` — バックリンク表示UI
- `app/(main)/graph/page.tsx` — ナレッジグラフでリンクを可視化
- `app/api/graph/route.ts` — グラフデータ取得API

# app/api/notes/ — 解説（全3ファイル）

このドキュメントは以下3ファイルをまとめて解説する：
- `app/api/notes/route.ts` — ノート一覧取得・作成
- `app/api/notes/[id]/route.ts` — ノート詳細・更新・削除
- `app/api/notes/[id]/restore/route.ts` — ゴミ箱から復元

---

## API Route とは

`app/api/` フォルダ内のファイルはページではなく **サーバー側の処理（API）**。
ブラウザからHTTPリクエスト（GET・POST等）が来ると、対応する関数が実行される。

```
GET  /api/notes       → GET関数 実行
POST /api/notes       → POST関数 実行
GET  /api/notes/abc   → GET関数 実行（params.id = "abc"）
PATCH /api/notes/abc  → PATCH関数 実行
```

---

## ノート一覧取得 — GET /api/notes

```typescript
export async function GET(request: Request) {
  // 1. 認証チェック
  // 2. クエリパラメータを読み取る（検索・タグフィルター）
  // 3. Supabaseからノートを取得
  // 4. JSONで返す
}
```

URL例：`/api/notes?search=アイデア&tag=ToDo&is_archived=false`

クエリパラメータ（`?key=value` の部分）で絞り込みができる。

---

## ノート作成 — POST /api/notes

```typescript
export async function POST(request: Request) {
  // 1. 認証チェック
  // 2. リクエストボディをZodでバリデーション
  // 3. タイトル+本文をプレーンテキストに変換
  // 4. OpenAI Embeddings でベクトル生成
  // 5. Supabaseにノートを保存（ベクトルも一緒に）
}
```

ノートを保存するときは**自動でベクトル埋め込みも生成**する。

---

## ノート更新 — PATCH /api/notes/[id]

```typescript
// コンテンツが変わるとき
if (updates.content !== undefined) {
  // 旧バージョンを version_history に追加（最大20世代）
  // ベクトルを再生成
}
```

本文を変更するたびに：
1. 古い内容を `version_history`（履歴）に追加
2. 新しい内容でベクトルを再生成

---

## 論理削除 — DELETE /api/notes/[id]

```typescript
.update({ is_deleted: true })   // 実際には消さず「削除フラグ」を立てる
```

**論理削除** = DBからデータを消さず、`is_deleted = true` にするだけ。
ゴミ箱から復元できるようにするため。

---

## バージョン履歴

```typescript
const history = [...current.version_history]
updates.version_history = [current.content, ...history].slice(0, 20)
```

- 更新のたびに「今の内容」を履歴の先頭に追加
- 最大20世代保持
- 最終的に `notes.version_history` (JSONB配列) に保存される

---

## 依存関係（全ファイル共通）

**使っているもの：**
- `@/lib/supabase/server` — DBアクセス
- `@/lib/validations/schemas` — リクエスト検証
- `@/lib/pgvector/embed` — ベクトル生成
- `@/lib/utils/tiptap` — テキスト変換

**使われているもの：**
- `app/(main)/notes/` — 各ページがfetch()で呼び出す
- `components/notes/note-editor.tsx` — 保存時に呼び出す

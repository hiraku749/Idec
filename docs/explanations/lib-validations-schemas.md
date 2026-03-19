# lib/validations/schemas.ts — 解説

## このファイルは何をするのか

APIに送られてくるデータが「正しい形式かどうか」をチェックするルールを定義する。
Zodというライブラリを使って、実行時にデータを検証する。

---

## なぜこのファイルが必要なのか

ユーザーからAPIに届くデータは信用できない。
例えば「タイトルは200文字以内」という制限があっても、悪意ある人が1万文字を送ってくるかもしれない。
このファイルのスキーマで事前にチェックし、おかしければエラーを返す。

---

## コードの解説

### Zodとは

Zodは「バリデーション（入力チェック）ライブラリ」。
TypeScriptの型定義と、実行時のチェックを同時にできるのが特徴。

```typescript
const schema = z.object({
  title: z.string().max(200),    // 文字列・最大200文字
  tag: z.union([...]).optional() // ユニオン型・省略可
})

// 使い方
const result = schema.safeParse(requestBody)
if (!result.success) {
  // エラー → result.error にエラー内容が入る
}
// 成功 → result.data に型安全なデータが入る
```

---

### createNoteSchema

```typescript
export const createNoteSchema = z.object({
  title: z.string().max(200, 'タイトルは200文字以内で入力してください'),
  content: z.record(z.string(), z.unknown()).default({}),
  tag: noteTagSchema.optional(),           // 省略可
  user_tags: z.array(z.string()).max(10).optional().default([]),
  project_id: z.string().uuid().optional(), // UUID形式の文字列
  parent_note_id: z.string().uuid().optional(),
})
```

**ノート作成**のときにリクエストボディを検証するスキーマ。

- `.max(200)` — 最大文字数制限
- `.optional()` — 省略可能
- `.default({})` — 省略されたときのデフォルト値
- `.uuid()` — UUID形式（`"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`）かチェック

---

### updateNoteSchema

**ノート更新**のスキーマ。全フィールドが `.optional()`（部分更新を許可）。

```typescript
tag: noteTagSchema.nullable().optional()
```

- `.nullable()` — null も許可（タグを「なし」にするため）
- `.optional()` — そもそも送らなくてもよい

つまり `tag: null`（タグ削除）も `tag: 'アイデア'`（タグ設定）も `tag` なし（変更しない）もすべてOK。

---

### z.infer で型を取り出す

```typescript
export type CreateNoteInput = z.infer<typeof createNoteSchema>
```

Zodスキーマから TypeScript の型を自動生成している。
これで `types/index.ts` と二重管理せずに済む。

---

## 依存関係

**このファイルが使っているもの：**
- `zod` — バリデーションライブラリ

**このファイルを使っているもの：**
- `app/api/notes/route.ts` — ノート作成時の検証
- `app/api/notes/[id]/route.ts` — ノート更新時の検証

---

## 関連ファイル

| ファイル | 関係 |
|---------|------|
| `types/index.ts` | DBベースの型定義（Zodなしの純粋なTypeScript型）|
| `app/api/notes/route.ts` | このスキーマを使ってリクエストを検証する |

# types/index.ts — 解説

## このファイルは何をするのか

プロジェクト全体で使う「型定義」をまとめたファイル。DBのテーブル構造と1対1で対応している。

---

## なぜこのファイルが必要なのか

TypeScript では「この変数はどんなデータが入るか」を事前に宣言する。
この宣言がないと、コードを書くときに補完が効かず、間違ったデータを渡してもエラーになりにくい。

型定義を一か所にまとめることで、**どこからでも同じ定義を参照**できる。

---

## コードの解説

### interface（インターフェース）とは

```typescript
export interface Note {
  id: string
  title: string
  content: TiptapContent
  is_pinned: boolean
  // ...
}
```

「`Note` 型の変数には `id`（文字列）・`title`（文字列）・... が入っている」と宣言している。
これを `interface`（インターフェース）と呼ぶ。

---

### `| null` の意味

```typescript
project_id: string | null
```

「`project_id` は文字列か null（値なし）のどちらかが入る」という意味。
DBで `NULL` を許容している列に対応している。

---

### 型エイリアス（type）

```typescript
export type NoteTag = 'アイデア' | '情報' | 'ToDo'
```

「`NoteTag` 型は `'アイデア'` か `'情報'` か `'ToDo'` の文字列のみ」という意味。
この3つ以外の文字列を代入しようとするとTypeScriptがエラーを出してくれる。

---

### TiptapContent

```typescript
export type TiptapContent = Record<string, unknown>
```

Tiptap エディタが出力する JSON の型。
`Record<string, unknown>` は「文字列キーに何でも入るオブジェクト」を意味する。
Tiptap の JSON 形式は複雑なので、詳細な型付けをせず `unknown` にしている。

---

## 依存関係

**このファイルが使っているもの：** なし（外部ライブラリに依存しない純粋な型定義）

**このファイルを使っているもの（import するもの）：**
- `lib/validations/schemas.ts` — Zodスキーマの型参照
- `app/api/notes/` — API Routeのリクエスト・レスポンス型
- `components/notes/` — コンポーネントのProps型
- `app/(main)/notes/` — ページコンポーネント

---

## DBスキーマとの対応

| interface | DBテーブル |
|-----------|-----------|
| `Profile` | `public.profiles` |
| `Note` | `public.notes` |
| `Todo` | `public.todos` |
| `Project` | `public.projects` |
| `AiUsage` | `public.ai_usage` |

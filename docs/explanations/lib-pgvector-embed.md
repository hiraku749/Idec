# lib/pgvector/embed.ts — 解説

## このファイルは何をするのか

テキストを「ベクトル」（数値の配列）に変換する。
OpenAI の Embeddings API を呼び出して、1536個の数値でテキストの意味を表現する。

---

## なぜこのファイルが必要なのか

### ベクトル検索とは？

通常の検索は「キーワードが含まれるか」で探す（全文検索）。
ベクトル検索は「意味が近いか」で探す（意味検索・セマンティック検索）。

例：
- 「犬」で検索 → 全文検索では「犬」という文字を含むノートしか出ない
- 「犬」で検索 → ベクトル検索では「ポメラニアン」「柴犬」「ペット」が含まれるノートも出てくる

この仕組みを使うために、すべてのノートをベクトルに変換してDBに保存する。

---

## コードの解説

### OpenAI クライアントの初期化

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

OpenAI APIに接続するクライアントを作成。APIキーは `.env.local` から読み取る。

---

### embedText 関数

```typescript
export async function embedText(text: string): Promise<number[]> {
  if (!text.trim()) {
    return new Array(1536).fill(0)  // 空テキストはゼロベクトル
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',  // 1536次元のモデル
    input: text,
  })

  return response.data[0].embedding  // [0.123, -0.456, ...]
}
```

**`text-embedding-3-small`** — OpenAIのベクトル化モデル。
- 入力：テキスト（日本語OK）
- 出力：1536個の小数（例：`[0.123, -0.456, 0.789, ...]`）
- コスト：安い（small版）

このベクトルをSupabase（pgvector）に保存しておき、類似度検索に使う。

---

### ゼロベクトルについて

```typescript
return new Array(1536).fill(0)
```

空テキストのときはAPIを呼ばずに「全部0の配列」を返す。
API呼び出しを節約するため。

---

## 依存関係

**このファイルが使っているもの：**
- `openai` — OpenAI SDK
- `OPENAI_API_KEY` 環境変数（`.env.local` に設定が必要）

**このファイルを使っているもの：**
- `app/api/notes/route.ts` — ノート作成時にベクトル生成
- `app/api/notes/[id]/route.ts` — ノート更新時にベクトル再生成
- `app/api/embed/route.ts` — 手動でベクトルを（再）生成するエンドポイント

---

## 関連ファイル

| ファイル | 関係 |
|---------|------|
| `lib/utils/tiptap.ts` | Tiptap JSONをプレーンテキストに変換（embedTextに渡す前に使う） |
| `docs/supabase-setup.sql` | `vector_embedding VECTOR(1536)` 列と IVFFlat インデックスの定義 |

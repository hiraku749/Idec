# app/api/wall/route.ts

## 1. このファイルは何をするのか

壁打ち（ブレインストーミング）機能のAPIルート。POSTでメッセージ送信、GETでセッション一覧取得・特定セッション取得を行う。

## 2. なぜこのファイルが必要なのか

壁打ち機能はOwnAIと異なり「セッション」という概念がある。会話の履歴をセッション単位で保存・取得する必要があるため、POST（メッセージ送信）とGET（セッション取得）の2つのHTTPメソッドを持つAPIエンドポイントが必要。

## 3. コードの解説

### バリデーションスキーマ

```typescript
const wallSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid().optional(),
  aiType: z.union([...]).default('balanced'),
  projectId: z.string().uuid().optional(),
})
```

`sessionId`が省略された場合は新規セッションが作成され、指定された場合は既存セッションにメッセージが追加される。

### POST関数（メッセージ送信）

1. 認証チェック（未ログインなら401）
2. Zodでバリデーション（不正なら400）
3. `runWall()`パイプラインにユーザーID・メッセージ・セッションID・AIタイプを渡す
4. 成功時はAIの返答データを返却、失敗時は500エラー

### GET関数（セッション取得）

GETには2つの動作モードがある。

**モード1: 特定セッション取得**（`?sessionId=xxx`パラメータあり）
- `wall_sessions`テーブルからIDとユーザーIDが一致するセッションを1件取得
- 見つからなければ404エラー

**モード2: セッション一覧取得**（パラメータなし）
- ログインユーザーのセッションを`updated_at`の新しい順に最大20件取得
- `id`, `summary`, `ai_type`, `is_active`, `created_at`, `updated_at`のみ返す（メッセージ本文は含まない）

### URLSearchParamsの使い方

```typescript
const { searchParams } = new URL(request.url)
const sessionId = searchParams.get('sessionId')
```

GETリクエストではボディが使えないため、URLのクエリパラメータ（`?sessionId=xxx`）からデータを受け取る。`searchParams.get()`は該当パラメータがなければ`null`を返す。

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `next/server` | APIレスポンス生成 |
| `@/lib/supabase/server` | 認証チェック・DBアクセス |
| `@/lib/pipeline` | `runWall` パイプライン |
| `zod` | リクエストバリデーション |

## 5. 関連ファイル

- `app/(main)/wall/page.tsx` — このAPIを呼び出すフロントエンドページ
- `lib/pipeline/index.ts` — `runWall` の実装
- `lib/supabase/server.ts` — サーバー用Supabaseクライアント

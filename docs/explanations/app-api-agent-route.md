# app/api/agent/route.ts

## 1. このファイルは何をするのか

OwnAI（自分専用AI）への質問を受け付けるAPIルート。POSTリクエストで質問とAIタイプを受け取り、`runOwnAi`パイプラインを実行して回答を返す。

## 2. なぜこのファイルが必要なのか

フロントエンドのチャット画面（`app/(main)/agent/page.tsx`）からAIに質問を送るには、サーバー側で認証チェック・バリデーション・AI処理を行うAPIエンドポイントが必要。このファイルがその窓口となる。クライアントから直接Claude APIを呼ぶと、APIキーが漏洩するため、必ずサーバー経由にする。

## 3. コードの解説

### インポート部分

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runOwnAi } from '@/lib/pipeline'
import { z } from 'zod'
```

- `NextResponse` — Next.js の API Route でレスポンスを返すためのユーティリティ
- `createClient` — サーバーサイド用の Supabase クライアント生成関数
- `runOwnAi` — ノートをナレッジとして使い、AIが回答を生成するパイプライン関数
- `z`（Zod） — リクエストボディのバリデーション（型チェック）ライブラリ

### バリデーションスキーマ

```typescript
const agentSchema = z.object({
  query: z.string().min(1).max(5000),
  aiType: z.union([z.literal('rational'), z.literal('balanced'), z.literal('ethical')]).default('balanced'),
  projectId: z.string().uuid().optional(),
  saveAsNote: z.boolean().optional().default(false),
})
```

受け取るデータの形を定義している。`query`は必須の文字列、`aiType`は3種類のうち1つ（デフォルトは`balanced`）、`projectId`と`saveAsNote`は省略可能。

### POST関数の流れ

1. **認証チェック** — `supabase.auth.getUser()` でログイン中のユーザーを取得。未ログインなら401エラー
2. **バリデーション** — `agentSchema.safeParse(body)` でリクエストの形が正しいか検証。不正なら400エラー
3. **パイプライン実行** — `runOwnAi()` にユーザーID・質問・AIタイプ等を渡して実行
4. **レスポンス** — 成功時はAIの回答データをJSON返却、失敗時は500エラー

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `next/server` | APIレスポンス生成 |
| `@/lib/supabase/server` | 認証チェック |
| `@/lib/pipeline` | `runOwnAi` パイプライン |
| `zod` | リクエストバリデーション |

## 5. 関連ファイル

- `app/(main)/agent/page.tsx` — このAPIを呼び出すフロントエンドページ
- `lib/pipeline/index.ts` — `runOwnAi` の実装
- `lib/supabase/server.ts` — サーバー用Supabaseクライアント

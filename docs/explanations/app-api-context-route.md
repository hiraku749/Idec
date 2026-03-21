# app/api/context/route.ts

## 1. このファイルは何をするのか

コンテキストエンジニアリング機能のAPIエンドポイント。複数のノートを選択し、指定した目的（プロンプト生成・簡潔化・再構成）でAIに処理させて結果を返す。

## 2. なぜこのファイルが必要なのか

フロントエンドのUIからAI処理を呼び出すための窓口。認証チェック・入力値検証を行った上でパイプラインに処理を委譲し、結果をJSONで返す。

## 3. コードの各部分の解説

```typescript
const contextSchema = z.object({
  noteIds: z.array(z.string().uuid()).min(1).max(10),
  goal: z.union([...]),
})
```
- `noteIds`: 処理対象ノートのIDリスト。1〜10件まで許可
- `goal`: 処理モード。`prompt-engineering`（プロンプト生成）/ `condense`（簡潔化）/ `restructure`（再構成）

```typescript
const result = await runContextTool({ userId, noteIds, goal })
```
- パイプラインの `runContextTool` に処理を委ねる
- 結果は `{ result: string }` の形で返ってくる

## 4. 依存関係

- **使っているもの**: `lib/supabase/server.ts`（認証）、`lib/pipeline`（AI処理）、`zod`（バリデーション）
- **使われているもの**: `app/(main)/context/page.tsx`（UIから fetch で呼ばれる）

## 5. 関連ファイル

- `lib/pipeline/tools/context-tool.ts` — 実際のAI処理ロジック
- `lib/pipeline/types.ts` — `ContextToolInput` 型定義
- `app/(main)/context/page.tsx` — フロントエンドUI

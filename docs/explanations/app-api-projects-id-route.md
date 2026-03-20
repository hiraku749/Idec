# app/api/projects/[id]/route.ts

## 1. このファイルは何をするのか

個別プロジェクトの詳細取得（GET）、更新（PATCH）、削除（DELETE）を処理する API Route。

## 2. なぜこのファイルが必要なのか

プロジェクトの詳細表示・編集・削除にはプロジェクト ID を指定した API が必要。`[id]` はNext.js の動的ルートで、URL の `/api/projects/abc123` の `abc123` 部分を `params.id` として受け取る。

## 3. コードの解説

### GET — プロジェクト詳細取得

```ts
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
```
- 第2引数の `params` から動的ルートパラメータ `id` を受け取る。`_request` はアンダースコア始まりで「使わない」ことを示す慣習。

```ts
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
```
- ID とユーザー ID の両方で絞り込む。これにより他人のプロジェクトにはアクセスできない（セキュリティ）。

### PATCH — プロジェクト更新

```ts
  const parsed = updateProjectSchema.safeParse(body)
```
- 更新用の Zod スキーマでバリデーション。`createProjectSchema` とは異なり、すべてのフィールドがオプショナル（変更したい項目だけ送ればよい）。

```ts
  const { data, error } = await supabase
    .from('projects')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()
```
- バリデーション済みのデータで更新。`.select().single()` で更新後のデータを返す。

### DELETE — プロジェクト削除

```ts
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
```
- 指定 ID のプロジェクトを物理削除。`user_id` チェックにより自分のプロジェクトのみ削除可能。

```ts
  return NextResponse.json({ success: true })
```
- 成功時は `{ success: true }` を返す。

## 4. 依存関係

- **使っているもの**: `next/server`（NextResponse）、`@/lib/supabase/server`（createClient）、`@/lib/validations/schemas`（updateProjectSchema）
- **使われているもの**: `app/(main)/projects/[id]/page.tsx`（詳細表示）、`app/(main)/projects/[id]/project-actions.tsx`（削除ボタン）

## 5. 関連ファイル

- `app/api/projects/route.ts` — 一覧取得・新規作成の API
- `lib/validations/schemas.ts` — `updateProjectSchema` の定義
- `app/(main)/projects/[id]/project-actions.tsx` — DELETE を呼び出す削除ボタン
- `lib/supabase/server.ts` — サーバー側 Supabase クライアント

# app/api/projects/route.ts

## 1. このファイルは何をするのか

プロジェクトの一覧取得（GET）と新規作成（POST）を処理する API Route。

## 2. なぜこのファイルが必要なのか

フロントエンド（ブラウザ）からプロジェクトデータを操作するための API エンドポイントが必要。Next.js の API Route を使うことで、認証チェックやバリデーションをサーバー側で安全に行える。

## 3. コードの解説

### GET — プロジェクト一覧取得

```ts
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
```
- Supabase クライアントを作成し、ログイン中のユーザーを取得。未ログインなら 401 エラーを返す。

```ts
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
```
- URL のクエリパラメータから `status`（例: `?status=active`）を取得。フィルタリングに使う。

```ts
  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  }
```
- ログインユーザーのプロジェクトのみを取得（他人のデータは見えない）。`status` パラメータがあればさらに絞り込む。更新日時の降順でソート。

### POST — プロジェクト作成

```ts
  const body = await request.json()
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
```
- リクエストボディを JSON として読み取り、Zod スキーマでバリデーション。不正なデータなら 400 エラー。

```ts
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, title, description, goal, deadline: deadline ?? null, status })
    .select()
    .single()
```
- バリデーション済みのデータを `projects` テーブルに挿入。`.select().single()` で挿入した行をそのまま返す。

```ts
  return NextResponse.json(data, { status: 201 })
```
- 作成成功時は HTTP 201（Created）で作成されたプロジェクトデータを返す。

## 4. 依存関係

- **使っているもの**: `next/server`（NextResponse）、`@/lib/supabase/server`（createClient）、`@/lib/validations/schemas`（createProjectSchema）
- **使われているもの**: `app/(main)/projects/new/page.tsx`（新規作成フォーム）、その他プロジェクト一覧を表示するページ

## 5. 関連ファイル

- `app/api/projects/[id]/route.ts` — 個別プロジェクトの GET/PATCH/DELETE
- `lib/validations/schemas.ts` — `createProjectSchema` の定義
- `app/(main)/projects/new/page.tsx` — この API を呼び出す新規作成フォーム
- `lib/supabase/server.ts` — サーバー側 Supabase クライアント

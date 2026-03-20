# app/(main)/projects/[id]/page.tsx

## 1. このファイルは何をするのか

プロジェクトの詳細情報と紐づくノート一覧を表示するサーバーコンポーネントページ。

## 2. なぜこのファイルが必要なのか

ユーザーが個別のプロジェクトの内容（タイトル・目標・進捗・期限）を確認し、そのプロジェクトに関連するノートを一覧できる場所が必要。

## 3. コードの解説

```tsx
export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
```
- `async function` — サーバーコンポーネント。サーバー上でデータを取得してから HTML を生成する。
- `params.id` — URL の `[id]` 部分（例: `/projects/abc123` なら `abc123`）。

```tsx
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
```
- 認証チェック。未ログインなら `/login` にリダイレクト。

```tsx
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!project) notFound()
```
- プロジェクトをデータベースから取得。見つからなければ Next.js の 404 ページを表示。

```tsx
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, updated_at')
    .eq('project_id', params.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(20)
```
- プロジェクトに紐づくノートを最大20件取得（削除済みは除外）。

```tsx
const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: '計画中', color: '...' },
  active:   { label: '進行中', color: '...' },
  completed:{ label: '完了',   color: '...' },
  archived: { label: 'アーカイブ', color: '...' },
}
```
- プロジェクトのステータスに対応する日本語ラベルとカラーの定義。

UI は3つのセクションで構成:
1. **ヘッダー** — タイトル、ステータスバッジ、説明、削除ボタン（`ProjectActions`）
2. **メタデータ** — 目標、進捗バー、期限をカード形式で表示
3. **ノート一覧** — `NoteCard` コンポーネントをグリッド表示

## 4. 依存関係

- **使っているもの**: `@/lib/supabase/server`（createClient）、`@/components/notes/note-card`（NoteCard）、`@/types`（ProjectStatus）、`./project-actions`（ProjectActions）、Next.js（Link, redirect, notFound）
- **使われているもの**: ブラウザから `/projects/[id]` でアクセス、新規作成後のリダイレクト先

## 5. 関連ファイル

- `app/(main)/projects/[id]/project-actions.tsx` — 削除ボタンのクライアントコンポーネント
- `components/notes/note-card.tsx` — ノートカードの表示コンポーネント
- `app/api/projects/[id]/route.ts` — 同じプロジェクトを操作する API
- `types/index.ts` — `ProjectStatus` 型の定義

# app/(main)/projects/new/page.tsx

## 1. このファイルは何をするのか

新規プロジェクトを作成するためのフォームページ。

## 2. なぜこのファイルが必要なのか

ユーザーがプロジェクト名・目標・説明・期限を入力して新しいプロジェクトを作れるようにする UI が必要。作成後は自動的にプロジェクト詳細ページに遷移する。

## 3. コードの解説

```tsx
'use client'
```
- フォームの送信処理や状態管理（`useState`）を使うためクライアントコンポーネントにする。

```tsx
const [submitting, setSubmitting] = useState(false)
const [error, setError] = useState('')
```
- `submitting` — 送信中かどうかのフラグ。二重送信防止に使う。
- `error` — API からのエラーメッセージを保持。

```tsx
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
```
- `e.preventDefault()` でフォームのデフォルト送信（ページリロード）を防ぐ。

```tsx
  const form = new FormData(e.currentTarget)
  const body = {
    title: form.get('title') as string,
    description: form.get('description') as string,
    goal: form.get('goal') as string,
    deadline: (form.get('deadline') as string) || undefined,
  }
```
- `FormData` API でフォームの入力値を取得。`deadline` は空文字なら `undefined` にして送信しない。

```tsx
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
```
- `/api/projects` に POST リクエストを送信してプロジェクトを作成。

```tsx
  const project = await res.json()
  router.push(`/projects/${project.id}`)
```
- 作成成功時、レスポンスからプロジェクト ID を取得し、詳細ページに遷移する。

フォーム UI 部分では、各入力フィールドに `required`（必須）や `maxLength`（最大文字数）を設定してクライアント側でも簡易バリデーションを行っている。

## 4. 依存関係

- **使っているもの**: React（`useState`）、Next.js（`useRouter`）、`/api/projects`（POST API）
- **使われているもの**: ブラウザから `/projects/new` でアクセス

## 5. 関連ファイル

- `app/api/projects/route.ts` — POST リクエストの送信先 API
- `app/(main)/projects/[id]/page.tsx` — 作成後に遷移するプロジェクト詳細ページ
- `lib/validations/schemas.ts` — サーバー側で使われるバリデーションスキーマ

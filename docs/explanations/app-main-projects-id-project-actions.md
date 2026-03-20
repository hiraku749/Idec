# app/(main)/projects/[id]/project-actions.tsx

## 1. このファイルは何をするのか

プロジェクトの削除ボタンと削除確認 UI を提供するクライアントコンポーネント。

## 2. なぜこのファイルが必要なのか

プロジェクト削除は取り消せない操作なので、ワンクリックで即削除ではなく「本当に削除しますか？」の確認ステップが必要。また、削除処理は `fetch` による API 呼び出しとページ遷移を伴うため、クライアントコンポーネントとして分離する必要がある（親の `page.tsx` はサーバーコンポーネント）。

## 3. コードの解説

```tsx
export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
```
- `confirming` — 確認モード（「本当に削除」ボタンを表示するか）を管理。
- `deleting` — API 呼び出し中のローディング状態。

```tsx
  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/projects')
      router.refresh()
    }
  }
```
- DELETE API を呼び出し、成功したらプロジェクト一覧ページに遷移。`router.refresh()` でサーバーコンポーネントのデータを再取得させる。

**2段階の UI 切り替え:**

1. **通常時** — 「削除」ボタンのみ表示。クリックすると `confirming` が `true` になる。
2. **確認時** — 「本当に削除」と「キャンセル」の2つのボタンを表示。
   - 「本当に削除」→ `handleDelete()` を実行
   - 「キャンセル」→ `confirming` を `false` に戻す

```tsx
disabled={deleting}
```
- 削除 API 呼び出し中はボタンを無効化して二重クリックを防止。

## 4. 依存関係

- **使っているもの**: React（`useState`）、Next.js（`useRouter`）、`/api/projects/[id]`（DELETE API）
- **使われているもの**: `app/(main)/projects/[id]/page.tsx` から `<ProjectActions projectId={...} />` として呼び出される

## 5. 関連ファイル

- `app/(main)/projects/[id]/page.tsx` — このコンポーネントを配置している親ページ
- `app/api/projects/[id]/route.ts` — DELETE リクエストの送信先 API

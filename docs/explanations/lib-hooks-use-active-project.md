# lib/hooks/use-active-project.ts

## このファイルは何をするのか

「アクティブプロジェクト（プロジェクトナレッジモード）」をlocalStorageに保存・読み込みするカスタムフック。

## なぜこのファイルが必要なのか

プロジェクトナレッジモードでは、特定のプロジェクトを「使用中」として設定することで、そのプロジェクトのノートだけをAIのナレッジとして使う。この設定はページをまたいで保持する必要があるが、ログイン不要の軽量な方法としてlocalStorageを使用する。

## コードの解説

```typescript
const STORAGE_KEY = 'idec_active_project'
```
localStorageに保存するキー名。アプリ全体で統一されたキーを使う。

```typescript
export interface ActiveProject {
  id: string
  title: string
}
```
アクティブプロジェクトの型。idとtitleだけを保存する（最小限の情報）。

```typescript
useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      setActiveProjectState(JSON.parse(stored) as ActiveProject)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}, [])
```
コンポーネントがマウントされた時に、localStorageから保存済みのプロジェクト情報を読み込む。壊れたデータはtry/catchで捕捉して削除する。

```typescript
const setActiveProject = useCallback((project: ActiveProject | null) => {
  if (project) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
  setActiveProjectState(project)
}, [])
```
プロジェクトを設定または解除する関数。nullを渡すと解除（localStorageからも削除）。

## 依存関係

- React: useState, useEffect, useCallback

## 使われているファイル

- `components/shared/sidebar.tsx` — サイドバーでアクティブプロジェクトを表示
- `components/projects/knowledge-toggle.tsx` — プロジェクト詳細ページのトグルボタン
- `app/(main)/agent/page.tsx` — OwnAIに自動でprojectIdを渡す
- `app/(main)/notes/new/page.tsx` — 新規ノート作成時に自動でプロジェクトを選択

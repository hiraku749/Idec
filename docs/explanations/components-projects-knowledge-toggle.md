# components/projects/knowledge-toggle.tsx

## このファイルは何をするのか

プロジェクト詳細ページに表示される「ナレッジとして使う / ナレッジ使用中」ボタン。

## なぜこのファイルが必要なのか

プロジェクトナレッジモードを有効化・無効化するUIが必要。このボタンをクリックすることで、そのプロジェクトがアクティブプロジェクトとして設定され、以降のAIツール使用時に自動的にそのプロジェクトのナレッジが適用される。

## コードの解説

```typescript
const isActive = activeProject?.id === projectId
```
現在表示しているプロジェクトが、アクティブプロジェクトかどうかを判定する。

```typescript
function handleToggle() {
  if (isActive) {
    setActiveProject(null)   // 解除
  } else {
    setActiveProject({ id: projectId, title: projectTitle })  // 設定
  }
}
```
ボタンクリックでON/OFFをトグルする。

ボタンのスタイルはアクティブ状態によって変わる:
- アクティブ: `bg-primary/10 border-primary text-primary` (青みがかったスタイル)
- 非アクティブ: `border-border text-muted-foreground` (グレーのアウトライン)

## 依存関係

- `@/lib/hooks/use-active-project` — localStorage状態管理
- `lucide-react` — BookOpen / BookX アイコン

## 使われているファイル

- `app/(main)/projects/[id]/page.tsx` — プロジェクト詳細ページのヘッダーに配置

# components/shared/theme-toggle.tsx

## 1. このファイルは何をするのか

ダークモードとライトモードを切り替えるトグルボタンコンポーネント。

## 2. なぜこのファイルが必要なのか

ユーザーがアプリの外観（明るい/暗い）を好みに応じて切り替えられるようにするため。サイドバーなどに配置して、ワンクリックでテーマを変更できる UI を提供する。

## 3. コードの解説

```tsx
'use client'
```
- このコンポーネントはブラウザ上で動作する「クライアントコンポーネント」。`useTheme` や `useState` などの React フックを使うため必須。

```tsx
const { theme, setTheme } = useTheme()
```
- `next-themes` ライブラリの `useTheme` フックを使って、現在のテーマの取得と変更を行う。

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
```
- **ハイドレーション対策**。サーバーサイドレンダリング時はテーマが不明なので、マウント前はプレースホルダーを表示する。これがないとサーバーとクライアントの HTML が一致せずエラーになる。

```tsx
if (!mounted) {
  return (
    <button ... disabled>
      <span>🌓</span> テーマ
    </button>
  )
}
```
- マウント前は無効化されたボタンを表示（ちらつき防止）。

```tsx
const isDark = theme === 'dark'
return (
  <button onClick={() => setTheme(isDark ? 'light' : 'dark')} ...>
    <span>{isDark ? '☀️' : '🌙'}</span>
    {isDark ? 'ライトモード' : 'ダークモード'}
  </button>
)
```
- ダークモードなら「ライトモードに切り替え」、ライトモードなら「ダークモードに切り替え」を表示。クリックで反対のテーマに切り替える。

## 4. 依存関係

- **使っているもの**: `next-themes`（`useTheme`）、React（`useState`, `useEffect`）
- **使われているもの**: サイドバーなどの共通 UI コンポーネントから呼び出される

## 5. 関連ファイル

- `app/layout.tsx` — `ThemeProvider` でアプリ全体をラップしている
- `app/(main)/settings/settings-tabs.tsx` — 設定ページのテーマタブでも同様のテーマ切替機能がある

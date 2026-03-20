# app/(main)/settings/settings-tabs.tsx

## 1. このファイルは何をするのか

設定ページのタブ切り替え UI。「テーマ」タブと「プロフィール」タブを提供する。

## 2. なぜこのファイルが必要なのか

設定項目はテーマとプロフィールの2種類があり、タブで整理することで画面を分かりやすくする。テーマ切り替えは `useTheme`、タブ状態管理は `useState` を使うため、クライアントコンポーネントとして分離する必要がある。

## 3. コードの解説

### タブ定義

```tsx
const TABS = [
  { id: 'theme', label: 'テーマ' },
  { id: 'profile', label: 'プロフィール' },
] as const
type TabId = (typeof TABS)[number]['id']
```
- `as const` でタブの ID を文字列リテラル型として固定。`TabId` は `'theme' | 'profile'` という型になる。

### SettingsTabs コンポーネント

```tsx
const [activeTab, setActiveTab] = useState<TabId>('theme')
```
- 現在選択中のタブを管理。初期値は `'theme'`。

```tsx
{TABS.map((tab) => (
  <button
    onClick={() => setActiveTab(tab.id)}
    className={cn(
      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
      activeTab === tab.id
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    )}
  >
```
- `cn()` は条件付きクラス名を結合するユーティリティ。選択中のタブは下線付き、非選択は透明な下線。

### ThemeTab コンポーネント

```tsx
const options = [
  { value: 'light', label: 'ライト', icon: '☀️' },
  { value: 'dark', label: 'ダーク', icon: '🌙' },
  { value: 'system', label: 'システム', icon: '💻' },
]
```
- 3つのテーマ選択肢をカード形式で表示。`theme-toggle.tsx` と違い「システム」設定（OS の設定に従う）も選べる。

- `mounted` チェックは `theme-toggle.tsx` と同じハイドレーション対策。

### ProfileTab コンポーネント

```tsx
function ProfileTab({ displayName, email }: { displayName: string; email: string }) {
```
- 親の `SettingsPage`（サーバーコンポーネント）から受け取った表示名とメールアドレスを表示。
- 現時点では読み取り専用。編集機能は今後のアップデートで追加予定。

## 4. 依存関係

- **使っているもの**: React（`useState`, `useEffect`）、`next-themes`（`useTheme`）、`@/lib/utils`（`cn`）
- **使われているもの**: `app/(main)/settings/page.tsx` から呼び出される

## 5. 関連ファイル

- `app/(main)/settings/page.tsx` — このコンポーネントを呼び出す親ページ
- `components/shared/theme-toggle.tsx` — サイドバー用の簡易テーマ切替ボタン（類似機能）
- `lib/utils.ts` — `cn` ユーティリティ関数
- `app/layout.tsx` — `ThemeProvider` の設定場所

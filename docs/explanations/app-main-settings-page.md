# app/(main)/settings/page.tsx

## 1. このファイルは何をするのか

設定ページのサーバーコンポーネント。プロフィールデータを読み込んでタブ UI に渡す。

## 2. なぜこのファイルが必要なのか

設定ページではデータベースからプロフィール情報（表示名・メールアドレス）を取得する必要がある。サーバーコンポーネントとして実装することで、ブラウザに API キーを露出させずに安全にデータを取得できる。取得したデータはクライアントコンポーネント（`SettingsTabs`）に props として渡す。

## 3. コードの解説

```tsx
export default async function SettingsPage() {
```
- `async` — サーバーコンポーネント。サーバー上で非同期にデータベースにアクセスできる。

```tsx
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
```
- 認証チェック。未ログインならログインページにリダイレクト。

```tsx
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, dark_mode')
    .eq('id', user.id)
    .single()
```
- `profiles` テーブルからログインユーザーのプロフィール情報を取得。

```tsx
  <SettingsTabs
    displayName={profile?.display_name ?? ''}
    email={profile?.email ?? user.email ?? ''}
  />
```
- 取得したデータを `SettingsTabs` コンポーネントに渡す。`??` はnull/undefinedの場合にデフォルト値を使う演算子。`profile` がなくても `user.email` をフォールバックとして使う。

## 4. 依存関係

- **使っているもの**: `@/lib/supabase/server`（createClient）、Next.js（`redirect`）、`./settings-tabs`（SettingsTabs）
- **使われているもの**: ブラウザから `/settings` でアクセス

## 5. 関連ファイル

- `app/(main)/settings/settings-tabs.tsx` — テーマ・プロフィールのタブ UI（クライアントコンポーネント）
- `lib/supabase/server.ts` — サーバー側 Supabase クライアント
- `app/(main)/layout.tsx` — 認証ガードを含むメインレイアウト

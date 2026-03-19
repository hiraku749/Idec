# app/(main)/dashboard/page.tsx — 解説

## このファイルは何をするのか

ログイン成功後に表示されるダッシュボードページ。現在は仮のプレースホルダー。
Phase 3 で本格的なコンテンツ（ピン留めノート・最近のノート・ToDo一覧）が追加される。

---

## なぜこのファイルが必要なのか

`login/page.tsx` でログインが成功すると `router.push('/dashboard')` で遷移する。
この遷移先がなければ「ページが見つかりません（404）」になってしまうため、最低限のページが必要。

---

## コードの解説

### Server Component として動く

```typescript
export default async function DashboardPage() {
```

`'use client'` がないのでサーバーサイドで実行される。
ページ表示時にサーバーでデータを取得してからHTMLを返す（SSR）。

---

### ユーザー情報を表示

```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/login')
}
```

親レイアウト（`app/(main)/layout.tsx`）でも認証チェックしているが、ここでも念のためチェック。
`user.email` でログイン中のメールアドレスを取得して表示している。

---

## 依存関係

**このファイルが使っているもの：**
- `@/lib/supabase/server` — サーバー用Supabaseクライアント
- `next/navigation` — redirect

**このファイルを呼び出すもの：**
- ログイン・登録成功後の `router.push('/dashboard')` でここに遷移する
- `app/(main)/layout.tsx` がこのページを `children` としてラップする

---

## Phase 3 で追加される予定のもの

```
ダッシュボード（Phase 3 完成後）
├── ピン留めノートセクション（上部）
├── 最近使ったノートセクション（カード形式）
└── ToDo 未完了一覧セクション（チェックボックス付き）
```

---

## 関連ファイル

| ファイル | 関係 |
|---------|------|
| `app/(main)/layout.tsx` | このページをラップする親レイアウト |
| `app/(auth)/login/page.tsx` | ログイン成功後にここへ遷移する |
| `app/(auth)/register/page.tsx` | 登録成功後にここへ遷移する |

# app/(main)/layout.tsx — 解説

## このファイルは何をするのか

ログイン後のページ（ダッシュボード・ノートなど）を囲む共通レイアウト。
未ログインのユーザーが来た場合は `/login` にリダイレクトする。

---

## なぜこのファイルが必要なのか

Next.js 14 の App Router では、フォルダ内に `layout.tsx` を置くと、**そのフォルダ以下の全ページに共通のラッパーを適用**できる。

`(main)` フォルダ以下には「ログインが必要なページ」が入る。このレイアウトで認証チェックをしておけば、各ページで毎回チェックする必要がない。

将来的にはサイドバーもここに追加する（Phase 3）。

---

## コードの解説

### Server Component として動く

```typescript
export default async function MainLayout({ children }: { children: React.ReactNode }) {
```

`'use client'` がないので、このファイルは **サーバーサイドで実行**される。
サーバーサイドで動くので、`cookies()` を使ってセッションを読み取れる。

---

### 認証チェック

```typescript
const supabase = createClient()           // サーバー用クライアント（server.ts から）
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/login')                       // 未ログイン → ログインページへ
}
```

`supabase.auth.getUser()` — Cookieに保存されたセッションからユーザー情報を取得する。
- ログイン済み → `user` にユーザー情報が入る
- 未ログイン → `user` が `null` → `/login` にリダイレクト

---

### children の表示

```typescript
return (
  <div className="min-h-screen bg-background">
    {children}
  </div>
)
```

`children` = このレイアウトの中に入る各ページのコンテンツ。
例えば `/dashboard` にアクセスすると `children` には `DashboardPage` が入る。

Phase 3 でここにサイドバーが追加される。

---

## 依存関係

**このファイルが使っているもの：**
- `@/lib/supabase/server` — サーバー用Supabaseクライアント
- `next/navigation` — redirect（サーバーサイドのページ遷移）

**このファイルを使っているもの：**
- `app/(main)/dashboard/page.tsx` など、`(main)` フォルダ以下の全ページ

---

## 関連ファイル

| ファイル | 関係 |
|---------|------|
| `app/(auth)/layout.tsx` | 認証前ページ用レイアウト（セットで理解する） |
| `lib/supabase/server.ts` | サーバー用Supabaseクライアント |
| `middleware.ts` | 同じく認証ガードをしている（二重チェック）|

---

## middleware.ts との違い

`middleware.ts` でも認証チェックをしているのに、なぜここでも？

- **middleware.ts** — 全リクエストを先にフィルター。高速だがSupabaseの詳細情報は持てない
- **layout.tsx** — サーバーコンポーネントとして動く。ユーザー情報をページに渡せる

両方あることで「ガードが二重になる」のでより安全。

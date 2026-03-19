# components/shared/sidebar.tsx — 解説

## このファイルは何をするのか

画面左側に表示されるサイドバーナビゲーション。ページ間の移動・最近のノート一覧・ログアウトボタンを提供する。

---

## なぜこのファイルが必要なのか

ログイン後のすべてのページに共通するナビゲーション。
ここに置くことで各ページが個別にナビゲーションを持つ必要がなくなる。

---

## コードの解説

### `'use client'` が必要な理由

```typescript
'use client'
```

サイドバーは「今どのページにいるか（`usePathname`）」を知る必要がある。
`usePathname` はブラウザ側でしか動かないため `'use client'` が必要。

---

### アクティブなリンクの判定

```typescript
pathname === item.href || pathname.startsWith(item.href + '/')
```

- `/notes` にいるとき → `pathname === '/notes'` → ✅ アクティブ
- `/notes/abc123` にいるとき → `pathname.startsWith('/notes/')` → ✅ アクティブ
- `/dashboard` にいるとき → どちらも false → アクティブでない

`cn()` でクラスを条件分岐している（`lib/utils/cn.ts`）。

---

### ログアウト処理

```typescript
async function handleLogout() {
  setLoggingOut(true)
  const supabase = createClient()      // ブラウザ用クライアント
  await supabase.auth.signOut()        // Supabaseのセッションを削除
  router.push('/login')                // ログインページへ移動
  router.refresh()                     // サーバー側のキャッシュをリセット
}
```

`signOut()` を呼ぶことで Cookie のセッションが削除される。
`router.refresh()` がないとサーバーコンポーネントが古いセッション情報を持ち続けてしまう。

---

### recentNotes プロップ

```typescript
interface SidebarProps {
  recentNotes: Pick<Note, 'id' | 'title'>[]
}
```

最近のノート一覧はサーバーサイド（`app/(main)/layout.tsx`）で取得して渡す。
サイドバー自身はDBに直接アクセスしない設計。

---

## 依存関係

**使っているもの：**
- `next/link` / `next/navigation` — ナビゲーション
- `@/lib/supabase/client` — ブラウザ用ログアウト処理
- `@/lib/utils` — `cn()` クラス結合
- `@/lib/utils/format` — `truncate()` テキスト省略

**使われているもの：**
- `app/(main)/layout.tsx` — デスクトップ表示
- `components/shared/mobile-nav.tsx` — モバイル表示（ドロワー内）

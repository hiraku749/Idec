# app/(auth)/register/page.tsx — 解説

## このファイルは何をするのか

新規ユーザー登録ページのUI。表示名・メール・パスワードを入力してアカウントを作成できる。

---

## なぜこのファイルが必要なのか

ログインページだけでは新しいユーザーがアカウントを持てない。
このページがあることで「サービスを初めて使う人」がアカウントを作成できる。

---

## コードの解説

### `'use client'`

```typescript
'use client'
```

このファイルはブラウザ（クライアント）側で動くコンポーネントであると宣言している。
Next.js 14 では、**デフォルトはサーバー側で実行**される。`useState` や `useRouter` などのReactフックはブラウザでしか動かないため、この宣言が必要。

---

### State（状態管理）

```typescript
const [displayName, setDisplayName] = useState('')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
```

`useState` はReactの「状態管理」の仕組み。
- `displayName` — 表示名フィールドの現在の入力値
- `email` — メールアドレスフィールドの現在の入力値
- `password` — パスワードフィールドの現在の入力値
- `error` — エラーメッセージ（なければ `null`）
- `loading` — 登録処理中かどうか（`true` の間はボタンが押せなくなる）

フォームのユーザー入力は常に `useState` で管理する。

---

### handleRegister 関数（登録処理の本体）

```typescript
async function handleRegister(e: React.FormEvent) {
  e.preventDefault()      // ← フォームのデフォルト動作（ページリロード）をキャンセル
  setError(null)          // ← エラーをリセット
  setLoading(true)        // ← ローディング開始

  const supabase = createClient()    // ← Supabaseクライアントを作成
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,   // ← ユーザーのメタデータとして表示名を保存
      },
    },
  })

  if (error) {
    setError(error.message)          // ← エラーがあれば表示
    setLoading(false)
    return
  }

  router.push('/dashboard')          // ← 登録成功 → ダッシュボードへ移動
  router.refresh()
}
```

**`supabase.auth.signUp()`** — Supabaseの新規登録API。
- メール・パスワードでアカウントを作成する
- `options.data` に渡した値はユーザーのメタデータとして保存される
- Supabaseの `handle_new_user` トリガーが自動的に `profiles` テーブルにレコードを追加する（SQLで設定済み）

---

### フォームUI

```tsx
<Input
  id="password"
  type="password"
  minLength={6}         // ← 6文字未満ではフォームを送信できない（ブラウザが制御）
  required              // ← 空欄では送信できない
/>
```

shadcn/ui の `<Input>` コンポーネントを使用。HTML の `<input>` と同じ属性が使える。

---

## 依存関係

**このファイルが使っているもの（import）：**
- `react` — useState, フォームイベント型
- `next/navigation` — useRouter（ページ遷移）
- `next/link` — Link（`<a>` タグの代替）
- `@/lib/supabase/client` — ブラウザ用Supabaseクライアント
- `@/components/ui/button` — shadcn/ui のボタン
- `@/components/ui/input` — shadcn/ui の入力フィールド
- `@/components/ui/card` — shadcn/ui のカードレイアウト

**このファイルを使っているもの：**
- Next.js のルーターが `/register` にアクセスしたとき自動的に表示する

---

## 関連ファイル

| ファイル | 関係 |
|---------|------|
| `app/(auth)/login/page.tsx` | ログインページ（セットで理解する） |
| `app/(auth)/layout.tsx` | このページを中央に配置するレイアウト |
| `lib/supabase/client.ts` | Supabaseに接続するクライアント |
| `docs/supabase-setup.sql` | profiles テーブルと handle_new_user トリガー |

---

## ざっくりまとめ

```
ユーザーが情報を入力
  ↓
「アカウントを作成」ボタンを押す
  ↓
handleRegister が実行される
  ↓
Supabase に signUp() を送信
  ↓
成功 → /dashboard へ移動
失敗 → エラーメッセージを表示
```

# app/api/auth/callback/route.ts — 解説

## このファイルは何をするのか

OAuth認証（Google等の外部サービスでのログイン）が完了したあとに呼ばれる「コールバックURL」の処理をする。

---

## なぜこのファイルが必要なのか

OAuth認証の流れを理解すると必要性がわかる：

```
1. ユーザーが「Googleでログイン」を押す
2. Googleの認証画面に移動（Supabaseがリダイレクトする）
3. ユーザーがGoogleでOKを押す
4. Googleが「認証成功」の合図として /api/auth/callback?code=xxx にリダイレクトする ← ここ
5. このファイルがcodeを受け取り、Supabaseのセッションと交換する
6. ログイン完了 → /dashboard へ移動
```

このファイルがなければ、Google認証後に「どこへ戻ればいいか」がわからなくなる。

---

## コードの解説

### ファイルの種類：API Route

`app/api/` フォルダの中にあるファイルはページではなく **API Route**（サーバー側の処理）。
ブラウザからHTTPリクエストが来ると、このファイルが実行される。

```typescript
export async function GET(request: Request) {
```

`GET` という名前でエクスポートすることで「GETリクエストが来たらこの関数を実行する」という意味になる。
Next.js 14 App Router の規約。

---

### URLからパラメータを取り出す

```typescript
const { searchParams, origin } = new URL(request.url)
const code = searchParams.get('code')
const next = searchParams.get('next') ?? '/dashboard'
```

リクエストURLを分解している。例えばURLが：
```
https://example.com/api/auth/callback?code=abc123&next=/notes
```
のとき：
- `code` = `"abc123"` （Googleからの認証コード）
- `next` = `"/notes"` （ログイン後の移動先）
- `origin` = `"https://example.com"` （ドメイン部分）

`?? '/dashboard'` は「`next` が null のときは `/dashboard` を使う」という意味（Null合体演算子）。

---

### 認証コードをセッションと交換する

```typescript
if (code) {
  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (!error) {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
```

**`exchangeCodeForSession(code)`** — Supabaseが提供する関数。
- Googleからもらった一時的な `code` をSupabaseに送る
- Supabaseが「本当に認証済みか」をGoogleに確認する
- 問題なければセッション（ログイン状態）を作成してCookieに保存する
- 成功したら `next` のページ（例：`/dashboard`）にリダイレクトする

---

### 失敗時の処理

```typescript
return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
```

- `code` がない、または Supabase との交換が失敗した場合はログインページに戻す
- `?error=auth_callback_error` をURLに付けることで、ログインページ側でエラーを表示できる（現在は未実装）

---

## 依存関係

**このファイルが使っているもの（import）：**
- `next/server` — NextResponse（リダイレクト等のレスポンス作成）
- `@/lib/supabase/server` — サーバー用Supabaseクライアント（サーバー側なのでserver.tsを使う）

**このファイルを呼び出すもの：**
- Google / GitHub 等のOAuthプロバイダーが認証後に自動でリダイレクトしてくる
- Supabase Auth の設定でこのURLを「Redirect URL」として登録する必要がある

---

## 関連ファイル

| ファイル | 関係 |
|---------|------|
| `lib/supabase/server.ts` | サーバー側Supabaseクライアント |
| `lib/supabase/middleware.ts` | セッション維持のミドルウェア |
| `app/(auth)/login/page.tsx` | Googleログインボタン（将来追加予定） |

---

## ざっくりまとめ

```
Google認証が終わる
  ↓
Google → /api/auth/callback?code=xxx にリダイレクト
  ↓
このファイルが code を受け取る
  ↓
Supabase に code を渡してセッションと交換
  ↓
成功 → /dashboard へ移動
失敗 → /login へ戻す
```

現時点ではGoogle OAuth自体はまだ設定していないが、将来のためにこのファイルを先に用意している。

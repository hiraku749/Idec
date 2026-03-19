# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## プロジェクト概要

**Idec（アイデック）** — アイデア創出から実行までの労働コストを削減するAIプラットフォーム。

コアコンセプト：
- **ノート** — 記憶の外部化（メモ・アイデア・ToDo）
- **AI群** — 思考の加速（壁打ち・検索・要約・増強）
- **プロジェクト** — アイデアから実行への橋渡し（ロードマップ・進捗）

---

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動（localhost:3000）
npm run build        # 本番ビルド
npm run lint         # ESLint
npx tsc --noEmit     # 型チェック（コード変更後は必ず実行）
```

型チェックを必ずビルド前に通すこと。`npm run lint` は型エラーを検出しない。

---

## ルーティング構造

```
app/
├── page.tsx                  # ルート（Next.js デフォルト、実質未使用）
├── layout.tsx                # 全ページ共通レイアウト（フォント・メタデータ）
├── globals.css               # グローバルCSS（CSS変数定義）
├── (auth)/                   # 認証前ページ（ミドルウェア対象外）
│   ├── layout.tsx            # 中央寄せのみ
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/                   # 認証後ページ（layout.tsx で認証チェック）
│   ├── layout.tsx            # 認証ガード（未ログイン → /login）
│   ├── dashboard/page.tsx    # Phase 3 で本実装
│   ├── notes/                # Phase 2 実装済み
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   └── (その他 Phase 3〜10 のプレースホルダー)
└── api/
    ├── auth/callback/route.ts
    ├── notes/route.ts
    ├── notes/[id]/route.ts
    ├── notes/[id]/restore/route.ts
    └── embed/route.ts
```

**ルートグループ `(auth)` / `(main)` はURLに影響しない。** `app/(auth)/login/page.tsx` は `/login` でアクセスできる。

---

## 認証フロー

`middleware.ts` → `lib/supabase/middleware.ts` の `updateSession()` が全リクエストを処理：
- 未ログイン + `/login` or `/register` 以外へのアクセス → `/login` にリダイレクト
- ログイン済み → そのまま通す

加えて `app/(main)/layout.tsx` でも認証チェックを二重に行う（サーバーコンポーネントとして認証情報をページに渡すため）。

Supabase クライアントは用途で使い分ける：
- `lib/supabase/client.ts` — ブラウザ（`'use client'` コンポーネント内）
- `lib/supabase/server.ts` — Server Component / API Route 内
- `lib/supabase/middleware.ts` — middleware.ts 専用

---

## API Route の作り方

すべての API Route で必ず先頭に以下を入れる：

```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
}
```

Zod でリクエストボディを検証してから処理する：

```typescript
const parsed = schema.safeParse(await request.json())
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
```

---

## ノート保存の仕組み

1. Tiptap エディタが JSON（`TiptapContent = Record<string, unknown>`）を出力
2. `lib/utils/tiptap.ts` の `tiptapToText()` でプレーンテキストに変換
3. `lib/pgvector/embed.ts` の `embedText()` で OpenAI Embeddings API（`text-embedding-3-small`）を呼び出してベクトル化
4. Supabase の `notes` テーブルに `content`（JSONB）と `vector_embedding`（VECTOR(1536)）を保存

ノート更新時は `version_history`（最大20世代）に旧バージョンを蓄積する。

---

## 型定義とバリデーション

- `types/index.ts` — DB スキーマと1:1対応する TypeScript 型。Zod に依存しない
- `lib/validations/schemas.ts` — API リクエスト用の Zod スキーマ

**Zod v4 の注意点（v3 と挙動が異なる）：**
- `z.record(valueSchema)` → `z.record(z.string(), valueSchema)` と2引数が必要
- `z.enum(constArray)` は `as const` 配列との型推論が合わない → `z.union([z.literal('a'), z.literal('b')])` で代替
- `z.enum(['a', 'b'])` のインライン記述は問題なく動く

---

## shadcn/ui の注意点（style: base-nova）

このプロジェクトは shadcn の `base-nova` スタイルを使用。Radix UI ではなく **`@base-ui/react`** がプリミティブとして使われている。

**`Button` コンポーネントに `asChild` プロップは存在しない。** `buttonVariants()` は `"use client"` モジュールからエクスポートされているため、**サーバーコンポーネントでは使用不可**。

- **クライアントコンポーネント** — `buttonVariants()` を import して使う
- **サーバーコンポーネント** — Tailwind クラスを直接書く：

```tsx
{/* サーバーコンポーネント内 */}
<Link
  href="/path"
  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 transition-all"
>
  テキスト
</Link>
```

---

## CSS / Tailwind の注意点

`globals.css` には `@import "shadcn/tailwind.css"` や `@import "tw-animate-css"` を書いてはいけない。これらはビルドエラーを引き起こす。

shadcn の CSS 変数（`--border`, `--ring`, `--primary` 等）を Tailwind クラスとして使うには `tailwind.config.ts` の `theme.extend.colors` に登録が必要。登録済み。

`@apply border-border` のような CSS 変数ベースのクラスを `@layer base` の `*` セレクターで使うと PostCSS がエラーを出す場合がある。その場合は直接 `border-color: var(--border)` と書く。

---

## 規約

- **TypeScript strict 必須**。`any` 禁止
- コンポーネントは `function` 宣言、ユーティリティはアロー関数
- ファイル名は `kebab-case`、コンポーネント名は `PascalCase`
- Claude API 呼び出しは `lib/claude/` 経由に統一（未実装）
- `NEXT_PUBLIC_` 以外の環境変数はクライアントに露出させない

---

## 現在の実装状態

| フェーズ | 状態 | 内容 |
|---------|------|------|
| Phase 0 | 完了 | 環境構築・依存関係・Supabase接続・SQL実行 |
| Phase 1 | 完了 | 認証（メールログイン・登録・ミドルウェア） |
| Phase 2 | 完了 | ノート CRUD・Tiptap エディタ・ベクトル検索基盤 |
| Phase 3 | 未着手 | ダッシュボード・サイドバー・ログアウト |
| Phase 4 | 未着手 | OwnAI エージェント（Claude API + pgvector） |
| Phase 5 | 未着手 | MVP仕上げ・レスポンシブ・デプロイ |

Google OAuth はタスク化済み・現在スキップ中（Supabase Auth のメールのみ有効）。

アクティブな作業ログ: `.steering/20260318-initial-implementation/tasklist.md`

---

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=        # 必須
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # 必須
SUPABASE_SERVICE_ROLE_KEY=       # サーバー専用処理で使用
ANTHROPIC_API_KEY=               # Phase 4 から必須
OPENAI_API_KEY=                  # ノート保存時のベクトル生成に必須
NAPKIN_API_KEY=                  # 利用可能な場合のみ
```

`OPENAI_API_KEY` が未設定の場合、ノート保存時に embed.ts でエラーが発生する。

---

## 学習用解説書ルール

ユーザーはプログラミング学習中。**新規ファイルを作成するたびに解説書を作成する。**

保存場所：`docs/explanations/[ファイルパスのスラッシュをハイフンに変換].md`
例：`lib/supabase/client.ts` → `docs/explanations/lib-supabase-client.md`

解説書に含める内容：
1. このファイルは何をするのか（一言）
2. なぜこのファイルが必要なのか（役割・存在理由）
3. コードの各部分の解説（初学者向け日本語）
4. 依存関係（使っているもの・使われているもの）
5. 関連ファイル

例外：`components/ui/`（shadcn 自動生成）・`node_modules/`・設定ファイル類は不要。

---

## 機能完成時のチェックリスト（必須）

**1機能を作り終えるたびに、以下を必ずすべて実施すること。**

### 1. 型チェック・リント

```bash
npx tsc --noEmit   # 型エラーが0件であること
npm run lint       # ESLint エラーが0件であること
```

### 2. 動作テスト（開発サーバーで手動確認）【必須・省略禁止】

**これは絶対に省略しない。** 機能を作り終えたら必ずサーバーを起動してテストを実施する。
テストを省略して「完了」と報告することは禁止。

開発サーバーが起動していない場合は `npm run dev` で起動する。
`curl` または `WebFetch` ツールを使って、実装した機能のエンドポイントやページが期待通りに動くことを確認する。

テストすべき観点（機能によって選択）：
- **ページ** — HTTPステータスが 200 であること（`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/path`）
- **API Route（GET）** — 認証なしで 401 が返ること / 認証ありで 200 + 正しいJSONが返ること
- **API Route（POST/PATCH）** — 不正なボディで 400 が返ること / 正常なボディで 200/201 が返ること
- **リダイレクト** — 未ログイン時に `/login` にリダイレクトされること
- **ブラウザ操作テスト** — Playwright MCP を使ってフォーム入力・ボタンクリック・画面遷移を自動検証する

Playwright MCP が有効な場合（`.mcp.json` が読み込まれている場合）は、ブラウザを実際に操作して以下を確認する：
- ログイン・登録フォームが正常に動作すること
- ページ遷移が正しいこと
- エラー表示が出ないこと

### 3. Notion に機能ページを作成

意思決定ログ（`collection://6562bc59-00d2-4e9d-baf2-2d83dc60f22d`）に、以下の内容でページを作成する：

```
会議名: [機能名] — 実装完了レポート
種別: 定例
関連フェーズ: Phase X
日付: 実施日
決定事項: 何を作ったか・テスト結果・判明した問題・次のステップ
```

ページ本文に必ず含める：
- 作成・変更したファイル一覧
- 実施したテストと結果（OK / NG）
- 発生したエラーと修正内容（あれば）
- 残課題・次回への申し送り

### 4. Git にコミット・プッシュ

リモートリポジトリ：`https://github.com/hiraku749/Idec.git`（branch: main）

```bash
git add <変更したファイル>     # -A や . は使わず対象ファイルを明示する
git commit -m "feat: [機能名] — [一言説明]"
git push origin main
```

コミットメッセージは Conventional Commits 形式：
- `feat:` — 新機能
- `fix:` — バグ修正
- `refactor:` — リファクタリング
- `docs:` — ドキュメントのみの変更

`.env.local` は `.gitignore` に含まれているため絶対にコミットしない。

### 5. Notion タスク・ロードマップを更新

- 完了したタスクのステータスを `完了` に変更
- ロードマップの進捗率を更新

---

## MCP・Notion 連携

Notion タスク管理は `mcp__notion-mcp__*` ツールを使う（`mcp__claude_ai_Notion__*` はワークスペース不一致のため使えない）。

詳細な操作方法・データソースIDは `/Users/ogurahiraku/Desktop/Idec/Notion.md` を参照。

**毎回の会話終了前に Notion を更新すること：**
- ロードマップのフェーズステータス・進捗率
- ダッシュボードの「現在のフェーズ」テキスト
- 意思決定ログ（ミーティングメモ）に作業サマリーを追加

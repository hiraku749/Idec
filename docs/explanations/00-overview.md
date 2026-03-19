# Phase 0 完了時点の概要 — 何を作ったか

---

## プロジェクト全体像

**Idec（アイデック）** — アイデアを実行に変えるAIプラットフォーム。
ノートにメモを書くと、AIがそれを記憶・検索・分析して思考をサポートしてくれるWebアプリ。

---

## フォルダ構成（現時点）

```
Idec/
├── app/                   ← Next.js のページ・API（ここがWebアプリの本体）
│   ├── (auth)/            ← ログイン・登録ページ（認証前のページ）
│   ├── (main)/            ← ダッシュボード・ノート等（ログイン後のページ）
│   ├── api/               ← サーバー側の処理（データ取得・AI呼び出し等）
│   ├── layout.tsx         ← 全ページ共通のHTML骨格（フォント・言語設定など）
│   └── globals.css        ← 全ページ共通のCSS
├── components/
│   ├── ui/                ← shadcn/ui が生成したボタン・カード等の部品
│   ├── notes/             ← ノート関連のUI部品（まだ空）
│   ├── ai/                ← AI関連のUI部品（まだ空）
│   └── shared/            ← サイドバー等の共通UI部品（まだ空）
├── lib/
│   ├── supabase/          ← データベース接続の設定（まだ空）
│   ├── claude/            ← Claude AI呼び出しの設定（まだ空）
│   ├── pgvector/          ← ベクトル検索の設定（まだ空）
│   ├── validations/       ← 入力値チェックのルール（まだ空）
│   └── utils/             ← 便利な関数集（cn.ts・format.ts を作成済み）
├── types/
│   └── index.ts           ← 型定義（まだ空）
├── docs/
│   ├── explanations/      ← 解説書フォルダ（このファイルがある場所）
│   └── supabase-setup.sql ← DBテーブル作成SQL
├── .env.local             ← 環境変数（APIキー等。Gitに上げない秘密ファイル）
├── package.json           ← 使っているライブラリの一覧・起動コマンド
├── tsconfig.json          ← TypeScript の設定
├── tailwind.config.ts     ← Tailwind CSS（デザイン）の設定
└── next.config.mjs        ← Next.js の設定
```

---

## インストール済みのライブラリ

| ライブラリ | 役割 |
|-----------|------|
| `next` 14 | Webフレームワーク本体。ページのルーティングやサーバー処理を担う |
| `react` / `react-dom` | UI部品（コンポーネント）を作るための基盤ライブラリ |
| `typescript` | JavaScriptに型チェックを追加した言語。バグを事前に防げる |
| `tailwindcss` | クラス名を書くだけでデザインができるCSSフレームワーク |
| `shadcn/ui` | Tailwind製の美しいUIコンポーネント集（button・card・dialog等） |
| `@supabase/supabase-js` | SupabaseのDB・認証を操作するSDK |
| `@supabase/ssr` | Next.jsのサーバーサイドでSupabaseを使うためのアダプター |
| `@tiptap/react` 他 | リッチテキストエディタ（ノート入力に使用） |
| `@anthropic-ai/sdk` | Claude AI APIを呼び出すSDK |
| `openai` | OpenAI Embeddings API（テキストをベクトルに変換）を呼び出すSDK |
| `zod` | APIの入力値を安全に検証するバリデーションライブラリ |
| `next-themes` | ダーク/ライトモード切り替えを簡単に実装するライブラリ |
| `date-fns` | 日付のフォーマット・計算をする便利ライブラリ |
| `prettier` | コードを自動整形するツール |
| `eslint` | コードの問題を検出する静的解析ツール |

---

## 設定済みの外部サービス

| サービス | 役割 | 状態 |
|---------|------|------|
| Supabase | データベース（PostgreSQL）・認証・ファイルストレージ | 接続設定済み・SQL未実行 |
| Anthropic Claude API | AIチャット・テキスト生成 | APIキー未設定 |
| OpenAI API | テキストのベクトル変換（意味検索用） | APIキー未設定 |

---

## 次にやること（Phase 1：認証）

1. **DBテーブル作成** — `docs/supabase-setup.sql` をSupabaseで実行
2. **Supabase Auth設定** — メール・Google OAuthを有効化
3. **認証コード実装** — ログイン・登録ページの動作を実装

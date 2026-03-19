# 初回実装 — タスクリスト

---

## Phase 0：環境構築

- [ ] Next.js 14 プロジェクト作成（App Router / TypeScript / Tailwind / ESLint）
- [ ] Prettier 導入・ESLint との統合設定（`.prettierrc` / `eslint-config-prettier`）
- [ ] shadcn/ui 初期化 + 基本コンポーネント追加（button, input, card, dialog, dropdown-menu, toast, sidebar, sheet）
- [ ] 依存パッケージインストール
  - [ ] `@supabase/supabase-js` / `@supabase/ssr`
  - [ ] `@tiptap/react` / `@tiptap/starter-kit` / `@tiptap/extension-task-list` / `@tiptap/extension-task-item` / `@tiptap/extension-placeholder`
  - [ ] `@anthropic-ai/sdk`
  - [ ] `openai`
  - [ ] `zod` / `next-themes` / `date-fns`
- [ ] Supabase プロジェクト作成
- [ ] pgvector 拡張有効化
- [ ] DB テーブル作成（SQL 実行：notes / todos / projects / profiles / ai_usage）
- [ ] RLS ポリシー設定（全テーブル）
- [ ] ベクトル検索用 IVFFlat インデックス作成
- [ ] Supabase Auth 設定（メール / Google OAuth）
- [ ] `.env.local` 作成（全環境変数を設定）
- [ ] `tsconfig.json` に `strict: true` 確認
- [ ] フォルダ構成を `repository-structure.md` に従って整備

**完了条件：** `npm run dev` でエラーなく起動し、Supabase ダッシュボードで全テーブルが確認できる

---

## Phase 1：認証

- [ ] `lib/supabase/client.ts` — ブラウザ用 Supabase クライアント作成
- [ ] `lib/supabase/server.ts` — Server Component / API Route 用クライアント作成
- [ ] `lib/supabase/middleware.ts` — セッション更新ヘルパー作成
- [ ] `middleware.ts` — 認証ガード（未ログイン → `/login` リダイレクト）
- [ ] `app/(auth)/layout.tsx` — 認証ページ共通レイアウト（Sidebar なし）
- [ ] `app/(auth)/login/page.tsx` — ログインページ UI
  - [ ] メールアドレス・パスワードフォーム
  - [ ] Google ログインボタン
  - [ ] 新規登録リンク
  - [ ] エラーメッセージ表示
- [ ] `app/(auth)/register/page.tsx` — 新規登録ページ UI
  - [ ] メールアドレス・パスワード・表示名フォーム
  - [ ] 登録成功時に `/dashboard` へリダイレクト
- [ ] `app/api/auth/callback/route.ts` — OAuth コールバック処理
- [ ] Supabase トリガー：`auth.users` 挿入時に `profiles` テーブルへ自動挿入
- [ ] ログアウト機能（Sidebar にボタン配置）

**完了条件：** メール・Google でログイン/登録ができ、未ログイン時にリダイレクトされる

---

## Phase 2：ノート機能（Core）

### 型定義・バリデーション
- [ ] `types/index.ts` — Note / Todo / Project / Profile / AiUsage の型定義
- [ ] `lib/validations/schemas.ts` — ノート作成・更新の Zod スキーマ

### API Route
- [ ] `app/api/notes/route.ts`
  - [ ] GET：ノート一覧取得（検索クエリ・タグフィルター対応）
  - [ ] POST：ノート作成（Zod バリデーション → DB 保存 → ベクトル埋め込み生成）
- [ ] `app/api/notes/[id]/route.ts`
  - [ ] GET：ノート詳細取得
  - [ ] PATCH：ノート更新（内容変更 → version_history に旧版を追加 → ベクトル再生成）
  - [ ] DELETE：論理削除（`is_deleted = true`）
- [ ] `app/api/notes/[id]/restore/route.ts` — ゴミ箱から復元（`is_deleted = false`）
- [ ] `app/api/embed/route.ts` — Tiptap JSON → プレーンテキスト変換 → OpenAI Embeddings → DB 保存

### ユーティリティ
- [ ] `lib/pgvector/embed.ts` — OpenAI Embeddings API 呼び出し
- [ ] `lib/utils/tiptap.ts` — Tiptap JSON ↔ プレーンテキスト変換ヘルパー

### UI コンポーネント
- [ ] `components/notes/note-editor.tsx` — Tiptap エディタ（StarterKit + TaskList + TaskItem + Placeholder）
- [ ] `components/notes/note-card.tsx` — ノートカード（タイトル・タグ・更新日時・ピン表示）
- [ ] `components/notes/note-list.tsx` — ノート一覧（グリッド表示 + ソート）
- [ ] `components/shared/search-bar.tsx` — 検索バー（全文検索 + タグフィルター ドロップダウン）

### ページ
- [ ] `app/(main)/notes/page.tsx` — ノート一覧ページ（検索バー + ノートリスト + 新規作成ボタン）
- [ ] `app/(main)/notes/new/page.tsx` — 新規作成ページ（タグ選択 → エディタ → 保存）
- [ ] `app/(main)/notes/[id]/page.tsx` — ノート詳細・編集ページ（エディタ + ピン留め・アーカイブ・削除ボタン）

**完了条件：** ノートの CRUD・検索・タグフィルター・ピン留め・アーカイブ・ゴミ箱・復元が動作する

---

## Phase 3：ダッシュボード

- [ ] `app/(main)/layout.tsx` — メインレイアウト（Sidebar + コンテンツエリア）
- [ ] `components/shared/sidebar.tsx` — サイドバー
  - [ ] ナビゲーション（ダッシュボード・ノート・プロジェクト・OwnAI・壁打ち）
  - [ ] 最近のノート一覧（直近5件）
  - [ ] ログアウトボタン
  - [ ] モバイル時はハンバーガーメニュー（Sheet コンポーネント）
- [ ] `app/(main)/dashboard/page.tsx` — ダッシュボードページ
  - [ ] ピン留めノートセクション（上部）
  - [ ] 最近使ったノートセクション（カード形式）
  - [ ] ToDo 未完了一覧セクション（チェックボックス付き）

**完了条件：** ログイン後にダッシュボードが表示され、ピン留め・最近のノート・未完了 ToDo が正しく表示される

---

## Phase 4：OwnAIエージェント（MVP版）

### AI ユーティリティ
- [ ] `lib/claude/client.ts` — Claude API 呼び出し（ストリーミング対応）
- [ ] `lib/claude/prompts.ts` — OwnAI 用システムプロンプトテンプレート
- [ ] `lib/claude/streaming.ts` — SSE ストリーミングヘルパー（ReadableStream → Response）
- [ ] `lib/pgvector/search.ts` — コサイン類似度検索（プロンプト → ベクトル化 → 上位N件取得）

### API Route
- [ ] `app/api/agent/route.ts`
  - [ ] 認証チェック
  - [ ] AI 使用回数チェック（`ai_usage` テーブル参照 → 超過時 429）
  - [ ] ナレッジ取得（指定ノート or pgvector 検索）
  - [ ] システムプロンプト組み立て
  - [ ] Claude API 呼び出し（ストリーミング）
  - [ ] SSE レスポンス返却
  - [ ] 使用回数インクリメント

### UI コンポーネント
- [ ] `components/ai/chat-input.tsx` — プロンプト入力（テキストエリア + 送信ボタン）
- [ ] `components/ai/chat-message.tsx` — メッセージ表示（ユーザー / AI 区別。AI はストリーミング表示）
- [ ] `components/ai/knowledge-selector.tsx` — ナレッジ指定モーダル（ノート一覧から選択）
- [ ] `components/ai/usage-meter.tsx` — AI 使用回数の残数表示（プログレスバー）
- [ ] `components/shared/plan-gate.tsx` — pro 限定ゲート（使用回数超過時にアップグレード促進表示）

### ページ
- [ ] `app/(main)/agent/page.tsx` — OwnAI ページ
  - [ ] 左パネル：ナレッジ選択
  - [ ] 中央：チャット履歴
  - [ ] 下部：プロンプト入力 + 使用量メーター
  - [ ] 回答の「ノートに保存」ボタン

**完了条件：** プロンプト送信 → ノートをナレッジとしたストリーミング回答 → ノート保存が動作する。free は月30回で制限メッセージが出る

---

## Phase 5：MVP仕上げ

- [ ] `next-themes` 導入・ダーク/ライトモード切り替え UI 実装
- [ ] 全コンポーネントに `dark:` プレフィックスでダークモード対応
- [ ] Sidebar をモバイルでハンバーガーメニューに切り替え（shadcn/ui Sheet）
- [ ] 全ページのレスポンシブ確認・調整（sm / md / lg ブレークポイント）
- [ ] shadcn/ui テーマカラーのカスタマイズ（ブランドカラー設定）
- [ ] 余白・フォントサイズの統一
- [ ] 全受け入れ条件（requirements.md）の通しチェック・バグ修正
- [ ] GitHub リポジトリに push
- [ ] Vercel プロジェクト作成・GitHub 連携
- [ ] Vercel に環境変数を設定
- [ ] デプロイ・公開 URL で動作確認

**完了条件：** 公開 URL で全受け入れ条件が満たされ、モバイル・ダークモードで正常に動作する

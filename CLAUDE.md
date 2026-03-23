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
npm run test         # Vitest（ユニットテスト）
npx tsc --noEmit     # 型チェック（コード変更後は必ず実行）
```

型チェックを必ずビルド前に通すこと。`npm run lint` は型エラーを検出しない。

---

## ルーティング構造

```
app/
├── (auth)/                   # 認証前ページ（URLに影響しない）
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/                   # 認証後ページ（layout.tsx で認証チェック）
│   ├── dashboard/page.tsx
│   ├── notes/                # ノート CRUD
│   │   ├── page.tsx          # 一覧
│   │   ├── new/page.tsx      # 新規作成
│   │   └── [id]/page.tsx     # 詳細・編集
│   ├── projects/             # プロジェクト CRUD
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── settings/page.tsx     # テーマ・プロフィール
│   ├── agent/page.tsx        # OwnAI（チャット型質問応答）
│   ├── wall/page.tsx         # 壁打ち（セッション付きチャット）
│   ├── enhance/page.tsx      # 文章増強
│   ├── roadmap/page.tsx      # ロードマップ生成
│   ├── context/page.tsx      # コンテキストエンジニアリング
│   └── diagram/page.tsx      # 図式生成
└── api/
    ├── notes/                # GET/POST, [id]/(GET/PATCH/DELETE), [id]/restore
    ├── projects/             # GET/POST, [id]/(GET/PATCH/DELETE)
    ├── agent/route.ts        # POST（OwnAI質問）
    ├── wall/route.ts         # GET（セッション一覧）/ POST（メッセージ送信）
    ├── enhance/route.ts      # POST（文章増強）
    ├── roadmap/route.ts      # POST（ロードマップ生成）
    └── embed/route.ts        # ベクトル埋め込み
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

## Tiptap エディタ（リッチテキスト編集）

**重要: StarterKit は使わない。** 個別の拡張を明示的にインポートする。

### 拡張一覧（`components/notes/note-editor.tsx`）

| カテゴリ | 拡張 |
|---------|------|
| コア | Document, Paragraph, Text |
| マーク | Bold, Italic, Strike, Code, Underline, TextStyle, Color, Highlight, Link |
| ブロック | Heading (1-3), BulletList, OrderedList, ListItem, TaskList, TaskItem, Blockquote, HorizontalRule, CodeBlockLowlight, HardBreak |
| カスタム | Callout (`lib/tiptap/callout-extension.ts`), Details/DetailsSummary/DetailsContent (`lib/tiptap/details-extension.ts`) |
| ユーティリティ | History, Dropcursor, Gapcursor, Placeholder |

### カスタム拡張の作り方

`lib/tiptap/` にファイルを作成し、`Node.create()` で定義：

```typescript
import { Node, mergeAttributes } from '@tiptap/react'

export const MyBlock = Node.create({
  name: 'myBlock',
  group: 'block',
  content: 'block+',
  // parseHTML / renderHTML を定義
})
```

### ツールバーの注意点

`components/notes/editor-toolbar.tsx` でツールバーを実装。重要な設計判断：

- **`onMouseDown` + `e.preventDefault()`** を使う（`onClick` ではなく）。エディタからフォーカスを奪わないため
- **`editor.on('transaction', handler)`** でエディタ状態変更を購読し、ツールバーの `isActive` 表示をリアルタイム更新
- カラーピッカー・リンク入力など popup 内の `input`/`select` は `preventDefault` 対象外にする

---

## ノート保存の仕組み

1. Tiptap エディタが JSON（`TiptapContent = Record<string, unknown>`）を出力
2. `lib/utils/tiptap.ts` の `tiptapToText()` でプレーンテキストに変換
3. `lib/pgvector/embed.ts` の `embedText()` で OpenAI Embeddings API（`text-embedding-3-small`）を呼び出してベクトル化
4. Supabase の `notes` テーブルに `content`（JSONB）と `vector_embedding`（VECTOR(1536)）を保存

ノート更新時は `version_history`（最大20世代）に旧バージョンを蓄積する。

### ToDo 同期

`tag === 'ToDo'` のノートを保存すると、`lib/utils/todo-sync.ts` の `extractTodosFromContent()` が Tiptap JSON 内の TaskList アイテムを再帰抽出し、`todos` テーブルに同期する（更新時は delete + insert で全置換）。ダッシュボードの「未完了 ToDo」セクションはこのテーブルを参照する。

---

## AI パイプラインアーキテクチャ

`lib/pipeline/` に集約された6モジュール構成：

```
lib/pipeline/
├── config.ts            # トークン予算・プラン上限・検索デフォルト
├── ai/client.ts         # Anthropic Claude API クライアント（claude-sonnet-4-20250514）
├── context/assemble.ts  # 優先度ベースのコンテキスト組み立て（トークン予算内）
├── retrieve/            # データ取得層
│   ├── vector-search.ts # pgvector 類似検索
│   ├── direct-fetch.ts  # ノート・プロジェクト直接取得
│   └── session-history.ts # 壁打ちセッション履歴取得
├── transform/           # テキスト処理
│   ├── tokenizer.ts     # トークン数推定
│   ├── truncate.ts      # トークン予算でのテキスト切り詰め
│   └── summarize.ts     # 要約処理
├── output/              # 結果処理
│   ├── actions.ts       # ノート作成/更新、セッション更新、ロードマップ保存
│   └── usage.ts         # AI使用量カウント（checkUsage / incrementUsage）
└── tools/               # ツール別パイプライン
    ├── own-ai.ts        # OwnAI（RAG質問応答）
    ├── wall.ts          # 壁打ち（セッション管理 + 履歴要約）
    ├── enhance.ts       # 文章増強（上書き/新規保存モード）
    ├── roadmap.ts       # ロードマップ生成
    ├── diagram.ts       # 図式生成
    └── context-tool.ts  # コンテキストエンジニアリング
```

### プラン上限

```typescript
// lib/pipeline/config.ts
PLAN_LIMITS = { free: 30, pro: 500 }  // 月あたりAI使用回数
```

### AI 人格（3タイプ）

`rational`（論理重視）/ `balanced`（バランス型）/ `ethical`（倫理重視）— ユーザーの `default_ai_type` 設定で切替。各ツールの API Route で AI 人格に応じたシステムプロンプトを適用。

### 壁打ちセッション

- `WALL_SESSION.summarizeThreshold = 20` — 20メッセージ超で古いメッセージを要約
- `WALL_SESSION.maxMessagesInContext = 10` — コンテキストに含める直近メッセージ数
- セッションは `wall_sessions` テーブルに永続化、`is_active` フラグで管理

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
- **サーバーコンポーネント** — Tailwind クラスを直接書く

---

## CSS / Tailwind の注意点

`globals.css` には `@import "shadcn/tailwind.css"` や `@import "tw-animate-css"` を書いてはいけない。これらはビルドエラーを引き起こす。

shadcn の CSS 変数（`--border`, `--ring`, `--primary` 等）を Tailwind クラスとして使うには `tailwind.config.ts` の `theme.extend.colors` に登録が必要。登録済み。

`globals.css` の末尾にエディタ用CSS（`.note-editor-wrapper`, `.tiptap`, `.callout`, `.toggle-block`, syntax highlight classes）が定義されている。エディタのスタイル変更はここで行う。

---

## 規約

- **TypeScript strict 必須**。`any` 禁止
- コンポーネントは `function` 宣言、ユーティリティはアロー関数
- ファイル名は `kebab-case`、コンポーネント名は `PascalCase`
- Claude API 呼び出しは `lib/pipeline/ai/client.ts` 経由に統一
- `NEXT_PUBLIC_` 以外の環境変数はクライアントに露出させない

---

## 現在の実装状態

| フェーズ | 状態 | 内容 |
|---------|------|------|
| Phase 0 | 完了 | 環境構築・依存関係・Supabase接続・SQL実行 |
| Phase 1 | 完了 | 認証（メールログイン・登録・ミドルウェア） |
| Phase 2 | 完了 | ノート CRUD・Tiptap エディタ・ベクトル検索基盤・パイプライン基盤 |
| Phase 3 | 完了 | ダッシュボード・プロジェクトCRUD・設定ページ・ダークモード・Vitest・CI/CD |
| Phase 4 | 完了 | OwnAI エージェント・壁打ち（Claude API + pgvector + チャットUI） |
| Phase 5 | 進行中 | AIキャラクター壁打ち（ノート参照・Summary-First検索） |
| Phase 6 | 完了 | コンテキストエンジニアリング（複数ノート選択・目的別AI処理） |
| Phase 7 | 完了 | 文章増強（ノート選択・AI増強・保存） |
| Phase 8 | 完了 | ロードマップ機能（プロジェクト選択・AI生成・DB保存） |
| Phase 9 | 完了 | 図式生成（Mermaid・フローチャート・マインドマップ） |
| Phase 10 | 完了 | スコアリング（アイデア4軸AIスコアリング・レーダーチャート） |
| Phase 11 | 完了 | SWOT分析（AIによる4象限分析） |
| Phase 12 | 完了 | シンセシス（複数ノート統合分析・レポート生成） |
| Phase 13 | 完了 | インキュベーター（アイデアAIレビュー・育成管理） |
| Phase 14 | 完了 | グラフ（ノート・プロジェクト関係のネットワーク視覚化） |
| Phase 15 | 完了 | デイリーダイジェスト（24時間活動要約・今日のタスク提案） |
| Phase 16 | 完了 | エクスポート（Markdown / テキスト / HTML ダウンロード） |
| Phase 17 | 完了 | バックリンク（ノート間の前方・後方リンク表示） |
| Phase 18 | 完了 | テンプレート機能（議事録・アイデア出し等のシステムテンプレート） |
| Phase 19 | 完了 | クイックキャプチャ（Cmd+Shift+N でのメモ即時保存モーダル） |
| Phase 20 | 完了 | プロジェクトナレッジ連携（knowledge-toggle・ツール/ラボへの自動適用） |
| Phase 21 | 未着手 | ディスカッション（AI＋人間の混合・招待・履歴保存） |

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

Notion タスク管理は **`mcp__claude_ai_Notion__*`** ツールを使う。

主要なデータソースID：
- ロードマップ DB: `collection://0d46a1cb-7042-4e99-9c88-5b33bc083477`
- 意思決定ログ: `collection://6562bc59-00d2-4e9d-baf2-2d83dc60f22d`
- Idec MVP ダッシュボード: `eeeee33e-205b-45fe-aa1d-94abc652ba19`

**毎回の会話終了前に Notion を更新すること：**
- ロードマップのフェーズステータス・進捗率
- ダッシュボードの「現在のフェーズ」テキスト
- 意思決定ログ（ミーティングメモ）に作業サマリーを追加

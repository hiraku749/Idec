# 初回実装 — 実装設計

---

## 1. 実装アプローチ

### 全体方針

- Phase 0〜5 の順序で段階的に実装する
- 各 Phase は前の Phase に依存するため、順序を崩さない
- フロントエンドとバックエンド（API Route）を同一リポジトリで並行開発

### 技術選定（追加決定事項）

| 項目 | 選定 | 理由 |
|------|------|------|
| ノートエディタ | **Tiptap**（@tiptap/react + @tiptap/starter-kit） | Notionライクなブロックエディタ。スラッシュコマンド・チェックボックス・Markdown対応 |
| ノート保存形式 | **JSON**（Tiptap ネイティブ） | 構造化されており、ブロック操作・検索に強い。DBの `content` カラムは `jsonb` 型に変更 |
| ベクトル埋め込み | **OpenAI Embeddings API**（text-embedding-3-small） | 安価・高性能・pgvector との組み合わせ事例が豊富 |
| テーマ切り替え | **next-themes** | ダーク/ライトモード管理のデファクト |
| バリデーション | **Zod** | API Route の入力検証。TypeScript 型との統合が容易 |
| 日付操作 | **date-fns** | 軽量。リマインダー表示に使用 |

### 環境変数（追加）

```
# OpenAI（ベクトル埋め込み生成用）
OPENAI_API_KEY=
```

---

## 2. Phase別の実装設計

### Phase 0：環境構築

```
1. Next.js 14 プロジェクト作成（App Router）
   $ npx create-next-app@14 idec --typescript --tailwind --eslint --app --src-dir=false

2. 依存パッケージインストール
   $ npm install @supabase/supabase-js @supabase/ssr
   $ npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-placeholder
   $ npm install openai
   $ npm install @anthropic-ai/sdk
   $ npm install zod next-themes date-fns
   $ npm install -D prettier eslint-config-prettier

3. shadcn/ui 初期化
   $ npx shadcn-ui@latest init
   $ npx shadcn-ui@latest add button input card dialog dropdown-menu toast sidebar sheet

4. Supabase プロジェクト作成・設定
   - ダッシュボードから pgvector 拡張を有効化
   - SQL Editor で全テーブル作成（下記スキーマ参照）
   - RLS ポリシー設定

5. 環境変数設定（.env.local）

6. フォルダ構成を repository-structure.md に従って作成
```

### Phase 1：認証

**実装するファイル：**

| ファイル | 内容 |
|---------|------|
| `lib/supabase/client.ts` | ブラウザ用 Supabase クライアント |
| `lib/supabase/server.ts` | Server Component / API Route 用クライアント |
| `lib/supabase/middleware.ts` | 認証ミドルウェア（セッション更新） |
| `middleware.ts` | Next.js ミドルウェア（認証ガード） |
| `app/(auth)/login/page.tsx` | ログインページ |
| `app/(auth)/register/page.tsx` | 新規登録ページ |
| `app/(auth)/layout.tsx` | 認証ページ共通レイアウト |
| `app/api/auth/callback/route.ts` | OAuth コールバック処理 |

**認証フロー：**

```
[メールログイン]
ユーザー → LoginPage → supabase.auth.signInWithPassword()
→ 成功 → /dashboard にリダイレクト
→ 失敗 → エラーメッセージ表示

[Googleログイン]
ユーザー → LoginPage → supabase.auth.signInWithOAuth({ provider: 'google' })
→ Google 認証画面 → /api/auth/callback → /dashboard にリダイレクト

[認証ガード]
middleware.ts → Supabase セッション確認
→ 未認証 → /login にリダイレクト
→ 認証済み → リクエスト続行

[ログアウト]
supabase.auth.signOut() → /login にリダイレクト
```

### Phase 2：ノート機能（Core）

**実装するファイル：**

| ファイル | 内容 |
|---------|------|
| `types/index.ts` | Note / Todo / Project 等の型定義 |
| `lib/validations/schemas.ts` | Zod スキーマ（ノート作成・更新） |
| `app/api/notes/route.ts` | GET（一覧）/ POST（作成） |
| `app/api/notes/[id]/route.ts` | GET / PATCH / DELETE |
| `app/api/notes/[id]/restore/route.ts` | ゴミ箱から復元 |
| `app/api/embed/route.ts` | OpenAI Embeddings でベクトル生成 → DB保存 |
| `components/notes/note-editor.tsx` | Tiptap ベースのエディタ |
| `components/notes/note-card.tsx` | ノートカード（一覧表示用） |
| `components/notes/note-list.tsx` | ノート一覧（検索・フィルター付き） |
| `components/shared/search-bar.tsx` | 検索バー（全文検索 + タグフィルター） |
| `app/(main)/notes/page.tsx` | ノート一覧ページ |
| `app/(main)/notes/new/page.tsx` | 新規作成ページ |
| `app/(main)/notes/[id]/page.tsx` | ノート詳細・編集ページ |

**ノート保存フロー：**

```
ユーザーがエディタで編集 → 保存ボタン
→ POST /api/notes（新規）or PATCH /api/notes/[id]（更新）
  → Zod バリデーション
  → DB に保存（content は jsonb でTiptap JSON を格納）
  → POST /api/embed → Tiptap JSON → プレーンテキスト変換 → OpenAI Embeddings API
  → vector_embedding を DB に保存
→ フロントに成功レスポンス
```

**検索フロー：**

```
[全文検索]
GET /api/notes?q=キーワード
→ Supabase の textSearch（PostgreSQL tsvector）で title / content を検索

[タグフィルター]
GET /api/notes?tag=アイデア&userTags=開発,設計
→ WHERE tag = 'アイデア' AND user_tags @> '{開発,設計}'
```

**Tiptap エディタ構成：**

```typescript
const extensions = [
  StarterKit,              // 基本機能（見出し・太字・リスト等）
  TaskList,                // チェックボックスリスト（ToDo用）
  TaskItem.configure({
    nested: true,          // ネストされたチェックボックス
  }),
  Placeholder.configure({
    placeholder: 'ここに入力...',
  }),
]
```

### Phase 3：ダッシュボード

**実装するファイル：**

| ファイル | 内容 |
|---------|------|
| `app/(main)/dashboard/page.tsx` | ダッシュボードページ |
| `app/(main)/layout.tsx` | メインレイアウト（Sidebar + 認証チェック） |
| `components/shared/sidebar.tsx` | サイドバーナビゲーション |

**ダッシュボード構成：**

```
┌──────────────────────────────────────────────┐
│  Sidebar  │  ダッシュボード                    │
│           │                                    │
│  📋 ノート │  ── ピン留めノート ──               │
│  📁 PJ    │  [NoteCard] [NoteCard] [NoteCard]  │
│  🤖 AI    │                                    │
│  ⚡ 壁打ち │  ── 最近のノート ──                 │
│           │  [NoteCard] [NoteCard] [NoteCard]  │
│  ──────── │                                    │
│  最近の    │  ── ToDo未完了 ──                   │
│  ノート    │  □ タスクA                         │
│  ・Note1  │  □ タスクB                         │
│  ・Note2  │  □ タスクC                         │
│  ・Note3  │                                    │
└──────────────────────────────────────────────┘
```

### Phase 4：OwnAIエージェント（MVP版）

**実装するファイル：**

| ファイル | 内容 |
|---------|------|
| `lib/claude/client.ts` | Claude API 呼び出しユーティリティ |
| `lib/claude/prompts.ts` | システムプロンプトテンプレート |
| `lib/claude/streaming.ts` | SSE ストリーミングヘルパー |
| `lib/pgvector/search.ts` | コサイン類似度検索 |
| `app/api/agent/route.ts` | OwnAI エンドポイント（SSE） |
| `components/ai/chat-input.tsx` | プロンプト入力 |
| `components/ai/chat-message.tsx` | メッセージ表示（ユーザー/AI区別） |
| `components/ai/knowledge-selector.tsx` | ナレッジ指定モーダル |
| `components/ai/usage-meter.tsx` | AI使用回数の残数表示 |
| `components/shared/plan-gate.tsx` | pro限定ゲート |
| `app/(main)/agent/page.tsx` | OwnAIエージェントページ |

**AI応答フロー：**

```
ユーザーがプロンプト送信
→ POST /api/agent
  → 認証チェック
  → AI使用回数チェック（free: 月30回 / pro: 月500回）
  → 超過 → 429 エラー + 制限メッセージ
  → OK → 続行
    → ナレッジ指定あり？
      → あり → 指定ノートを取得
      → なし → pgvector でプロンプトに近いノート上位5件を取得
    → システムプロンプト組み立て
      - ベースプロンプト
      - ナレッジ（取得したノートの内容）
      - ユーザープロンプト
    → Claude API（ストリーミング）
    → SSE でフロントにリアルタイム送信
    → AI使用回数をインクリメント
```

**システムプロンプト構造：**

```
あなたは Idec のAIアシスタントです。
ユーザーのノートをナレッジとして参照し、最適な回答を返してください。

## ナレッジ（ユーザーのノート）
---
タイトル: {note.title}
タグ: {note.tag}
内容: {note.content（プレーンテキスト変換済み）}
---
（複数ノート分繰り返し）

## ユーザーの質問
{user_prompt}
```

### Phase 5：MVP仕上げ

| 項目 | 内容 |
|------|------|
| ダーク/ライトモード | `next-themes` でテーマ切り替え。Tailwind `dark:` で全コンポーネント対応 |
| レスポンシブ | Sidebar → モバイルではハンバーガーメニュー（shadcn/ui Sheet 使用） |
| UI調整 | 余白・フォントサイズ・カラーの統一。shadcn/ui テーマカスタマイズ |
| バグ修正 | 全受け入れ条件を通しで確認・修正 |
| Vercelデプロイ | GitHub リポジトリ連携 → 自動デプロイ設定 → 動作確認 |

---

## 3. データ構造の変更

### DB スキーマ（idec_spec.md からの変更点）

| 変更 | 内容 | 理由 |
|------|------|------|
| `notes.content` | `text` → `jsonb` | Tiptap のネイティブ JSON を格納するため |
| `ai_usage` テーブル追加 | 月間AI使用回数を管理 | free/pro の使用回数制限に必要 |

**ai_usage テーブル：**

```sql
CREATE TABLE ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month text NOT NULL,        -- '2026-03' 形式
  usage_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year_month)
);
```

### Supabase SQL（初回セットアップ）

```sql
-- pgvector 有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- ノートテーブル
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  parent_note_id uuid REFERENCES notes(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  content jsonb DEFAULT '{}',
  tag text CHECK (tag IN ('アイデア', '情報', 'ToDo')) NOT NULL,
  user_tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  version_history jsonb DEFAULT '[]',
  vector_embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ToDo テーブル
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_done boolean DEFAULT false,
  reminder_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- プロジェクトテーブル
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  avatar_url text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  default_ai_type text DEFAULT 'balanced' CHECK (default_ai_type IN ('rational', 'balanced', 'ethical')),
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- AI使用量テーブル
CREATE TABLE ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year_month text NOT NULL,
  usage_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- ベクトル検索用インデックス
CREATE INDEX ON notes USING ivfflat (vector_embedding vector_cosine_ops) WITH (lists = 100);

-- 全文検索用インデックス
CREATE INDEX notes_title_search ON notes USING gin (to_tsvector('japanese', title));

-- RLS 有効化
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー（ユーザーは自分のデータのみ操作可能）
CREATE POLICY "Users can CRUD own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own todos" ON todos
  FOR ALL USING (note_id IN (SELECT id FROM notes WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can read own ai_usage" ON ai_usage
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. 影響範囲の分析

初回実装のため、既存コードへの影響はなし。
以下の点に注意：

| 注意点 | 対応 |
|--------|------|
| Tiptap JSON ↔ プレーンテキスト変換 | ベクトル埋め込み生成時と全文検索時に、JSON からプレーンテキストへの変換が必要。`lib/utils/tiptap.ts` にヘルパーを作成 |
| OpenAI API キー管理 | Claude API とは別に `OPENAI_API_KEY` が必要。architecture.md・CLAUDE.MD の環境変数セクションを更新 |
| Supabase Auth の User と profiles テーブルの連携 | `auth.users` にトリガーを設定し、ユーザー登録時に `profiles` テーブルに自動挿入 |
| ベクトル検索のインデックス | ノート数が少ない初期は IVFFlat の精度が低い場合がある。100件以上になったらインデックスを再構築 |

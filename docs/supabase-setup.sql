-- =================================================
-- Idec — Supabase セットアップSQL
-- Supabase の SQL Editor にこのファイル全体を貼り付けて実行する
-- =================================================

-- pgvector 拡張（Database > Extensions で有効化済みの場合は不要）
CREATE EXTENSION IF NOT EXISTS vector;

-- =================================================
-- テーブル作成（参照される順番に定義する）
-- =================================================

-- プロフィール（auth.users と 1:1）
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  default_ai_type TEXT NOT NULL DEFAULT 'balanced' CHECK (default_ai_type IN ('rational', 'balanced', 'ethical')),
  dark_mode       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- プロジェクト（notes より先に定義する必要がある）
CREATE TABLE IF NOT EXISTS public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ノート（profiles・projects を参照）
CREATE TABLE IF NOT EXISTS public.notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  parent_note_id   UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  title            TEXT NOT NULL DEFAULT '',
  content          JSONB NOT NULL DEFAULT '{}',
  tag              TEXT CHECK (tag IN ('アイデア', '情報', 'ToDo')),
  user_tags        TEXT[] NOT NULL DEFAULT '{}',
  is_pinned        BOOLEAN NOT NULL DEFAULT false,
  is_archived      BOOLEAN NOT NULL DEFAULT false,
  is_deleted       BOOLEAN NOT NULL DEFAULT false,
  version_history  JSONB NOT NULL DEFAULT '[]',
  vector_embedding VECTOR(1536),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ToDo（ノートに紐づく）
CREATE TABLE IF NOT EXISTS public.todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_done     BOOLEAN NOT NULL DEFAULT false,
  reminder_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ロードマップ
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  note_id         UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  steps           JSONB NOT NULL DEFAULT '[]',
  image_url       TEXT,
  structured_text TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 壁打ちセッション
CREATE TABLE IF NOT EXISTS public.wall_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ai_type    TEXT NOT NULL DEFAULT 'balanced' CHECK (ai_type IN ('rational', 'balanced', 'ethical')),
  messages   JSONB NOT NULL DEFAULT '[]',
  summary    TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ディスカッション
CREATE TABLE IF NOT EXISTS public.discussions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  note_id           UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  members           UUID[] NOT NULL DEFAULT '{}',
  invite_link       TEXT,
  invite_expires_at TIMESTAMPTZ,
  history_summary   TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 共有設定
CREATE TABLE IF NOT EXISTS public.share_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('note', 'project', 'discussion')),
  resource_id   UUID NOT NULL,
  shared_with   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  link_token    TEXT UNIQUE,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI使用回数
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- 'YYYY-MM' 形式
  count      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, year_month)
);

-- =================================================
-- updated_at 自動更新トリガー
-- =================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at        BEFORE UPDATE ON public.notes        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at     BEFORE UPDATE ON public.projects     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER roadmaps_updated_at     BEFORE UPDATE ON public.roadmaps     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER wall_sessions_updated_at BEFORE UPDATE ON public.wall_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =================================================
-- auth.users 挿入時に profiles を自動作成するトリガー
-- =================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================
-- RLS（Row Level Security）
-- =================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage      ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: 自分のみ参照・更新" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- notes
CREATE POLICY "notes: 自分のみ操作" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

-- todos（note経由で認可）
CREATE POLICY "todos: 自分のノートのみ" ON public.todos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.notes WHERE notes.id = todos.note_id AND notes.user_id = auth.uid())
  );

-- projects
CREATE POLICY "projects: 自分のみ操作" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- roadmaps（project経由で認可）
CREATE POLICY "roadmaps: 自分のプロジェクトのみ" ON public.roadmaps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = roadmaps.project_id AND projects.user_id = auth.uid())
  );

-- wall_sessions
CREATE POLICY "wall_sessions: 自分のみ操作" ON public.wall_sessions
  FOR ALL USING (auth.uid() = user_id);

-- discussions
CREATE POLICY "discussions: 自分のみ操作" ON public.discussions
  FOR ALL USING (auth.uid() = user_id);

-- share_settings
CREATE POLICY "share_settings: 自分のリソースのみ" ON public.share_settings
  FOR ALL USING (auth.uid() = shared_with OR shared_with IS NULL);

-- ai_usage
CREATE POLICY "ai_usage: 自分のみ参照・更新" ON public.ai_usage
  FOR ALL USING (auth.uid() = user_id);

-- =================================================
-- IVFFlat インデックス（ベクトル検索高速化）
-- =================================================

CREATE INDEX IF NOT EXISTS notes_vector_embedding_idx
  ON public.notes
  USING ivfflat (vector_embedding vector_cosine_ops)
  WITH (lists = 100);

-- =================================================
-- Phase 3: projects テーブルにメタデータカラム追加
-- =================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS goal   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS deadline DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'active', 'completed', 'archived'));

-- =================================================
-- match_notes RPC（ベクトル検索用）
-- lib/pipeline/retrieve/vector-search.ts が依存
-- =================================================

CREATE OR REPLACE FUNCTION match_notes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    1 - (n.vector_embedding <=> query_embedding) AS similarity
  FROM public.notes n
  WHERE
    n.is_deleted = false
    AND n.vector_embedding IS NOT NULL
    AND (filter_user_id IS NULL OR n.user_id = filter_user_id)
    AND (filter_project_id IS NULL OR n.project_id = filter_project_id)
    AND 1 - (n.vector_embedding <=> query_embedding) > match_threshold
  ORDER BY n.vector_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =================================================
-- 新規ツール用テーブル追加マイグレーション
-- Tool 1: note_scores（アイデアスコアリング）
-- Tool 2: templates（テンプレートライブラリ）
-- Tool 3: note_links（ノートリンク）
-- Tool 11: incubations（アイデアインキュベーター）
-- =================================================

-- 1. note_scores — アイデアスコアリング
CREATE TABLE IF NOT EXISTS note_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feasibility INTEGER NOT NULL CHECK (feasibility BETWEEN 1 AND 5),
  impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
  effort INTEGER NOT NULL CHECK (effort BETWEEN 1 AND 5),
  originality INTEGER NOT NULL CHECK (originality BETWEEN 1 AND 5),
  ai_comment TEXT NOT NULL DEFAULT '',
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_note_scores_note_id ON note_scores(note_id);
CREATE INDEX IF NOT EXISTS idx_note_scores_user_id ON note_scores(user_id);

ALTER TABLE note_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scores" ON note_scores
  FOR ALL USING (auth.uid() = user_id);

-- 2. templates — テンプレートライブラリ
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL DEFAULT 'general',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read system templates" ON templates
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

-- 3. note_links — 双方向ノートリンク
CREATE TABLE IF NOT EXISTS note_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_note_id, target_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);

ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own links" ON note_links
  FOR ALL USING (auth.uid() = user_id);

-- 4. incubations — アイデアインキュベーター
CREATE TABLE IF NOT EXISTS incubations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'incubating' CHECK (status IN ('incubating', 'reviewed', 'cancelled')),
  ai_review JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incubations_user_id ON incubations(user_id);
CREATE INDEX IF NOT EXISTS idx_incubations_review_date ON incubations(review_date);

ALTER TABLE incubations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own incubations" ON incubations
  FOR ALL USING (auth.uid() = user_id);

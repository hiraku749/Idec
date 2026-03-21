-- =================================================
-- Phase 10: ディスカッション用テーブル
-- =================================================

-- 1. discussions — ルーム
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- 作成者
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  members UUID[] NOT NULL DEFAULT '{}',                                -- 参加者UUIDリスト
  invite_token TEXT UNIQUE,                                            -- 招待トークン
  invite_expires_at TIMESTAMPTZ,                                       -- 招待有効期限
  history_summary TEXT NOT NULL DEFAULT '',                            -- AI要約
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_invite_token ON discussions(invite_token);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
-- 作成者 or メンバーが閲覧・操作可能
CREATE POLICY "Members can view discussions" ON discussions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(members));
CREATE POLICY "Creator can update discussions" ON discussions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create discussions" ON discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creator can delete discussions" ON discussions
  FOR DELETE USING (auth.uid() = user_id);

-- 2. discussion_messages — チャットメッセージ
CREATE TABLE IF NOT EXISTS discussion_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '名無し',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_messages_discussion_id ON discussion_messages(discussion_id);

ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view messages" ON discussion_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM discussions d
      WHERE d.id = discussion_id
        AND (d.user_id = auth.uid() OR auth.uid() = ANY(d.members))
    )
  );
CREATE POLICY "Members can insert messages" ON discussion_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM discussions d
      WHERE d.id = discussion_id
        AND (d.user_id = auth.uid() OR auth.uid() = ANY(d.members))
    )
  );

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_messages;

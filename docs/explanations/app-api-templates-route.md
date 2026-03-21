# app/api/templates/route.ts

## このファイルは何をするのか
テンプレートの一覧取得（GET）と新規作成（POST）を提供するAPIエンドポイント。

## なぜこのファイルが必要なのか
ユーザーが独自のノートテンプレートをCRUD管理するため。システムテンプレートとユーザーテンプレートを統合的に取得できる窓口として機能する。

## コードの概要
- **GET**: `templates` テーブルからシステムテンプレート（`is_system=true`）と自分のテンプレートを取得。`category` クエリパラメータでフィルタ可能
- **POST**: Zodで `title`, `description`, `content`, `category` をバリデーション後、`is_system: false` でユーザーテンプレートを作成
- テンプレートのcontentは `z.record(z.string(), z.unknown())` でTiptap JSONを受け入れ

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `zod`
- 使われているもの: `components/notes/template-selector.tsx`

## 関連ファイル
- `lib/templates/system-templates.ts` — コード内のシステムテンプレート定義
- `components/notes/template-selector.tsx` — テンプレート選択UI

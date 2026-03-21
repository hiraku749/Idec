# lib/templates/system-templates.ts

## このファイルは何をするのか
ノート作成時に利用可能なシステムプリセットテンプレートを定義するファイル。

## なぜこのファイルが必要なのか
ユーザーが白紙からノートを書き始めるのではなく、ビジネスモデルキャンバスやSWOT分析などの定型フォーマットから始められるようにする。DBに保存せずコード内で定義することで、全ユーザーに共通のテンプレートを即座に提供できる。

## コードの概要
- `SystemTemplate` インターフェースでid/title/description/category/contentの型を定義
- ヘルパー関数 `h()`（見出し）, `p()`（段落）, `bullet()`（箇条書き）, `hr()`（水平線）でTiptap JSONノードを簡潔に生成
- `SYSTEM_TEMPLATES` 配列に8種類のテンプレートを定義: ビジネスモデルキャンバス、SWOT分析、ユーザーストーリーマップ、KPT、ミーティングメモ、ブレインストーミング、プロジェクト提案書、デイリージャーナル
- カテゴリ: business / analysis / product / team / ideation / personal

## 依存関係
- 使っているもの: `@/types`（TiptapContent型）
- 使われているもの: `components/notes/template-selector.tsx`, `app/api/templates/route.ts`

## 関連ファイル
- `components/notes/template-selector.tsx` — テンプレート選択UIモーダル
- `app/api/templates/route.ts` — ユーザーテンプレートのCRUD API

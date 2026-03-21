# components/notes/template-selector.tsx

## このファイルは何をするのか
ノート作成時にシステムテンプレートとユーザーテンプレートを選択するモーダルUI。

## なぜこのファイルが必要なのか
白紙からノートを書くのは敷居が高い場合がある。テンプレートを選択することで、ビジネスモデルキャンバスやKPTなどの構造化されたフォーマットで即座にノート作成を開始できる。

## コードの概要
- `open` / `onClose` / `onSelect` のpropsでモーダルの開閉とテンプレート選択を制御
- カテゴリフィルタ（すべて/ビジネス/分析/プロダクト等）でテンプレートを絞り込み
- `SYSTEM_TEMPLATES` からシステムテンプレート、`/api/templates` からユーザーテンプレートを取得して表示
- 選択するとTiptap JSON形式のcontentとtitleを親コンポーネントに返す

## 依存関係
- 使っているもの: `react`, `lucide-react`, `@/lib/templates/system-templates`, `@/types`
- 使われているもの: `app/(main)/notes/new/page.tsx` などノート作成画面から利用

## 関連ファイル
- `lib/templates/system-templates.ts` — システムテンプレートの定義元
- `app/api/templates/route.ts` — ユーザーテンプレートの取得API

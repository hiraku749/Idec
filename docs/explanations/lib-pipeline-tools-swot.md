# lib/pipeline/tools/swot.ts

## このファイルは何をするのか
ノートやプロジェクトを基にSWOT分析（強み・弱み・機会・脅威）を自動生成するパイプライン。

## なぜこのファイルが必要なのか
SWOT分析はビジネスアイデアの評価に広く使われるフレームワーク。AIが自動で分析することで、ユーザーが見落としがちな視点を補完できる。プロジェクト単位でもノート単位でも分析可能にしている。

## コードの概要
- `SwotData` インターフェースで4象限（strengths/weaknesses/opportunities/threats）を文字列配列で定義
- `runSwot()` はプロジェクトID（任意）とノートIDを受け取り、両方のデータをコンテキストに含める
- AIにJSON形式で各3〜5項目のSWOT分析を要求
- 結果の各配列を `Array.isArray()` で安全にバリデーション

## 依存関係
- 使っているもの: `../config`, `../retrieve`（fetchNote, fetchProjectWithNotes）, `../transform`, `../context`, `../ai`, `../output`, `../types`
- 使われているもの: `app/api/swot/route.ts`, `lib/pipeline/index.ts`

## 関連ファイル
- `app/api/swot/route.ts` — このパイプラインを呼び出すAPIエンドポイント
- `app/(main)/swot/page.tsx` — SWOT分析の4象限UIページ

# lib/pipeline/tools/scoring.ts

## このファイルは何をするのか
ノートに対して実現可能性・インパクト・労力・独自性の4軸でAIスコアリングを行うパイプライン。

## なぜこのファイルが必要なのか
アイデアの価値を客観的に数値化する機能を提供する。ユーザーが自分のアイデアの強み・弱みを把握し、優先順位をつけるために使用される。スコアリングロジックをパイプラインとして分離することで、API Routeから簡潔に呼び出せる。

## コードの概要
- `ScoreData` インターフェースで4軸スコア（1〜5）とコメントの型を定義
- `runScoring()` がメイン関数。ノートを取得し、コンテキストを組み立て、AIにJSON形式でスコアを要求
- AIの応答から正規表現でJSONを抽出し、`clamp()` でスコアを1〜5の範囲に正規化
- 使用量カウント（`incrementUsage`）でプラン上限を管理

## 依存関係
- 使っているもの: `../config`, `../retrieve`, `../transform`, `../context`, `../ai`, `../output`, `../types`
- 使われているもの: `app/api/scoring/route.ts`, `lib/pipeline/index.ts`

## 関連ファイル
- `app/api/scoring/route.ts` — このパイプラインを呼び出すAPIエンドポイント
- `app/(main)/scoring/page.tsx` — スコアリング結果を表示するフロントエンドページ
- `lib/pipeline/config.ts` — `TOKEN_BUDGET.scoring` の定義元

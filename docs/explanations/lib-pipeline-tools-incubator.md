# lib/pipeline/tools/incubator.ts

## このファイルは何をするのか
寝かせたアイデアをAIが新しい視点で再分析するインキュベーターパイプライン。

## なぜこのファイルが必要なのか
アイデアを一定期間「寝かせる」ことで、新鮮な目で見直せるという発想法を支援する。さらに、インキュベーション期間中に作成された関連ノートとの繋がりをベクトル検索で発見し、アイデアの発展を促す。

## コードの概要
- `IncubatorReview` インターフェースで「新しい視点」「関連アイデア」「発展提案」「サマリー」の4項目を定義
- `runIncubator()` は対象ノートを取得後、`searchNotesByVector` でベクトル類似検索を実行し関連ノートを発見
- 対象ノート自身を除外した上で、関連ノートもコンテキストに含めてAIに分析を依頼
- JSONパース失敗時は生テキストをsummaryとして返すフォールバック付き

## 依存関係
- 使っているもの: `../config`, `../retrieve`（fetchNote, searchNotesByVector）, `../transform`, `../context`, `../ai`, `../output`, `../types`
- 使われているもの: `app/api/incubator/route.ts`, `lib/pipeline/index.ts`

## 関連ファイル
- `app/api/incubator/route.ts` — インキュベーション開始・レビュー実行のAPIエンドポイント
- `app/(main)/incubator/page.tsx` — インキュベーション一覧・レビュー結果のUIページ

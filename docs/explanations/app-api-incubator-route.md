# app/api/incubator/route.ts

## このファイルは何をするのか
アイデアインキュベーション（寝かせ）の開始・一覧取得・AIレビュー実行を行うAPIエンドポイント。

## なぜこのファイルが必要なのか
インキュベーション機能の3つの操作（開始・一覧・レビュー）を1つのエンドポイントで管理するため。POSTのリクエストボディの構造で「開始」と「レビュー実行」を分岐する設計。

## コードの概要
- **GET**: `status` パラメータ（デフォルト: incubating）でフィルタし、`incubations` テーブルからノートタイトル付きで取得
- **POST（レビュー）**: `incubationId` がある場合、対象インキュベーションを取得し `runIncubator()` を実行。結果をDBに保存しステータスを `reviewed` に更新
- **POST（開始）**: `noteId` と `days`（1〜30日、デフォルト7日）でインキュベーションを開始。レビュー日を計算してDBに保存

## 依存関係
- 使っているもの: `next/server`, `@/lib/supabase/server`, `@/lib/pipeline`（runIncubator）, `zod`
- 使われているもの: `app/(main)/incubator/page.tsx`

## 関連ファイル
- `lib/pipeline/tools/incubator.ts` — インキュベーターパイプラインの実装
- `app/(main)/incubator/page.tsx` — インキュベーション管理UIページ

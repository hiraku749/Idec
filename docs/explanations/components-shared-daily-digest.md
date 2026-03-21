# components/shared/daily-digest.tsx

## このファイルは何をするのか
AIが生成する「今日のダイジェスト」を表示するダッシュボード用ウィジェット。

## なぜこのファイルが必要なのか
ユーザーがダッシュボードを開いた時に、昨日の活動サマリーと今日の提案を一目で確認できるようにする。AIの力で毎日のタスク計画をサポートする機能。

## コードの概要
- 「生成」ボタンクリックで `/api/digest` にPOSTリクエストを送信
- `sessionStorage` に日付ベースのキャッシュを保存し、同日内は再リクエストを回避
- 初回マウント時にキャッシュがあれば即座に表示（APIコール不要）
- サマリーテキストと提案リスト（suggestions配列）を表示

## 依存関係
- 使っているもの: `react`, `lucide-react`
- 使われているもの: `app/(main)/dashboard/page.tsx`

## 関連ファイル
- `app/api/digest/route.ts` — ダイジェスト生成APIエンドポイント
- `lib/pipeline/tools/digest.ts` — ダイジェスト生成パイプライン

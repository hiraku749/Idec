# lib/pipeline/tools/digest.ts

## このファイルは何をするのか
過去24時間のユーザー活動をAIが要約し、今日やるべきことを提案するデイリーダイジェストパイプライン。

## なぜこのファイルが必要なのか
ユーザーが毎日の活動を振り返り、次のアクションを明確にするため。ノート・プロジェクト・ToDoの更新状況を自動収集し、AIがサマリーと提案を生成することで生産性を向上させる。

## コードの概要
- `runDigest()` はSupabaseから直接、過去24時間に更新されたノート・プロジェクト・未完了ToDoを並列取得
- 活動がない場合はAIを呼ばず、デフォルトメッセージを返す（トークン節約）
- AIにJSON形式（summary + suggestions配列）で返答を要求
- JSONパース失敗時はAIの生テキストをsummaryとして返すフォールバック付き

## 依存関係
- 使っているもの: `../config`, `../transform`, `../context`, `../ai`, `../output`, `@/lib/supabase/server`, `../types`
- 使われているもの: `app/api/digest/route.ts`, `lib/pipeline/index.ts`

## 関連ファイル
- `app/api/digest/route.ts` — このパイプラインを呼び出すAPIエンドポイント
- `components/shared/daily-digest.tsx` — ダイジェスト表示UIコンポーネント

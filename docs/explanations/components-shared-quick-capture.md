# components/shared/quick-capture.tsx

## このファイルは何をするのか
キーボードショートカット（Cmd+Shift+N）で起動する、アイデアの素早いメモ保存モーダル。

## なぜこのファイルが必要なのか
アイデアは思いついた瞬間に記録しないと忘れてしまう。ノート作成ページに遷移せずとも、どの画面からでもワンアクションでメモを保存できるUXが必要。

## コードの概要
- グローバルキーボードイベントリスナーで `Cmd+Shift+N` を監視し、モーダルを開閉
- タイトル（必須）・メモ（任意）・タグ選択（アイデア/情報/ToDo）のシンプルなフォーム
- `Cmd+Enter` で保存、`Escape` で閉じるキーボード操作に対応
- 保存時に `/api/notes` へPOSTし、Tiptap JSON形式のコンテンツを生成して送信
- モーダルが開いたらタイトル入力に自動フォーカス（`useRef` + `setTimeout`）

## 依存関係
- 使っているもの: `react`（useState, useEffect, useCallback, useRef）, `next/navigation`, `lucide-react`, `@/types`
- 使われているもの: `app/(main)/layout.tsx` などのレイアウトコンポーネントから配置

## 関連ファイル
- `app/api/notes/route.ts` — ノート作成APIエンドポイント
- `app/(main)/notes/new/page.tsx` — フルエディタでのノート作成ページ

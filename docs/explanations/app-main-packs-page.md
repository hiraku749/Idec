# app/(main)/packs/page.tsx

## このファイルは何をするのか
職業別ナレッジパックの一覧を表示し、ワンクリックでテンプレートノートをインポートできるページ。

## なぜこのファイルが必要なのか
ユーザーが自分の職業に合ったナレッジベースをゼロから構築しなくても、すぐに使えるテンプレートを提供するため。Skillshare のコース一覧に近いイメージ。

## コードの各部分の解説

### 状態管理
- `importing` — 現在インポート中のパックID（1つだけ同時処理）
- `imported` — インポート済みパックIDのSet
- `error` — エラーメッセージ

### `handleImport` 関数
`/api/profession-packs/[id]/import` に POST リクエストを送る。
成功したら `imported` Setにパックを追加し、ルーターをリフレッシュ（ノート一覧に反映）。

### カードUI
`pack.color`（グラデーション Tailwind クラス）で職業ごとに異なる背景色。
各カードにはテンプレートノートの一覧も表示し、中身が見える設計にしている。

### ボタン状態
- 通常: 「インポート」（Download アイコン）
- ロード中: 「インポート中...」（スピナー）
- 完了: 「インポート済み」（チェックアイコン）+ 無効化

## 依存関係
- **使っているもの**: `lib/profession-packs.ts`（パック定義）、`/api/profession-packs/[id]/import`（API）
- **使われているもの**: サイドバーの「ナレッジパック」リンク

## 関連ファイル
- `lib/profession-packs.ts` — パックのデータ定義
- `app/api/profession-packs/[id]/import/route.ts` — インポートAPI
- `components/shared/sidebar.tsx` — ナビゲーションリンク

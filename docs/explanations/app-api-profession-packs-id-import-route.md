# app/api/profession-packs/[id]/import/route.ts

## このファイルは何をするのか
指定した職業パックのテンプレートノートを、ログインユーザーのワークスペースにまとめてインポートするAPIエンドポイント。

## なぜこのファイルが必要なのか
`lib/profession-packs.ts` に定義されたテンプレートデータは「雛形」であり、実際にユーザーが使うには自分のノートとして保存する必要がある。このAPIがその変換処理を担う。

## コードの各部分の解説

### ルートパラメータ `[id]`
URLの `[id]` 部分（例: `engineer`）がパック識別子。`params.id` で受け取る。

### パック検索
```typescript
const pack = PROFESSION_PACKS.find((p) => p.id === params.id)
```
定数配列から一致するパックを探す。見つからなければ404を返す。

### ノートのループ作成
各テンプレートノートに対して:
1. タイトル＋本文テキストをOpenAI Embeddingsでベクトル化
2. Supabaseの `notes` テーブルにインサート
3. 作成されたIDを `created` 配列に追加

### レスポンス
```json
{ "imported": 3, "noteIds": ["uuid1", "uuid2", "uuid3"] }
```

## 依存関係
- **使っているもの**: `lib/profession-packs.ts`（パック定義）、`lib/pgvector/embed.ts`（ベクトル化）、`lib/utils/tiptap.ts`（テキスト変換）、Supabase
- **使われているもの**: `app/(main)/packs/page.tsx`（UIからfetch）

## 関連ファイル
- `lib/profession-packs.ts` — パックのテンプレートデータ定義
- `app/(main)/packs/page.tsx` — パック一覧・インポートUI
- `app/api/notes/route.ts` — 通常のノート作成API（同じ保存ロジック）

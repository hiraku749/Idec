# app/(main)/context/page.tsx

## 1. このファイルは何をするのか

コンテキストエンジニアリングページのUI。複数のノートを選択し、AIに「プロンプト生成」「簡潔化」「再構成」のいずれかを実行させ、結果を表示する。

## 2. なぜこのファイルが必要なのか

散らばったノートの情報を特定の目的に合わせてAIが変換する機能のUI。特にプロンプト生成モードでは、蓄積した知識を効率よくAIへの指示文に変換できる。

## 3. コードの各部分の解説

### 状態管理
```typescript
const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
```
- 複数選択対応。IDの配列で管理

### ノート複数選択
```typescript
function toggleNote(id: string) {
  setSelectedNoteIds((prev) =>
    prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
  )
}
```
- すでに選択中なら除外、未選択なら追加（トグル）

### コピー機能
```typescript
await navigator.clipboard.writeText(result)
setCopied(true)
setTimeout(() => setCopied(false), 2000)
```
- ブラウザのクリップボードAPIで結果をコピー
- 2秒後に「コピーしました！」表示を元に戻す

## 4. 依存関係

- **使っているもの**: `/api/notes`（ノート一覧取得）、`/api/context`（AI処理実行）
- **使われているもの**: サイドバーからナビゲーションで遷移

## 5. 関連ファイル

- `app/api/context/route.ts` — APIエンドポイント
- `lib/pipeline/tools/context-tool.ts` — AI処理ロジック

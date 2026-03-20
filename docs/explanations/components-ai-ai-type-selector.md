# components/ai/ai-type-selector.tsx

## 1. このファイルは何をするのか

AIの性格タイプ（分析的・バランス・倫理的）を選択するトグルボタンコンポーネント。

## 2. なぜこのファイルが必要なのか

Idecでは3種類のAI性格を切り替えて使える設計になっている。OwnAIページと壁打ちページの両方でこのセレクターが必要なため、共通コンポーネントとして切り出している。

## 3. コードの解説

### AIタイプの定義

```typescript
const AI_TYPES = [
  { value: 'rational', label: '分析的', icon: '...', description: '論理的・客観的' },
  { value: 'balanced', label: 'バランス', icon: '...', description: '実用的・総合的' },
  { value: 'ethical', label: '倫理的', icon: '...', description: '多角的・慎重' },
]
```

3つのAIタイプをオブジェクトの配列として定義。`value`はAPIに送る値、`label`は表示テキスト、`description`はツールチップに表示される説明文。

### 型の利用

```typescript
import type { AiType } from '@/types'
```

`AiType`は`'rational' | 'balanced' | 'ethical'`のユニオン型。`types/index.ts`で定義されている共通型を使うことで、アプリ全体で型の整合性を保つ。

### Props

```typescript
interface AiTypeSelectorProps {
  value: AiType                    // 現在選択されているタイプ
  onChange: (value: AiType) => void // タイプが変更されたときのコールバック
}
```

親コンポーネントが`value`で現在の選択状態を渡し、ユーザーがボタンを押すと`onChange`が呼ばれて親の状態が更新される（制御コンポーネントパターン）。

### ボタンのスタイル切り替え

```typescript
value === type.value
  ? 'bg-primary text-primary-foreground'        // 選択中: プライマリカラー
  : 'bg-secondary text-secondary-foreground ...' // 未選択: セカンダリカラー
```

`cn()`で条件に応じてクラスを切り替え、選択中のボタンを視覚的に区別する。

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `@/lib/utils` | `cn()` — クラス名結合ユーティリティ |
| `@/types` | `AiType` — AIタイプのユニオン型 |

## 5. 関連ファイル

- `app/(main)/agent/page.tsx` — OwnAIページのヘッダーで使用
- `app/(main)/wall/page.tsx` — 壁打ちページのヘッダーで使用
- `types/index.ts` — `AiType` 型の定義元

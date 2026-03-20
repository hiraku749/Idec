# components/ai/chat-message.tsx

## 1. このファイルは何をするのか

チャットのメッセージ吹き出しを表示するコンポーネント。ユーザーとAIで異なるスタイルで表示し、タイムスタンプも表示する。

## 2. なぜこのファイルが必要なのか

OwnAIページと壁打ちページの両方でチャットメッセージを表示する必要がある。見た目のロジックを共通コンポーネントとして切り出すことで、コードの重複を防ぎ、デザインの一貫性を保てる。

## 3. コードの解説

### Props（受け取るデータ）

```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant'  // 誰のメッセージか
  content: string              // メッセージ本文
  timestamp?: string           // ISO形式の日時（省略可）
}
```

### レイアウトの仕組み

```typescript
<div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
```

- `flex gap-3` — アイコンとメッセージを横並びに配置
- `flex-row-reverse` — ユーザーの場合は左右反転（右側にメッセージが来る）
- `cn()` — 条件付きでクラス名を結合するユーティリティ関数（`@/lib/utils`から）

### スタイルの出し分け

- **ユーザー** — `bg-primary text-primary-foreground`（プライマリカラーの背景、白文字）。右寄せ
- **AI** — `bg-card border`（カード色の背景、枠線付き）。左寄せ
- アイコンは絵文字で表示（ユーザー: 人、AI: ロボット）

### タイムスタンプ表示

```typescript
{new Date(timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
```

ISO形式の文字列を日本語ロケールの「HH:MM」形式に変換して表示する。`timestamp`が渡されなかった場合は非表示。

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `@/lib/utils` | `cn()` — クラス名結合ユーティリティ |

## 5. 関連ファイル

- `app/(main)/agent/page.tsx` — OwnAIページで使用
- `app/(main)/wall/page.tsx` — 壁打ちページで使用
- `components/ai/chat-input.tsx` — 入力欄コンポーネント（セットで使う）

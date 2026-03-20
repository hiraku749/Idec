# components/ai/chat-input.tsx

## 1. このファイルは何をするのか

チャット用のメッセージ入力コンポーネント。テキストエリアの高さが入力内容に応じて自動調整される。Enterで送信、Shift+Enterで改行。

## 2. なぜこのファイルが必要なのか

OwnAIページと壁打ちページの両方でメッセージ入力UIが必要。入力・送信・高さ自動調整のロジックを共通コンポーネントにまとめることで、両ページで同じUXを提供できる。

## 3. コードの解説

### Props（受け取るデータ）

```typescript
interface ChatInputProps {
  onSend: (message: string) => void  // 送信時に呼ばれるコールバック
  disabled?: boolean                  // 送信中など無効化する場合
  placeholder?: string                // プレースホルダーテキスト
}
```

`onSend`は親コンポーネントから渡される関数。送信ボタンが押されるとこの関数が呼ばれ、メッセージ文字列が引数として渡される。

### 状態管理

```typescript
const [value, setValue] = useState('')             // 入力中のテキスト
const textareaRef = useRef<HTMLTextAreaElement>(null) // テキストエリアのDOM参照
```

- `useState` — 入力テキストの状態を管理
- `useRef` — DOM要素に直接アクセスするための参照（高さ調整で使用）

### 送信処理（handleSubmit）

1. `e.preventDefault()` — フォームのデフォルト動作（ページリロード）を防止
2. `value.trim()` — 前後の空白を除去。空文字やdisabled時は送信しない
3. `onSend(trimmed)` — 親に送信内容を通知
4. `setValue('')` — 入力欄をクリア
5. テキストエリアの高さをリセット

### キーボード操作（handleKeyDown）

```typescript
if (e.key === 'Enter' && !e.shiftKey) {
  e.preventDefault()
  handleSubmit(e)
}
```

Enterキー単体で送信、Shift+Enterで改行という一般的なチャットUIの挙動を実現している。

### 自動高さ調整（handleInput）

```typescript
el.style.height = 'auto'                              // 一度リセット
el.style.height = Math.min(el.scrollHeight, 160) + 'px' // 内容に合わせて再設定
```

1. 高さを`auto`にリセットすることで`scrollHeight`が正確な値を返すようにする
2. `scrollHeight`（実際のコンテンツの高さ）を取得し、最大160pxまでの範囲で高さを設定

### ボタンの無効化

```typescript
disabled={disabled || !value.trim()}
```

送信中（`disabled=true`）または入力が空の場合、送信ボタンが無効になる。

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `react` | `useState`, `useRef` — 状態管理とDOM参照 |

## 5. 関連ファイル

- `app/(main)/agent/page.tsx` — OwnAIページで使用
- `app/(main)/wall/page.tsx` — 壁打ちページで使用
- `components/ai/chat-message.tsx` — メッセージ表示コンポーネント（セットで使う）

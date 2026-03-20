# app/(main)/agent/page.tsx

## 1. このファイルは何をするのか

OwnAI（自分専用AI）のチャットページ。ユーザーがノートをナレッジとしてAIに質問し、回答を受け取るクライアントコンポーネント。

## 2. なぜこのファイルが必要なのか

Idecの核となるAI機能の1つ。ユーザーが蓄積したノートをベースにAIが回答するため、汎用AIとは異なり「自分だけのナレッジベース」を活用できる。このページがそのフロントエンド画面を提供する。

## 3. コードの解説

### 状態管理

```typescript
const [messages, setMessages] = useState<Message[]>([])   // チャット履歴
const [aiType, setAiType] = useState<AiType>('balanced')   // AIタイプ
const [sending, setSending] = useState(false)               // 送信中フラグ
const scrollRef = useRef<HTMLDivElement>(null)               // スクロール用DOM参照
```

- `messages` — 画面に表示する全メッセージの配列。`role`（user/assistant）、`content`、`timestamp`を持つ
- `sending` — APIリクエスト中に`true`になり、入力欄を無効化し「考え中...」を表示する

### 自動スクロール

```typescript
useEffect(() => {
  scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
}, [messages])
```

`messages`が変更されるたび（=新しいメッセージが追加されるたび）、メッセージエリアを最下部にスムーズスクロールする。

### メッセージ送信（handleSend）

1. ユーザーメッセージを`messages`に追加して即座に画面表示
2. `fetch('/api/agent', { method: 'POST', ... })` でAPIを呼び出し
3. 成功時: `data.answer` をアシスタントメッセージとして追加
4. HTTPエラー時: エラーメッセージをアシスタントメッセージとして表示
5. ネットワークエラー時（`catch`）: 通信エラーメッセージを表示
6. `finally` で `sending` を `false` に戻す

### 画面構成

- **ヘッダー** — タイトル「OwnAI」と`AiTypeSelector`
- **メッセージエリア** — メッセージがない場合は案内テキスト、ある場合は`ChatMessage`コンポーネントで一覧表示。送信中は「考え中...」アニメーション
- **入力エリア** — `ChatInput`コンポーネント

### レイアウトのCSSポイント

```typescript
className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen"
```

モバイルではヘッダーバー分（3.5rem）を差し引いた高さ、デスクトップでは全画面高さを使う。

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `react` | `useState`, `useRef`, `useEffect` |
| `@/components/ai/chat-message` | メッセージ表示 |
| `@/components/ai/chat-input` | メッセージ入力 |
| `@/components/ai/ai-type-selector` | AIタイプ選択 |
| `@/types` | `AiType` 型 |

## 5. 関連ファイル

- `app/api/agent/route.ts` — このページが呼び出すAPIエンドポイント
- `components/ai/chat-message.tsx` — メッセージ吹き出し
- `components/ai/chat-input.tsx` — 入力欄
- `components/ai/ai-type-selector.tsx` — AIタイプセレクター

# app/(main)/wall/page.tsx

## 1. このファイルは何をするのか

壁打ち（ブレインストーミング）ページ。セッション管理付きのチャットインターフェースで、AIとアイデアを深掘りするためのクライアントコンポーネント。

## 2. なぜこのファイルが必要なのか

OwnAIが「質問→回答」の一問一答型なのに対し、壁打ちは「セッション」として会話履歴を保持し、テーマを深掘りする機能。過去のセッションを一覧・再開できるサイドバーが必要なため、OwnAIとは別のページとして実装している。

## 3. コードの解説

### 状態管理

```typescript
const [messages, setMessages] = useState<WallMessage[]>([])     // チャット履歴
const [aiType, setAiType] = useState<AiType>('balanced')         // AIタイプ
const [sessionId, setSessionId] = useState<string | undefined>() // 現在のセッションID
const [sessions, setSessions] = useState<SessionInfo[]>([])      // セッション一覧
const [sending, setSending] = useState(false)                     // 送信中フラグ
const [showSidebar, setShowSidebar] = useState(false)             // モバイルサイドバー表示
```

OwnAIと比べて`sessionId`と`sessions`が追加されている。`sessionId`が`undefined`の場合は新規セッション。

### 初期化時のセッション一覧取得

```typescript
useEffect(() => {
  fetch('/api/wall')
    .then((r) => r.json())
    .then((data) => { if (Array.isArray(data)) setSessions(data) })
}, [])
```

ページ読み込み時に`GET /api/wall`を呼んでセッション一覧を取得する。依存配列が空`[]`なので初回レンダリング時のみ実行。

### セッション読み込み（loadSession）

```typescript
async function loadSession(id: string) {
  const res = await fetch(`/api/wall?sessionId=${id}`)
  const data = await res.json()
  setSessionId(id)
  setMessages(data.messages ?? [])
  setAiType(data.ai_type ?? 'balanced')
}
```

サイドバーでセッションをクリックすると、そのセッションのメッセージ履歴を取得して画面に表示する。

### 新規セッション（newSession）

`sessionId`を`undefined`に、`messages`を空配列にリセットするだけ。次にメッセージを送信するとAPIが自動的に新しいセッションを作成する。

### メッセージ送信（handleSend）

OwnAIページとほぼ同じ流れだが、以下が異なる：
- `sessionId`もリクエストボディに含める
- レスポンスの`data.sessionId`を受け取り、新規セッションの場合はstateを更新する

```typescript
if (data.sessionId && !sessionId) {
  setSessionId(data.sessionId)
}
```

### 画面構成

- **セッションサイドバー** — モバイルではトグルで表示/非表示、デスクトップでは常時表示（`hidden md:block`）。新規セッションボタンとセッション一覧を含む
- **チャットエリア** — ヘッダー（タイトル + AIタイプセレクター）、メッセージ表示、入力欄の3段構成

### レスポンシブ対応

```typescript
className={`${showSidebar ? 'block' : 'hidden'} md:block w-56 ...`}
```

- モバイル（`md`未満）: `showSidebar`がtrueの時だけ表示
- デスクトップ（`md`以上）: 常に`block`で表示
- サイドバートグルボタンも`md:hidden`で、モバイルのみ表示される

## 4. 依存関係

| 使っているもの | 用途 |
|---|---|
| `react` | `useState`, `useRef`, `useEffect` |
| `@/components/ai/chat-message` | メッセージ表示 |
| `@/components/ai/chat-input` | メッセージ入力 |
| `@/components/ai/ai-type-selector` | AIタイプ選択 |
| `@/types` | `AiType`, `WallMessage` 型 |

## 5. 関連ファイル

- `app/api/wall/route.ts` — このページが呼び出すAPIエンドポイント（POST/GET）
- `components/ai/chat-message.tsx` — メッセージ吹き出し
- `components/ai/chat-input.tsx` — 入力欄
- `components/ai/ai-type-selector.tsx` — AIタイプセレクター
- `app/(main)/agent/page.tsx` — 類似構成の OwnAI ページ

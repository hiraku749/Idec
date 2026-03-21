# app/api/discussions/[id]/ai-reply/route.ts

## 1. このファイルは何をするのか
ディスカッションルームにAIが参加者として返答を投稿するAPIエンドポイント。

## 2. なぜこのファイルが必要なのか
Phase 21「AI＋人間混合ディスカッション」の核心機能。これまでの議論履歴をAIが読み取り、建設的な意見や視点を人間の参加者と同じように投稿できる。

## 3. コードの各部分の解説

### 直近メッセージの取得
```typescript
const { data: messages } = await supabase
  .from('discussion_messages')
  .select(...)
  .order('created_at', { ascending: false })
  .limit(20)
const recentMessages = (messages ?? []).reverse()
```
新しい順で取得してから逆順にする（降順取得→配列反転）ことで、会話の時系列順を保ちながら最新20件に絞る。

### 会話履歴のテキスト化
```typescript
const conversationText = recentMessages
  .map((m) => `${m.is_ai ? '[AI]' : m.display_name}: ${m.content}`)
  .join('\n')
```
AIメッセージには `[AI]` プレフィックスを付けて人間との発言を区別する。

### AIメッセージの投稿（is_ai: true）
```typescript
await supabase.from('discussion_messages').insert({
  ...
  is_ai: true,
})
```
`is_ai` フラグをtrueにして保存することで、UIでAIと人間のメッセージを区別して表示できる。

## 4. 依存関係
- 使っているもの: `@anthropic-ai/sdk`、Supabase（server）
- DB: `discussions`テーブル（ルーム情報）、`discussion_messages`テーブル（メッセージ投稿）

## 5. 関連ファイル
- `app/(main)/discussion/[id]/page.tsx` — UIの「AIに参加してもらう」ボタン
- `app/api/discussions/[id]/messages/route.ts` — 人間がメッセージを送るAPI
- `types/index.ts` — `DiscussionMessage.is_ai` フィールド

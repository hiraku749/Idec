# components/ai/referenced-notes.tsx

## このファイルは何をするのか

AI の回答時に参照されたノートを、展開・折りたたみ可能なパネルとして表示するコンポーネント。ノートのタイトル（リンク付き）、類似度（パーセント表示）、要約テキストを一覧で表示する。

## なぜこのファイルが必要なのか

OwnAI エージェントや壁打ちチャットでは、ユーザーの質問に回答する際に pgvector を使ってノートを検索し、関連性の高いノートをコンテキストとして利用する。しかし、どのノートが参照されたのかをユーザーに見せなければ、AI の回答の根拠が不透明になる。このコンポーネントがあることで、ユーザーは「AI がどのノートを参照して回答を生成したか」を確認でき、必要に応じてそのノートに直接遷移して内容を確認できる。透明性と信頼性を高めるための UI パーツである。

## コードの各部分の解説

### 'use client' ディレクティブ（1行目）

```tsx
'use client'
```

`useState` を使うため、クライアントコンポーネントとして宣言している。Next.js のサーバーコンポーネントでは React の状態管理フックが使えないため、このディレクティブが必要。

### インポート（3〜5行目）

```tsx
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
```

- **`Link`** — Next.js のクライアントサイドルーティング用リンクコンポーネント。ノートタイトルをクリックしたときに `/notes/[id]` へ遷移するために使う。
- **`useState`** — パネルの展開・折りたたみ状態を管理するための React フック。
- **`cn`** — `clsx` + `tailwind-merge` を組み合わせたユーティリティ関数。条件付きクラス名の結合に使う。

### ReferencedNoteInfo インターフェース（7〜12行目）

```tsx
export interface ReferencedNoteInfo {
  noteId: string
  title: string
  summary: string
  similarity: number
}
```

1つの参照ノートが持つ情報の型定義。`export` されているため、このコンポーネントを呼び出す側でもこの型を使ってデータを組み立てられる。

- **`noteId`** — ノートの一意識別子。リンク先 URL の生成に使う。
- **`title`** — ノートのタイトル。空文字の場合は「無題のノート」と表示される。
- **`summary`** — ノートの要約文。AI がコンテキストとして使った部分の概要。
- **`similarity`** — 0〜1 の数値で表す類似度。ベクトル検索のスコアがそのまま入る。

### ReferencedNotesProps インターフェース（14〜16行目）

```tsx
interface ReferencedNotesProps {
  notes: ReferencedNoteInfo[]
}
```

コンポーネントの props 型。`ReferencedNoteInfo` の配列を受け取る。`export` されていないのは、外部からこの型を直接使う必要がないため。

### ReferencedNotes コンポーネント本体（18〜58行目）

#### 状態管理と早期リターン（19〜21行目）

```tsx
const [expanded, setExpanded] = useState(false)
if (notes.length === 0) return null
```

- `expanded` — パネルが展開されているかどうかの真偽値。初期値は `false`（折りたたまれた状態）。
- 参照ノートが0件の場合は何もレンダリングしない（`null` を返す）。これにより、ノート参照がなかった AI 回答の下に空のパネルが表示されるのを防ぐ。

#### ヘッダーボタン（25〜34行目）

```tsx
<button
  onClick={() => setExpanded(!expanded)}
  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
>
  <span className="flex items-center gap-1.5">
    <span>📚</span>
    参照ノート ({notes.length}件)
  </span>
  <span className={cn('transition-transform', expanded && 'rotate-180')}>▼</span>
</button>
```

パネル全幅のボタンで、クリックすると `expanded` を反転させる。左側に「参照ノート (N件)」というラベル、右側に三角形のインジケーターを表示。展開時には `rotate-180` クラスが追加され、三角形が上向きに回転する。`cn()` を使って条件付きにクラスを適用している。

#### ノート一覧（35〜55行目）

```tsx
{expanded && (
  <div className="border-t divide-y">
    {notes.map((note) => (
      <div key={note.noteId} className="px-3 py-2.5">
        ...
      </div>
    ))}
  </div>
)}
```

`expanded` が `true` のときだけレンダリングされる（条件付きレンダリング）。`notes` 配列を `map` で回して各ノートを表示する。`divide-y` で各ノート間に水平線が入る。

#### 各ノートの表示（38〜53行目）

各ノートは2段構成になっている。

**上段：タイトルと類似度**

```tsx
<Link
  href={`/notes/${note.noteId}`}
  className="text-xs font-medium hover:underline truncate max-w-[70%]"
>
  {note.title || '無題のノート'}
</Link>
<span className="text-[10px] text-muted-foreground shrink-0 ml-2">
  類似度 {(note.similarity * 100).toFixed(0)}%
</span>
```

- タイトルは `Link` コンポーネントでラップされており、クリックするとそのノートの詳細ページへ遷移する。`truncate` で長いタイトルは省略表示される。タイトルが空（falsy）の場合は「無題のノート」を表示。
- 類似度は 0〜1 の数値を 100 倍して整数パーセントに変換（`toFixed(0)` で小数点以下を切り捨て）。`shrink-0` でタイトルが長くても類似度の表示が縮まらないようにしている。

**下段：要約テキスト**

```tsx
<p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
  {note.summary}
</p>
```

ノートの要約を最大3行まで表示する。`line-clamp-3` で3行を超える部分は `...` で省略される。`text-[11px]` という任意値指定で非常に小さめのフォントサイズにし、メインのチャット内容の邪魔にならないようにしている。

## 依存関係

### 使っているもの

| パッケージ / モジュール | 用途 |
|---|---|
| `next/link` | ノートタイトルのクライアントサイドナビゲーション |
| `react` (`useState`) | 展開・折りたたみ状態の管理 |
| `@/lib/utils` (`cn`) | 条件付き CSS クラス名の結合 |

### 使われているもの

このコンポーネントは、AI の回答を表示するチャットメッセージコンポーネントから呼び出される。具体的には、`components/ai/chat-message.tsx` などの中で AI の応答とともに参照ノート情報が渡され、回答の直下に表示される。

## 関連ファイル

| ファイル | 関係 |
|---|---|
| `components/ai/chat-message.tsx` | チャットメッセージ表示コンポーネント。この中から `ReferencedNotes` を呼び出す |
| `app/api/agent/route.ts` | OwnAI エージェント API。ベクトル検索で関連ノートを取得し、レスポンスに含める |
| `app/api/wall/route.ts` | 壁打ちチャット API。同様にノート参照情報を返す |
| `lib/pgvector/embed.ts` | ベクトル埋め込み生成。ノートの類似度検索の基盤 |
| `lib/utils.ts` | `cn` ユーティリティ関数の定義元 |
| `app/(main)/notes/[id]/page.tsx` | ノート詳細ページ。タイトルリンクの遷移先 |

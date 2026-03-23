# lib/hooks/use-speech-input.ts

## このファイルは何をするのか

ブラウザの Web Speech API を使って音声認識を行うカスタムフック。

## なぜこのファイルが必要なのか

音声入力のロジック（開始・停止・エラー処理・ブラウザ対応チェック）をコンポーネントから分離し、再利用可能にするため。

## コードの各部分の解説

- `SpeechStatus` — 音声認識の状態（idle / listening / processing / unsupported）
- `isSupported` — `SpeechRecognition` または `webkitSpeechRecognition` が存在するかチェック
- `recognition.continuous = true` — 一文が終わっても止まらず継続して認識し続ける
- `recognition.interimResults = true` — 確定前の暫定テキストも返す（リアルタイム表示用）
- `onResult` — 確定テキスト（`isFinal: true`）が来たときに呼ばれるコールバック
- `onInterim` — 暫定テキストが来たときのコールバック（任意）
- アンマウント時に `abort()` でクリーンアップ

## 依存関係

- 使っているもの: React（useCallback / useEffect / useRef / useState）
- 使われているもの: `components/notes/editor-toolbar.tsx`

## 関連ファイル

- `types/speech.d.ts` — Web Speech API の型宣言
- `components/notes/editor-toolbar.tsx` — マイクボタンを配置

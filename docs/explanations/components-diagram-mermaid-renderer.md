# components/diagram/mermaid-renderer.tsx

## 1. このファイルは何をするのか

Mermaid記法のテキストをSVG図としてブラウザ上にレンダリングするコンポーネント。

## 2. なぜこのファイルが必要なのか

MermaidライブラリはブラウザのDOMを直接操作するためSSR（サーバーサイドレンダリング）と相性が悪い。`dynamic import`でクライアント側のみで読み込むことでエラーを防いでいる。

## 3. コードの各部分の解説

```typescript
import('mermaid').then(...)
```
- 動的インポートでmermaidをクライアント側のみ読み込む

```typescript
mermaid.render(id, code).then(({ svg }) => {
  containerRef.current.innerHTML = svg
})
```
- MermaidがコードをSVGに変換し、divに直接埋め込む

## 4. 依存関係

- `mermaid` パッケージ
- `app/(main)/diagram/page.tsx` から使用

## 5. 関連ファイル

- `app/api/diagram/route.ts` — Mermaidコードを生成するAPI

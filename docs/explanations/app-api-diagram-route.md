# app/api/diagram/route.ts

## 1. このファイルは何をするのか

図式生成APIエンドポイント。ノートIDと出力形式を受け取り、AIがノート内容を変換して返す。

## 2. なぜこのファイルが必要なのか

フロントエンドからAI処理を呼び出す窓口。認証・バリデーション後にパイプラインへ委譲する。

## 3. コードの各部分の解説

- `format`: `mermaid`（図）/ `markdown-outline`（アウトライン）/ `structured-text`（構造化）の3形式
- `runDiagram`: パイプラインが1ノートを取得→AI変換→`{ output, format }`を返す

## 4. 依存関係

- `lib/pipeline/tools/diagram.ts` — AI処理
- `app/(main)/diagram/page.tsx` — フロントエンドUI

## 5. 関連ファイル

- `components/diagram/mermaid-renderer.tsx` — Mermaidプレビュー表示

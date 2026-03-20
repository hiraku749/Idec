# vitest.config.ts

## 1. このファイルは何をするのか

Vitest（テストランナー）の設定ファイル。テスト実行時の環境やパス解決ルールを定義する。

## 2. なぜこのファイルが必要なのか

テストを実行するには「どのファイルをテスト対象にするか」「どの環境で動かすか」「パスのエイリアスはどう解決するか」をテストランナーに教える必要がある。このファイルがないと Vitest はプロジェクト固有の設定を認識できない。

## 3. コードの解説

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'
```
- `defineConfig` は Vitest の設定を型安全に書くためのヘルパー関数。
- `path` は Node.js 標準モジュールで、ファイルパスを組み立てるのに使う。

```ts
export default defineConfig({
  test: {
    environment: 'jsdom',
```
- `environment: 'jsdom'` — テスト実行環境をブラウザ風の仮想 DOM（jsdom）に設定する。React コンポーネントのテストでは `document` や `window` が必要なため。

```ts
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
```
- `include` — `.test.ts` または `.test.tsx` で終わるファイルをテスト対象にする。
- `exclude` — `node_modules`（外部ライブラリ）と `.next`（ビルド成果物）はテスト対象から除外。

```ts
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
```
- `@` というパスエイリアスをプロジェクトルートに設定する。`@/lib/utils` のようなインポートをテスト時にも正しく解決するため。Next.js の `tsconfig.json` で設定している `@/*` と同じ意味。

## 4. 依存関係

- **使っているもの**: `vitest/config`、Node.js `path` モジュール
- **使われているもの**: `npm run test` 実行時に Vitest が自動的に読み込む

## 5. 関連ファイル

- `tsconfig.json` — `@/*` パスエイリアスの元定義
- `package.json` — `test` スクリプトの定義
- `.github/workflows/ci.yml` — CI で `npm run test -- --run` を実行

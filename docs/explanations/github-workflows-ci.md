# .github/workflows/ci.yml

## 1. このファイルは何をするのか

GitHub Actions の CI（継続的インテグレーション）パイプラインを定義する。コードを push や PR するたびに自動で型チェック・リント・テストを実行する。

## 2. なぜこのファイルが必要なのか

手動でチェックを忘れるとバグや型エラーが混入する。CI を設定しておけば、GitHub にコードを送るたびに自動でチェックが走り、問題があればすぐに分かる。チーム開発でもソロ開発でも品質の安全網になる。

## 3. コードの解説

```yaml
name: CI
```
- ワークフローの名前。GitHub の Actions タブに表示される。

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```
- **トリガー条件**: `main` ブランチへの push、または `main` への PR が作られたときに実行される。

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
```
- `check` というジョブを定義。`ubuntu-latest`（Linux）の仮想マシン上で実行する。

```yaml
    steps:
      - uses: actions/checkout@v4
```
- リポジトリのコードをチェックアウト（ダウンロード）する。

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
```
- Node.js v20 をセットアップ。`cache: npm` で `node_modules` をキャッシュし、次回以降のインストールを高速化。

```yaml
      - run: npm ci
```
- `package-lock.json` に基づいて依存パッケージをクリーンインストール。`npm install` と違い、ロックファイルと完全に一致するバージョンをインストールする（CI 向き）。

```yaml
      - name: Type check
        run: npx tsc --noEmit
```
- TypeScript の型チェックを実行。`--noEmit` は JS ファイルを出力せずチェックだけ行うオプション。

```yaml
      - name: Lint
        run: npm run lint
```
- ESLint を実行してコードスタイルや問題を検出。

```yaml
      - name: Test
        run: npm run test -- --run
```
- Vitest でテストを実行。`--run` はウォッチモードではなく1回実行して終了するオプション。

## 4. 依存関係

- **使っているもの**: `actions/checkout@v4`、`actions/setup-node@v4`、`npm`、`tsc`、`eslint`、`vitest`
- **使われているもの**: GitHub が `.github/workflows/` 内の YAML を自動検出して実行する

## 5. 関連ファイル

- `vitest.config.ts` — テスト実行の設定
- `tsconfig.json` — 型チェックの設定
- `package.json` — `lint` / `test` スクリプトの定義
- `.eslintrc.json` または `eslint.config.*` — ESLint の設定

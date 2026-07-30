# 開発ガイド

## 開発環境の構築

### 前提条件

- Node.js 18+
- npm

### セットアップ

```bash
# リポジトリのクローン
git clone <repo-url>
cd private-opencode-server

# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env.local
```

`.env.local` を編集:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password-here
OPENCODE_SERVER_URL=http://127.0.0.1:4096
OPENCODE_SERVER_PASSWORD=
```

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス可能。

## コマンド

| コマンド               | 説明                                     |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | 開発サーバーを起動（ホットリロード有効） |
| `npm run build`        | プロダクションビルド                     |
| `npm start`            | プロダクションサーバーを起動             |
| `npm run lint`         | ESLint でLintチェック                    |
| `npm run typecheck`    | TypeScript の型チェック                  |
| `npm run format`       | Prettier でフォーマット                  |
| `npm run format:check` | フォーマットチェック                     |

## コーディング規約

### TypeScript

- `strict` モード有効
- 明示的な型注釈を推奨
- `any` の使用は避ける

### コンポーネント

- React Server Components をデフォルトとして使用
- クライアントコンポーネントのみ `"use client"` を付与
- ファイル名: `kebab-case`（例: `session-manager.ts`）

### API ルート

- `src/app/api/` 配下に配置
- 認証チェックは `verifyAuth()` を使用
- エラーレスポンスは `{ error: string }` 形式

### スタイル

- Tailwind CSS 4 を使用
- インラインでユーティリティクラスを記述
- カスタム CSS は `globals.css` に最小限のみ

## テスト

現在のところ自動テストは未実装。手動での動作確認を行う:

1. ログインフロー
2. セッション作成・一覧・詳細
3. 設定の CRUD
4. OpenCode Web UI の起動/停止

## ディレクトリ構成の詳細

[アーキテクチャドキュメント](architecture.md) を参照。

## デバッグ

### ログの確認

開発サーバーのターミナルに出力されるログを確認。

### データベースの確認

```bash
# SQLite データベースの場所
ls data/opencode-server.db

# SQLite CLI で確認
sqlite3 data/opencode-server.db
> SELECT * FROM sessions;
> SELECT * FROM logs;
> SELECT * FROM configs;
```

### opencode プロセスの確認

```bash
# 実行中の opencode プロセスを確認
ps aux | grep opencode
```

## リント・型チェック

コミット前に必ず実行:

```bash
npm run lint
npm run typecheck
```

## Docker 開発

### Docker ビルド

```bash
# ローカルで Docker イメージをビルド
docker compose build

# 起動
docker compose up -d

# ログ確認
docker compose logs -f
```

### Dockerfile のポイント

- マルチステージビルド（deps → builder → runner）で最終イメージを最小化
- `node:26.5.0-alpine3.23` をベースイメージとして使用
- `next.config.ts` で `output: "standalone"` を設定し、standalone モードでビルド
- `nextjs` ユーザーで実行（root 権限で実行しない）

### package.json の allowScripts

ネイティブモジュール（`better-sqlite3`, `sharp`, `opencode-ai`, `unrs-resolver`）は `allowScripts` で postinstall スクリプトを明示的に許可している。

## フォーマット

```bash
# 自動フォーマット
npm run format

# チェックのみ
npm run format:check
```

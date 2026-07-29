# private-opencode-server

OpenCode をヘッドレスサーバーとして管理・運用するための Web アプリケーション。

## 概要

private-opencode-server は、[opencode](https://opencode.ai) をヘッドレスモードで起動し、Web ブラウザからセッション管理・ログ閲覧・設定変更を行うための管理ダッシュボードです。

GitHub Webhook との連携により、リポジトリへの push イベントをトリガーに自動で opencode セッションを起動することも可能です。

## 技術スタック

| レイヤ | 技術 |
|--------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS 4 |
| データベース | SQLite (better-sqlite3) |
| プロセス管理 | child_process (opencode CLI) |
| デプロイ | Vercel |

## 機能

- **ダッシュボード** — アクティブ/完了/失敗セッションの一覧表示
- **セッション管理** — セッションの起動・監視・キャンセル・ログ閲覧
- **OpenCode Web UI** — opencode serve の Web UI を iframe で埋め込み表示
- **設定管理** — GitHub トークン等の設定を Web UI から管理
- **GitHub Webhook** — push イベントをトリガーに自動セッション起動
- **Basic Auth** — ユーザー名/パスワードによる認証

## クイックスタート

### 前提条件

- Node.js 18+
- npm

### セットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して認証情報を設定

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### デフォルト認証情報

| 項目 | 値 |
|------|------|
| ユーザー名 | `admin` |
| パスワード | `.env.local` の `ADMIN_PASSWORD` に設定した値 |

## ドキュメント

- [アーキテクチャ](docs/architecture.md) — システム構成・コンポーネント設計
- [機能詳細](docs/features.md) — 各機能の詳細な説明
- [API リファレンス](docs/api.md) — REST API のエンドポイント一覧
- [デプロイガイド](docs/deployment.md) — Vercel へのデプロイ手順と制限事項
- [開発ガイド](docs/development.md) — 開発環境の構築・テスト・Lint

## ライセンス

Private — 非公開プロジェクト

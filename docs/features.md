# 機能詳細

## ダッシュボード

ホーム画面（`/`）では以下の情報を表示:

- アクティブなセッション数
- 完了したセッション数
- 失敗したセッション数
- 直近5件のセッション一覧

各セッションをクリックすると詳細ページに遷移します。

## セッション管理

### セッション一覧 (`/sessions`)

すべてのセッションを時系列で表示。ステータス別にフィルタリング可能。

### セッション詳細 (`/sessions/[id]`)

- セッションの基本情報（リポジトリ, ステータス, 実行時間）
- リアルタイムログストリーミング（SSE）
- メッセージ送信（実行中のセッションに対して）
- セッションのキャンセル

### 新規セッション (`/sessions/new`)

新しい opencode セッションを起動:

- リポジトリ URL を指定
- 初期指示（instruction）を入力
- オプションで作業ディレクトリを指定

## OpenCode Web UI

`/opencode` ページでは `opencode serve` が起動する Web UI を iframe で表示。

- サーバーの起動/停止ボタン
- 接続ステータスのリアルタイム表示（5秒間隔でポーリング）
- opencode CLI の自動検出

## 設定管理

`/settings` ページでは以下の設定を管理:

- GitHub トークン
- リポジトリ設定
- その他のキーバリュー設定

設定は SQLite の `configs` テーブルに保存される。

### GitHub トークンテスト

`/api/settings/test-github-token` で設定されたトークンの有効性を確認可能。

## GitHub Webhook

`/api/webhook/github` は GitHub Webhook イベントを受信。

現在のところ受信のみ（エコーバック）。今後の拡張で push イベントをトリガーにセッションを自動起動する機能を実装予定。

## 認証

Basic Auth 方式。Cookie に `auth_token`（Base64 エンコードされた `username:password`）を保存。

- `httpOnly` — XSS 対策
- `secure` — HTTPS 接続時は自動で有効（`x-forwarded-proto` ヘッダーに基づき判定）
- `sameSite: lax` — CSRF 対策
- `maxAge: 86400` — 24時間で有効期限切れ

### リバースプロキシ対応

`x-forwarded-proto` / `x-forwarded-host` ヘッダーに対応しており、Nginx 等のリバースプロキシ配下でも正しい URL へリダイレクトします。VPS + Docker 環境でも HTTPS リダイレクトが正しく動作します。

### ログインページ

ログインページはクライアントサイドでフォーム送信を処理します。

- ローディング表示（送信中はボタンが無効化）
- エラーメッセージのインライン表示
- `fetch` API による非同期認証（opaque redirect 対応）

# アーキテクチャ

## システム構成

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Dashboard │  │ Sessions │  │ OpenCode Web  │  │
│  │  (home)  │  │  Manager │  │  UI (iframe)  │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │            │
├───────┼──────────────┼───────────────┼────────────┤
│       │    Next.js App Router        │            │
│  ┌────┴─────┐  ┌────┴─────┐  ┌─────┴────────┐  │
│  │   API    │  │   API    │  │  API Proxy   │  │
│  │ /sessions│  │ /config  │  │/opencode-serve│  │
│  └────┬─────┘  └────┴─────┘  └─────┬────────┘  │
│       │              │               │            │
│  ┌────┴──────────────┴───┐   ┌─────┴────────┐  │
│  │   SQLite (store.ts)   │   │ opencode CLI │  │
│  │   sessions / logs     │   │ serve process│  │
│  │   configs             │   │              │  │
│  └───────────────────────┘   └──────────────┘  │
│                   Server                         │
└─────────────────────────────────────────────────┘
```

## ディレクトリ構成

```
├── Dockerfile                # Docker マルチステージビルド
├── docker-compose.yml        # Docker Compose サービス定義
├── deploy.sh                 # VPS デプロイスクリプト
├── .dockerignore             # Docker ビルド除外ファイル
├── next.config.ts            # Next.js 設定（standalone output）
├── package.json              # 依存関係・スクリプト
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # 認証 API (POST: ログイン)
│   │   │   ├── config/         # 設定 CRUD API
│   │   │   ├── opencode-serve/ # opencode serve 起動/停止 API
│   │   │   ├── sessions/       # セッション管理 API
│   │   │   ├── settings/       # 設定テスト API
│   │   │   └── webhook/        # GitHub Webhook 受信 API
│   │   ├── login/              # ログインページ（クライアントサイドフォーム）
│   │   ├── opencode/           # OpenCode Web UI 埋め込みページ
│   │   ├── sessions/           # セッション管理ページ
│   │   ├── settings/           # 設定管理ページ
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ダッシュボード（ホーム）
│   │   └── globals.css         # グローバルスタイル
│   ├── lib/
│   │   ├── auth.ts             # 認証ユーティリティ
│   │   ├── opencode-process.ts # opencode プロセス管理
│   │   ├── opencode-serve.ts   # opencode serve 管理
│   │   ├── session-manager.ts  # セッションビジネスロジック
│   │   └── store.ts            # SQLite データストア
│   └── middleware.ts            # 認証ミドルウェア（リバースプロキシ対応）
└── docs/                       # ドキュメント
```

## コンポーネント

### ミドルウェア (`middleware.ts`)

全リクエストに対して認証チェックを行う。`/login` と `/api` 配下は除外。

認証方式: Basic Auth（Cookie ベース）

リバースプロキシ対応: `x-forwarded-proto` / `x-forwarded-host` ヘッダーからベース URL を判定し、リダイレクト先を正しく生成する。

### データストア (`store.ts`)

SQLite (better-sqlite3) を使用したデータ永続化レイヤー。

**テーブル構成:**
- `sessions` — セッション情報（ID, リポジトリ, ステータス, 実行時間等）
- `logs` — セッションごとのログ（stdout/stderr）
- `configs` — キーバリューストア（設定保存用）

**サーバーレス環境対応:**
- Vercel 環境では `/tmp` ディレクトリに DB を配置
- DB 初期化失敗時はグレースフルに 503 を返却

### セッションマネージャー (`session-manager.ts`)

セッションのライフサイクル管理:
- 作成 → プロセス起動 → ログ記録 → 完了/失敗
- メッセージ送信（stdin 経由）
- キャンセル（SIGTERM → SIGKILL）

### OpenCode Serve (`opencode-serve.ts`)

`opencode serve` コマンドの管理:
- ポート指定でサーバー起動
- ヘルスチェック（2秒タイムアウト）
- 起動/停止/ステータス取得

**サーバーレス環境では無効化される。**

## 認証フロー

1. ユーザーが `/login` にアクセス
2. ログインページでユーザー名/パスワードを入力（クライアントサイドでフォーム送信）
3. `POST /api/auth` に fetch で送信
4. サーバーが認証情報を検証し、`auth_token` Cookie を設定（`secure` フラグは `x-forwarded-proto` に基づき自動判定）
5. `/` にリダイレクト
6. ミドルウェアが Cookie を検証し、認証済みならアクセス許可

**リバースプロキシ配下でも動作:** `x-forwarded-proto` / `x-forwarded-host` ヘッダーからベース URL を自動判定するため、Nginx 等のリバースプロキシ配下でも HTTPS リダイレクトが正しく動作する。

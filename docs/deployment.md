# デプロイガイド

## Docker / VPS へのデプロイ

Docker を使用して VPS にデプロイすると、セッション管理・OpenCode Web UI・永続データストレージを含むフル機能が利用できます。

### 前提条件

- Docker / Docker Compose がインストールされた VPS
- SSH 接続の設定

### ファイル構成

| ファイル             | 説明                                        |
| -------------------- | ------------------------------------------- |
| `Dockerfile`         | マルチステージビルド（Node.js 26 + Alpine） |
| `docker-compose.yml` | サービス定義・ポート・環境変数・ボリューム  |
| `deploy.sh`          | VPS への自動デプロイスクリプト              |
| `.dockerignore`      | ビルドコンテキストから除外するファイル      |

### ローカルで Docker 起動

```bash
# .env ファイルの作成
cp .env.example .env
# .env を編集

# ビルド・起動
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

### VPS へのデプロイ

```bash
# deploy.sh を使用（SSH 接続が必要）
./deploy.sh user@your-vps-host main

# 手動デプロイ
ssh user@your-vps-host
mkdir -p /opt/private-opencode-server
cd /opt/private-opencode-server
git clone <repo-url> .
cp .env.example .env
# .env を編集
docker compose up -d
```

### Docker 環境変数

| 変数名                     | 必須   | デフォルト              | 説明                                                  |
| -------------------------- | ------ | ----------------------- | ----------------------------------------------------- |
| `ADMIN_USERNAME`           | いいえ | `admin`                 | 認証ユーザー名                                        |
| `ADMIN_PASSWORD`           | はい   | —                       | 認証パスワード                                        |
| `OPENCODE_SERVER_URL`      | いいえ | `http://127.0.0.1:4096` | opencode serve の URL                                 |
| `OPENCODE_SERVER_PASSWORD` | いいえ | —                       | opencode serve のパスワード                           |
| `GITHUB_WEBHOOK_SECRET`    | いいえ | —                       | GitHub Webhook のシークレット                         |
| `PORT`                     | いいえ | `3000`                  | ホストに公開するポート                                |
| `BASE_URL`                 | いいえ | 自動判定                | ベース URL の手動指定。未設定時はヘッダーから自動判定 |

### リバースプロキシ配下での利用

Docker デプロイでは `x-forwarded-proto` / `x-forwarded-host` ヘッダーに基づいて URL を自動判定するため、Nginx 等のリバースプロキシ配下でも正しく動作します。

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

### データ永続化

Docker Compose は `app-data` ボリュームを使用し、`/app/data` にデータを保存します。コンテナを再起動してもセッション・ログ・設定は保持されます。

## デプロイ後の確認

1. デプロイ URL にアクセス
2. ログインページが表示されることを確認
3. 認証情報でログイン
4. ダッシュボードが表示されることを確認

## トラブルシューティング

### ログインできない

- 環境変数で `ADMIN_USERNAME` と `ADMIN_PASSWORD` が正しく設定されているか確認
- ブラウザの Cookie が有効になっているか確認

### ビルドが失敗する

- `npm run build` がローカルで成功するか確認
- Node.js バージョンが 18 以上か確認

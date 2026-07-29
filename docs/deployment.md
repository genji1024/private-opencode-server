# デプロイガイド

## Vercel へのデプロイ

### 前提条件

- Vercel アカウント
- GitHub リポジトリとの連携

### デプロイ手順

1. Vercel ダッシュボードで "New Project" をクリック
2. `private-opencode-server` リポジトリをインポート
3. 環境変数を設定:
   - `ADMIN_USERNAME` — 管理者ユーザー名
   - `ADMIN_PASSWORD` — 管理者パスワード
4. "Deploy" をクリック

### 環境変数

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `ADMIN_USERNAME` | いいえ | `admin` | Basic Auth のユーザー名 |
| `ADMIN_PASSWORD` | はい | — | Basic Auth のパスワード |
| `OPENCODE_SERVE_PORT` | いいえ | `4096` | opencode serve のポート |

## サーバーレス環境の制限事項

Vercel はサーバーレスプラットフォームのため、以下の機能は**利用できません**:

### 利用できない機能

| 機能 | 理由 |
|------|------|
| セッション管理（プロセス起動） | `child_process.spawn` がサーバーレスで動作しない |
| OpenCode Web UI | `opencode serve` プロセスを起動できない |
| 永続的なデータ保存 | SQLite が `/tmp` に配置されるため、コールドスタート間でリセット |

### 利用可能な機能

- ダッシュボード表示（セッション一覧は空になる）
- 認証（ログイン/ログアウト）
- 設定管理（ただしコールドスタート間でリセット）
- GitHub Webhook 受信

### ローカル環境での利用

フル機能を利用するには、ローカル環境で実行してください:

```bash
npm install
npm run dev
```

## デプロイ後の確認

1. デプロイ URL にアクセス
2. ログインページが表示されることを確認
3. 認証情報でログイン
4. ダッシュボードが表示されることを確認
5. OpenCode Web UI ページで「サーバーレス環境では利用できません」のメッセージが表示されることを確認

## トラブルシューティング

### ログインできない

- Vercel の環境変数で `ADMIN_USERNAME` と `ADMIN_PASSWORD` が正しく設定されているか確認
- ブラウザの Cookie が有効になっているか確認

### ダッシュボードがエラーを表示

- Vercel の Functions ログを確認
- `better-sqlite3` のネイティブモジュールが正しくビルドされているか確認
  - Vercel は自動でネイティブモジュールをビルドするはず

### ビルドが失敗する

- `npm run build` がローカルで成功するか確認
- Node.js バージョンが 18 以上か確認

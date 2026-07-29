# API リファレンス

## 認証

すべての API エンドポイント（`/api/auth` と `/api/webhook` を除く）は認証が必要。

認証方法:
- `Authorization: Basic <base64(username:password)>` ヘッダー
- `auth_token` Cookie

---

## POST `/api/auth`

ログイン。フォームデータを受け取り、認証後に Cookie を設定して `/` にリダイレクト。

**リクエスト:**
```
Content-Type: application/x-www-form-urlencoded

username=admin&password=changeme
```

**レスポンス:**
- 成功: `302 Redirect` to `/`（`auth_token` Cookie 設定済み）
- 失敗: `302 Redirect` to `/login?error=1`

---

## GET `/api/sessions`

セッション一覧を取得。

**レスポンス:**
```json
[
  {
    "id": "uuid",
    "repo": "owner/repo",
    "event": "manual",
    "status": "running",
    "startedAt": "2026-01-01T00:00:00Z",
    "finishedAt": null,
    "exitCode": null,
    "error": null,
    "pid": 12345
  }
]
```

---

## POST `/api/sessions`

新規セッションを作成。

**リクエスト:**
```json
{
  "repo": "owner/repo",
  "instruction": "Fix the bug in..."
}
```

**レスポンス:** `201 Created`
```json
{
  "id": "uuid",
  "repo": "owner/repo",
  "event": "manual",
  "status": "pending",
  "startedAt": "2026-01-01T00:00:00Z",
  "finishedAt": null,
  "exitCode": null,
  "error": null,
  "pid": null
}
```

---

## GET `/api/sessions/[id]`

セッション詳細を取得。

**レスポンス:**
```json
{
  "session": { ... },
  "logs": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "timestamp": "2026-01-01T00:00:00Z",
      "stream": "stdout",
      "text": "..."
    }
  ]
}
```

---

## DELETE `/api/sessions/[id]`

セッションをキャンセル。

**レスポンス:**
```json
{ "success": true }
```

---

## GET `/api/sessions/[id]/stream`

SSE（Server-Sent Events）でリアルタイムログストリームを取得。

**レスポンス:** `text/event-stream`
```
data: {"id":"uuid","sessionId":"uuid","timestamp":"...","stream":"stdout","text":"..."}

data: {"id":"uuid","sessionId":"uuid","timestamp":"...","stream":"stderr","text":"..."}

event: done
data: {"id":"uuid","status":"completed",...}
```

---

## POST `/api/sessions/[id]/message`

実行中のセッションにメッセージを送信。

**リクエスト:**
```json
{ "message": "Please continue..." }
```

**レスポンス:**
```json
{ "success": true }
```

---

## GET `/api/config`

設定一覧を取得。

**レスポンス:**
```json
[
  { "key": "github_token", "value": "ghp_...", "updatedAt": "2026-01-01T00:00:00Z" }
]
```

---

## PUT `/api/config/[key]`

設定を更新。

**リクエスト:**
```json
{ "value": "new-value" }
```

**レスポンス:**
```json
{ "success": true }
```

---

## DELETE `/api/config/[key]`

設定を削除。

**レスポンス:**
```json
{ "success": true }
```

---

## GET `/api/opencode-serve`

opencode serve のステータスを取得。

**レスポンス:**
```json
{
  "running": true,
  "port": 4096,
  "url": "http://127.0.0.1:4096",
  "pid": 12345,
  "opencodeAvailable": true,
  "serverless": false
}
```

---

## POST `/api/opencode-serve`

opencode serve を起動/停止。

**リクエスト:**
```json
{ "action": "start" }
```
or
```json
{ "action": "stop" }
```

**レスポンス (start):**
```json
{ "url": "http://127.0.0.1:4096", "port": 4096, "running": true }
```

**レスポンス (stop):**
```json
{ "stopped": true }
```

---

## POST `/api/webhook/github`

GitHub Webhook イベントを受信。

**レスポンス:**
```json
{ "received": true, "bodyLength": 1234 }
```

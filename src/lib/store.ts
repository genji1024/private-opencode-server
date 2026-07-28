import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const DATA_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DATA_DIR, "opencode-server.db")

export interface SessionRow {
  id: string
  repo: string
  event: string
  status: "running" | "completed" | "failed" | "pending"
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
  error: string | null
  pid: number | null
}

export interface LogRow {
  id: string
  sessionId: string
  timestamp: string
  stream: "stdout" | "stderr"
  text: string
}

export interface ConfigRow {
  key: string
  value: string
  updatedAt: string
}

class Store {
  private db: Database.Database

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    this.db = new Database(DB_PATH)
    this.db.pragma("journal_mode = WAL")
    this.migrate()
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        repo TEXT NOT NULL,
        event TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        startedAt TEXT NOT NULL,
        finishedAt TEXT,
        exitCode INTEGER,
        error TEXT,
        pid INTEGER
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        stream TEXT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES sessions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_logs_sessionId ON logs(sessionId);

      CREATE TABLE IF NOT EXISTS configs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `)
  }

  createSession(session: SessionRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, repo, event, status, startedAt, finishedAt, exitCode, error, pid)
      VALUES (@id, @repo, @event, @status, @startedAt, @finishedAt, @exitCode, @error, @pid)
    `)
    stmt.run(session)
  }

  getSession(id: string): SessionRow | undefined {
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE id = ?")
    return stmt.get(id) as SessionRow | undefined
  }

  listSessions(): SessionRow[] {
    const stmt = this.db.prepare("SELECT * FROM sessions ORDER BY startedAt DESC")
    return stmt.all() as SessionRow[]
  }

  updateSessionStatus(
    id: string,
    status: SessionRow["status"],
    extras?: { finishedAt?: string; exitCode?: number | null; error?: string | null; pid?: number | null },
  ): void {
    const sets: string[] = ["status = @status"]
    const params: Record<string, unknown> = { id, status }
    if (extras?.finishedAt !== undefined) {
      sets.push("finishedAt = @finishedAt")
      params.finishedAt = extras.finishedAt
    }
    if (extras?.exitCode !== undefined) {
      sets.push("exitCode = @exitCode")
      params.exitCode = extras.exitCode
    }
    if (extras?.error !== undefined) {
      sets.push("error = @error")
      params.error = extras.error
    }
    if (extras?.pid !== undefined) {
      sets.push("pid = @pid")
      params.pid = extras.pid
    }
    this.db.prepare(`UPDATE sessions SET ${sets.join(", ")} WHERE id = @id`).run(params)
  }

  insertLog(log: LogRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO logs (id, sessionId, timestamp, stream, text)
      VALUES (@id, @sessionId, @timestamp, @stream, @text)
    `)
    stmt.run(log)
  }

  getLogs(sessionId: string): LogRow[] {
    const stmt = this.db.prepare(
      "SELECT * FROM logs WHERE sessionId = ? ORDER BY timestamp ASC",
    )
    return stmt.all(sessionId) as LogRow[]
  }

  getConfig(key: string): string | undefined {
    const stmt = this.db.prepare("SELECT value FROM configs WHERE key = ?")
    const row = stmt.get(key) as { value: string } | undefined
    return row?.value
  }

  setConfig(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO configs (key, value, updatedAt)
      VALUES (@key, @value, @updatedAt)
      ON CONFLICT(key) DO UPDATE SET value = @value, updatedAt = @updatedAt
    `)
    stmt.run({ key, value, updatedAt: new Date().toISOString() })
  }

  deleteConfig(key: string): void {
    this.db.prepare("DELETE FROM configs WHERE key = ?").run(key)
  }

  listConfigs(): ConfigRow[] {
    const stmt = this.db.prepare("SELECT * FROM configs ORDER BY key")
    return stmt.all() as ConfigRow[]
  }

  close(): void {
    this.db.close()
  }
}

export const store = new Store()

export interface Session {
  id: string
  repo: string
  event: string
  status: "running" | "completed" | "failed"
  startedAt: string
  finishedAt?: string
  logs: string[]
}

class SessionManager {
  private sessions: Map<string, Session> = new Map()

  async create(repo: string, event: string): Promise<Session> {
    const id = crypto.randomUUID()
    const session: Session = {
      id,
      repo,
      event,
      status: "running",
      startedAt: new Date().toISOString(),
      logs: [],
    }
    this.sessions.set(id, session)
    return session
  }

  async get(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null
  }

  async list(): Promise<Session[]> {
    return Array.from(this.sessions.values())
  }

  async appendLog(id: string, message: string): Promise<void> {
    const session = this.sessions.get(id)
    if (session) {
      session.logs.push(message)
    }
  }

  async updateStatus(
    id: string,
    status: "running" | "completed" | "failed",
  ): Promise<void> {
    const session = this.sessions.get(id)
    if (session) {
      session.status = status
      if (status !== "running") {
        session.finishedAt = new Date().toISOString()
      }
    }
  }
}

export const sessionManager = new SessionManager()

import { v4 as uuidv4 } from "uuid"
import { store, SessionRow, LogRow } from "./store"
import {
  startOpenCodeProcess,
  sendMessageToProcess,
  cancelProcess,
  isProcessAlive,
  canStart,
} from "./opencode-process"

export interface SessionDetail {
  session: SessionRow
  logs: LogRow[]
}

export interface CreateSessionInput {
  repo: string
  instruction: string
}

class SessionManager {
  async create(input: CreateSessionInput): Promise<SessionRow> {
    if (!canStart()) {
      throw new Error("Maximum concurrent sessions limit reached")
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    const session: SessionRow = {
      id,
      repo: input.repo,
      event: "manual",
      status: "pending",
      startedAt: now,
      finishedAt: null,
      exitCode: null,
      error: null,
      pid: null,
    }

    store.createSession(session)

    startOpenCodeProcess(id, input.repo, input.instruction).catch((err) => {
      store.updateSessionStatus(id, "failed", {
        finishedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      })
    })

    return session
  }

  async get(id: string): Promise<SessionDetail | null> {
    const session = store.getSession(id)
    if (!session) return null

    const logs = store.getLogs(id)
    return { session, logs }
  }

  async list(): Promise<SessionRow[]> {
    return store.listSessions()
  }

  async sendMessage(sessionId: string, message: string): Promise<boolean> {
    const session = store.getSession(sessionId)
    if (!session) return false
    return sendMessageToProcess(sessionId, message)
  }

  async cancelSession(sessionId: string): Promise<boolean> {
    const session = store.getSession(sessionId)
    if (!session) return false
    return cancelProcess(sessionId)
  }

  isAlive(sessionId: string): boolean {
    return isProcessAlive(sessionId)
  }
}

export const sessionManager = new SessionManager()

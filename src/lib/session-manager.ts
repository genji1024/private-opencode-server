import { v4 as uuidv4 } from 'uuid'
import { store, SessionRow, LogRow } from './store'
import {
  startOpenCodeProcess,
  sendMessageToProcess,
  cancelProcess,
  isProcessAlive,
  canStart,
} from './opencode-process'

export interface SessionDetail {
  session: SessionRow
  logs: LogRow[]
}

export interface CreateSessionInput {
  repo: string
  instruction: string
}

export interface SendMessageResult {
  success: boolean
  error?: string
  reason?: 'not_found' | 'not_running' | 'failed'
}

class SessionManager {
  async create(input: CreateSessionInput): Promise<SessionRow> {
    if (!canStart()) {
      throw new Error('Maximum concurrent sessions limit reached')
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    const session: SessionRow = {
      id,
      repo: input.repo,
      event: 'manual',
      status: 'pending',
      startedAt: now,
      finishedAt: null,
      exitCode: null,
      error: null,
      pid: null,
    }

    store.createSession(session)

    startOpenCodeProcess(id, input.repo, input.instruction).catch((err) => {
      store.updateSessionStatus(id, 'failed', {
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

  async sendMessage(sessionId: string, message: string): Promise<SendMessageResult> {
    const session = store.getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found', reason: 'not_found' }
    }

    if (!isProcessAlive(sessionId)) {
      if (session.status === 'running') {
        return {
          success: false,
          error: 'Process is not running (zombie state)',
          reason: 'not_running',
        }
      }
      const detail = session.error ? `: ${session.error}` : ' (process has exited)'
      return {
        success: false,
        error: `Session is ${session.status}${detail}`,
        reason: 'not_running',
      }
    }

    const ok = sendMessageToProcess(sessionId, message)
    if (!ok) {
      return {
        success: false,
        error: 'Failed to send message (stdin not available)',
        reason: 'failed',
      }
    }

    return { success: true }
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

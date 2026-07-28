import { spawn, ChildProcess } from "child_process"
import { v4 as uuidv4 } from "uuid"
import { store, LogRow } from "./store"

export interface OpenCodeProcessResult {
  exitCode: number | null
  error: string | null
  finishedAt: string
}

export interface ManagedProcess {
  sessionId: string
  process: ChildProcess
  startedAt: string
}

const activeProcesses = new Map<string, ManagedProcess>()
const MAX_CONCURRENT = 5

export function getActiveCount(): number {
  return activeProcesses.size
}

export function canStart(): boolean {
  return activeProcesses.size < MAX_CONCURRENT
}

export async function startOpenCodeProcess(
  sessionId: string,
  repo: string,
  instruction: string,
  cwd?: string,
): Promise<void> {
  const args = ["run", "--format", "json"]
  if (instruction) {
    args.push(instruction)
  }

  const proc = spawn("opencode", args, {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
  })

  const managed: ManagedProcess = {
    sessionId,
    process: proc,
    startedAt: new Date().toISOString(),
  }
  activeProcesses.set(sessionId, managed)

  store.updateSessionStatus(sessionId, "running", { pid: proc.pid ?? null })

  const handleData = (stream: "stdout" | "stderr") => (data: Buffer) => {
    const text = data.toString()
    const log: LogRow = {
      id: uuidv4(),
      sessionId,
      timestamp: new Date().toISOString(),
      stream,
      text,
    }
    store.insertLog(log)
  }

  if (proc.stdout) {
    proc.stdout.on("data", handleData("stdout"))
  }
  if (proc.stderr) {
    proc.stderr.on("data", handleData("stderr"))
  }

  return new Promise((resolve) => {
    proc.on("close", (code) => {
      const finishedAt = new Date().toISOString()
      const error = code !== 0 ? `Process exited with code ${code}` : null
      store.updateSessionStatus(sessionId, code === 0 ? "completed" : "failed", {
        finishedAt,
        exitCode: code,
        error,
      })
      activeProcesses.delete(sessionId)
      resolve()
    })

    proc.on("error", (err) => {
      const finishedAt = new Date().toISOString()
      store.updateSessionStatus(sessionId, "failed", {
        finishedAt,
        error: err.message,
      })
      activeProcesses.delete(sessionId)
      resolve()
    })
  })
}

export function sendMessageToProcess(sessionId: string, message: string): boolean {
  const managed = activeProcesses.get(sessionId)
  if (!managed || !managed.process.stdin) return false

  managed.process.stdin.write(message + "\n")

  const log: LogRow = {
    id: uuidv4(),
    sessionId,
    timestamp: new Date().toISOString(),
    stream: "stdout",
    text: `> ${message}\n`,
  }
  store.insertLog(log)
  return true
}

export function cancelProcess(sessionId: string): boolean {
  const managed = activeProcesses.get(sessionId)
  if (!managed) return false

  managed.process.kill("SIGTERM")
  setTimeout(() => {
    if (activeProcesses.has(sessionId)) {
      managed.process.kill("SIGKILL")
    }
  }, 5000)
  return true
}

export function isProcessAlive(sessionId: string): boolean {
  const managed = activeProcesses.get(sessionId)
  if (!managed) return false
  return managed.process.exitCode === null && managed.process.killed === false
}

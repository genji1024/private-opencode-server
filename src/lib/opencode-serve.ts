import { spawn, ChildProcess } from "child_process"

let serverProcess: ChildProcess | null = null
let serverPort = 4096
let isRunning = false

export function getServePort(): number {
  return parseInt(process.env.OPENCODE_SERVE_PORT ?? "4096", 10)
}

export function getServerUrl(): string {
  serverPort = getServePort()
  return `http://localhost:${serverPort}`
}

export async function startServer(): Promise<{ url: string; port: number }> {
  if (isRunning && serverProcess && !serverProcess.killed) {
    return { url: getServerUrl(), port: getServePort() }
  }

  serverPort = getServePort()

  return new Promise((resolve, reject) => {
    const proc = spawn("opencode", ["serve", "--port", String(serverPort)], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    })

    serverProcess = proc
    isRunning = true

    const timeout = setTimeout(() => {
      resolve({ url: getServerUrl(), port: serverPort })
    }, 3000)

    proc.on("error", () => {
      isRunning = false
      serverProcess = null
      clearTimeout(timeout)
      reject(new Error("opencode serve の起動に失敗しました"))
    })

    proc.on("close", () => {
      isRunning = false
      serverProcess = null
    })
  })
}

export function stopServer(): boolean {
  if (!serverProcess || !isRunning) return false

  serverProcess.kill("SIGTERM")
  setTimeout(() => {
    if (serverProcess && isRunning) {
      serverProcess.kill("SIGKILL")
    }
  }, 5000)

  isRunning = false
  return true
}

export function isServerRunning(): boolean {
  return isRunning && serverProcess !== null && !serverProcess.killed
}

export function getServerStatus() {
  return {
    running: isServerRunning(),
    port: getServePort(),
    url: getServerUrl(),
    pid: serverProcess?.pid ?? null,
  }
}

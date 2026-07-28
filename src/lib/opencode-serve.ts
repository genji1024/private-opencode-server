import { spawn, ChildProcess } from "child_process"
import { resolve as pathResolve } from "path"

let serverProcess: ChildProcess | null = null
let serverPort = 4096
let isRunning = false

function getOpencodeBin(): string {
  const localBin = pathResolve(process.cwd(), "node_modules", ".bin", "opencode")
  try {
    require("fs").accessSync(localBin)
    return localBin
  } catch {
    return "opencode"
  }
}

export function getServePort(): number {
  return parseInt(process.env.OPENCODE_SERVE_PORT ?? "4096", 10)
}

export function getServerUrl(): string {
  serverPort = getServePort()
  return `http://127.0.0.1:${serverPort}`
}

export function checkOpencodeAvailable(): boolean {
  const { execSync } = require("child_process")
  const bin = getOpencodeBin()
  try {
    execSync(`"${bin}" --version`, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

async function isServerReachable(): Promise<boolean> {
  const url = getServerUrl()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok || res.status === 200
  } catch {
    return false
  }
}

export async function startServer(): Promise<{ url: string; port: number }> {
  const port = getServePort()

  const reachable = await isServerReachable()
  if (reachable) {
    isRunning = true
    return { url: getServerUrl(), port }
  }

  if (isRunning && serverProcess && !serverProcess.killed) {
    return { url: getServerUrl(), port }
  }

  if (!checkOpencodeAvailable()) {
    throw new Error(
      "opencode CLI が見つかりません。npm install で opencode-ai がインストールされているか確認してください。",
    )
  }

  serverPort = port
  const bin = getOpencodeBin()

  return new Promise((resolvePromise, reject) => {
    const proc = spawn(bin, ["serve", "--port", String(port)], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      env: {
        ...process.env,
        PATH: `${pathResolve(process.cwd(), "node_modules", ".bin")}:${process.env.PATH}`,
      },
    })

    serverProcess = proc
    isRunning = true
    proc.unref()

    let settled = false

    const timeout = setTimeout(async () => {
      if (settled) return
      const reachable = await isServerReachable()
      if (reachable) {
        settled = true
        resolvePromise({ url: getServerUrl(), port })
      } else {
        settled = true
        isRunning = false
        serverProcess = null
        reject(new Error("opencode serve が起動しましたが、接続できませんでした。"))
      }
    }, 5000)

    proc.on("error", (err) => {
      if (settled) return
      settled = true
      isRunning = false
      serverProcess = null
      clearTimeout(timeout)
      reject(
        new Error(`opencode serve の起動に失敗しました: ${err.message}`),
      )
    })

    proc.on("close", (code) => {
      if (settled) return
      if (code !== 0) {
        settled = true
        isRunning = false
        serverProcess = null
        clearTimeout(timeout)
        reject(new Error(`opencode serve が終了しました (exit code: ${code})`))
      }
    })

    let stderr = ""
    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString()
    })
  })
}

export function stopServer(): boolean {
  if (!serverProcess || !isRunning) return false

  try {
    if (serverProcess.pid) {
      process.kill(-serverProcess.pid, "SIGTERM")
    } else {
      serverProcess.kill("SIGTERM")
    }
  } catch {
    // process may already be dead
  }

  setTimeout(() => {
    try {
      if (serverProcess?.pid) {
        process.kill(-serverProcess.pid, "SIGKILL")
      }
    } catch {
      // ignore
    }
  }, 5000)

  isRunning = false
  return true
}

export async function isServerRunning(): Promise<boolean> {
  if (isRunning && serverProcess && !serverProcess.killed) return true
  return isServerReachable()
}

export async function getServerStatus() {
  const reachable = await isServerReachable()
  return {
    running: reachable || (isRunning && serverProcess !== null && !serverProcess.killed),
    port: getServePort(),
    url: getServerUrl(),
    pid: serverProcess?.pid ?? null,
    opencodeAvailable: checkOpencodeAvailable(),
  }
}

import { spawn, ChildProcess } from "child_process"
import { resolve } from "path"

let serverProcess: ChildProcess | null = null
let serverPort = 4096
let isRunning = false

function getOpencodeBin(): string {
  const localBin = resolve(process.cwd(), "node_modules", ".bin", "opencode")
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
  return `http://localhost:${serverPort}`
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

export async function startServer(): Promise<{ url: string; port: number }> {
  if (isRunning && serverProcess && !serverProcess.killed) {
    return { url: getServerUrl(), port: getServePort() }
  }

  if (!checkOpencodeAvailable()) {
    throw new Error(
      "opencode CLI が見つかりません。npm install で opencode-ai がインストールされているか確認してください。",
    )
  }

  serverPort = getServePort()
  const bin = getOpencodeBin()

  return new Promise((resolve, reject) => {
    const proc = spawn(bin, ["serve", "--port", String(serverPort)], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      env: {
        ...process.env,
        PATH: `${resolve(process.cwd(), "node_modules", ".bin")}:${process.env.PATH}`,
      },
    })

    serverProcess = proc
    isRunning = true

    const timeout = setTimeout(() => {
      resolve({ url: getServerUrl(), port: serverPort })
    }, 3000)

    proc.on("error", (err) => {
      isRunning = false
      serverProcess = null
      clearTimeout(timeout)
      reject(
        new Error(`opencode serve の起動に失敗しました: ${err.message}`),
      )
    })

    proc.on("close", (code) => {
      if (code !== 0 && isRunning) {
        isRunning = false
        serverProcess = null
        clearTimeout(timeout)
        reject(new Error(`opencode serve が終了しました (exit code: ${code})`))
      }
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
    opencodeAvailable: checkOpencodeAvailable(),
  }
}

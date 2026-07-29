import { spawn, execSync, ChildProcess } from "child_process"
import { resolve as pathResolve } from "path"
import { existsSync } from "fs"

let serverProcess: ChildProcess | null = null
let serverPort = 4096
let isRunning = false

function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY
  )
}

function getOpencodeBin(): string {
  const localBin = pathResolve(process.cwd(), "node_modules", ".bin", "opencode")
  if (existsSync(localBin)) {
    return localBin
  }
  return "opencode"
}

function getPostinstallScript(): string | null {
  const postinstallPath = pathResolve(
    process.cwd(),
    "node_modules",
    "opencode-ai",
    "postinstall.mjs",
  )
  if (existsSync(postinstallPath)) {
    return postinstallPath
  }
  return null
}

function runPostinstall(): boolean {
  const script = getPostinstallScript()
  if (!script) return false
  try {
    execSync(`node "${script}"`, { stdio: "inherit", cwd: process.cwd() })
    return true
  } catch {
    return false
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
  if (isServerless()) return false
  const bin = getOpencodeBin()
  try {
    execSync(`"${bin}" --version`, { stdio: "ignore" })
    return true
  } catch {
    if (runPostinstall()) {
      try {
        execSync(`"${bin}" --version`, { stdio: "ignore" })
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

async function isServerReachable(): Promise<boolean> {
  if (isServerless()) return false
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
  if (isServerless()) {
    throw new Error(
      "サーバーレス環境（Vercel等）では opencode serve を起動できません。ローカル環境で実行してください。",
    )
  }

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
      env: {
        ...process.env,
        PATH: `${pathResolve(process.cwd(), "node_modules", ".bin")}:${process.env.PATH}`,
      },
    })

    serverProcess = proc
    isRunning = true

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
    }, 8000)

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
      isRunning = false
      serverProcess = null
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        reject(new Error(`opencode serve が終了しました (exit code: ${code})`))
      }
    })

    proc.stderr?.on("data", () => {
      // consume stderr to prevent backpressure
    })
  })
}

export function stopServer(): boolean {
  if (isServerless()) return false
  if (!serverProcess || !isRunning) return false

  try {
    serverProcess.kill("SIGTERM")
  } catch {
    // process may already be dead
  }

  setTimeout(() => {
    try {
      serverProcess?.kill("SIGKILL")
    } catch {
      // ignore
    }
  }, 5000)

  isRunning = false
  serverProcess = null
  return true
}

export async function isServerRunning(): Promise<boolean> {
  if (isServerless()) return false
  if (isRunning && serverProcess && !serverProcess.killed) return true
  return isServerReachable()
}

export async function getServerStatus() {
  return {
    running: false,
    port: getServePort(),
    url: getServerUrl(),
    pid: null,
    opencodeAvailable: checkOpencodeAvailable(),
    serverless: isServerless(),
  }
}

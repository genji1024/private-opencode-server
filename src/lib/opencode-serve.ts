import { spawn, ChildProcess } from 'child_process'
import { resolve as pathResolve } from 'path'
import { existsSync } from 'fs'

let serverProcess: ChildProcess | null = null
let isRunning = false

export function getServerUrl(): string {
  return process.env.OPENCODE_SERVER_URL ?? 'http://127.0.0.1:4096'
}

function isRemoteServer(): boolean {
  try {
    const parsed = new URL(getServerUrl())
    return (
      parsed.hostname !== '127.0.0.1' &&
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '0.0.0.0'
    )
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
  const url = getServerUrl()

  if (await isServerReachable()) {
    isRunning = true
    const parsed = new URL(url)
    return { url, port: parseInt(parsed.port, 10) || 4096 }
  }

  if (isRemoteServer()) {
    throw new Error(
      'OpenCode サーバーに接続できません。opencode-srv コンテナが起動しているか確認してください。',
    )
  }

  if (isRunning && serverProcess && !serverProcess.killed) {
    return { url, port: parseInt(new URL(url).port, 10) || 4096 }
  }

  const port = parseInt(new URL(url).port, 10) || 4096

  function getOpencodeBin(): string {
    const localBin = pathResolve(process.cwd(), 'node_modules', '.bin', 'opencode')
    if (existsSync(localBin)) {
      return localBin
    }
    return 'opencode'
  }

  const bin = getOpencodeBin()

  return new Promise((resolvePromise, reject) => {
    const proc = spawn(bin, ['serve', '--port', String(port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        HOME: process.env.HOME || '/tmp',
      },
    })

    serverProcess = proc
    isRunning = true

    let settled = false
    let stderrOutput = ''

    const timeout = setTimeout(async () => {
      if (settled) return
      if (await isServerReachable()) {
        settled = true
        resolvePromise({ url, port })
      } else {
        settled = true
        isRunning = false
        serverProcess = null
        reject(new Error('opencode serve が起動しましたが、接続できませんでした。'))
      }
    }, 8000)

    proc.on('error', (err) => {
      if (settled) return
      settled = true
      isRunning = false
      serverProcess = null
      clearTimeout(timeout)
      reject(new Error(`opencode serve の起動に失敗しました: ${err.message}`))
    })

    proc.on('close', (code) => {
      isRunning = false
      serverProcess = null
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        const detail = stderrOutput.trim() ? ` (stderr: ${stderrOutput.trim()})` : ''
        reject(new Error(`opencode serve が終了しました (exit code: ${code})${detail}`))
      }
    })

    proc.stderr?.on('data', (data) => {
      stderrOutput += data.toString()
    })
  })
}

export function stopServer(): boolean {
  if (isRemoteServer()) {
    return false
  }
  if (!serverProcess || !isRunning) return false

  try {
    serverProcess.kill('SIGTERM')
  } catch {}

  setTimeout(() => {
    try {
      serverProcess?.kill('SIGKILL')
    } catch {}
  }, 5000)

  isRunning = false
  serverProcess = null
  return true
}

export async function isServerRunning(): Promise<boolean> {
  if (await isServerReachable()) return true
  return isRunning && serverProcess !== null && !serverProcess.killed
}

export async function getServerStatus() {
  const reachable = await isServerReachable()
  const running = reachable || (isRunning && serverProcess !== null && !serverProcess.killed)
  return {
    running,
    port: parseInt(new URL(getServerUrl()).port, 10) || 4096,
    url: getServerUrl(),
    pid: !isRemoteServer() ? (serverProcess?.pid ?? null) : null,
    opencodeAvailable: reachable || true,
    remoteServer: isRemoteServer(),
  }
}

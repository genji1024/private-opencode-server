import { spawn, execSync, ChildProcess } from 'child_process'
import { resolve as pathResolve } from 'path'
import { existsSync } from 'fs'

let serverProcess: ChildProcess | null = null
let serverPort = 4096
let isRunning = false

function getOpencodeBin(): string {
  const localBin = pathResolve(process.cwd(), 'node_modules', '.bin', 'opencode')
  if (existsSync(localBin)) {
    return localBin
  }
  return 'opencode'
}

function getPostinstallScript(): string | null {
  const postinstallPath = pathResolve(
    process.cwd(),
    'node_modules',
    'opencode-ai',
    'postinstall.mjs',
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
    execSync(`node "${script}"`, { stdio: 'inherit', cwd: process.cwd() })
    return true
  } catch {
    return false
  }
}

export function getServePort(): number {
  return parseInt(process.env.OPENCODE_SERVE_PORT ?? '4096', 10)
}

export function getServerUrl(): string {
  serverPort = getServePort()
  return `http://127.0.0.1:${serverPort}`
}

export function checkOpencodeAvailable(): boolean {
  const bin = getOpencodeBin()
  try {
    execSync(`"${bin}" --version`, { stdio: 'ignore' })
    return true
  } catch {
    if (runPostinstall()) {
      try {
        execSync(`"${bin}" --version`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    }
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
      'opencode CLI が見つかりません。npm install で opencode-ai がインストールされているか確認してください。',
    )
  }

  serverPort = port
  const bin = getOpencodeBin()

  return new Promise((resolvePromise, reject) => {
    const proc = spawn(bin, ['serve', '--print-logs', '--port', String(port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        HOME: process.env.HOME || '/tmp',
        PATH: `${pathResolve(process.cwd(), 'node_modules', '.bin')}:${process.env.PATH}`,
        XDG_CONFIG_HOME:
          process.env.XDG_CONFIG_HOME || pathResolve(process.env.HOME || '/tmp', '.config'),
        XDG_DATA_HOME:
          process.env.XDG_DATA_HOME || pathResolve(process.env.HOME || '/tmp', '.local', 'share'),
      } as any,
    })

    serverProcess = proc
    isRunning = true

    let settled = false
    let stderrOutput = ''

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
  if (!serverProcess || !isRunning) return false

  try {
    serverProcess.kill('SIGTERM')
  } catch {
    // process may already be dead
  }

  setTimeout(() => {
    try {
      serverProcess?.kill('SIGKILL')
    } catch {
      // ignore
    }
  }, 5000)

  isRunning = false
  serverProcess = null
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

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const INJECT_SCRIPT = `<script>(function(){function t(u){if(typeof u==='string'&&u[0]==='/'&&!u.startsWith('/opencode-proxy'))return '/opencode-proxy'+u;return u}var f=window.fetch;window.fetch=function(i,n){if(typeof i==='string'){i=t(i)}else if(i&&i.url){var u=t(i.url);if(u!==i.url)i=new Request(u,i)}return f.call(this,i,n)};if(window.EventSource){var E=window.EventSource;window.EventSource=function(u,c){return new E(t(u),c)}}})();</script>`

function backendUrl(): string {
  return (process.env.OPENCODE_SERVER_URL ?? 'http://127.0.0.1:4096').replace(/\/$/, '')
}

async function proxy(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const path = segments.length ? segments.join('/') : ''
  const target = `${backendUrl()}/${path}${req.nextUrl.search}`
  const headers = new Headers()
  req.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'host' || k.toLowerCase() === 'connection') return
    headers.set(k, v)
  })
  headers.set('host', new URL(target).host)

  const init: RequestInit & { duplex?: 'half' } = { method: req.method, headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
    init.duplex = 'half'
  }

  const backendRes = await fetch(target, init)

  const resHeaders = new Headers()
  backendRes.headers.forEach((v, k) => {
    resHeaders.set(k, v)
  })

  const contentType = backendRes.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    resHeaders.delete('content-length')
    let html = await backendRes.text()
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, (m) => m + INJECT_SCRIPT)
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/<html([^>]*)>/i, (m) => m + INJECT_SCRIPT)
    } else {
      html = INJECT_SCRIPT + html
    }
    html = html.replace(
      /(\s)(src|href)=["']\/((?!\/|opencode-proxy\/)[^"']*)["']/gi,
      '$1$2="/opencode-proxy/$3"',
    )
    return new NextResponse(html, { status: backendRes.status, headers: resHeaders })
  }

  return new NextResponse(backendRes.body, { status: backendRes.status, headers: resHeaders })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const p = await params
  return proxy(req, p?.path ?? [])
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const p = await params
  return proxy(req, p?.path ?? [])
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const p = await params
  return proxy(req, p?.path ?? [])
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const p = await params
  return proxy(req, p?.path ?? [])
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const p = await params
  return proxy(req, p?.path ?? [])
}

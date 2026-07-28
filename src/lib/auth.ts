export function verifyAuth(request: Request): boolean {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
  const adminPassword = process.env.ADMIN_PASSWORD ?? ""

  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Basic ")) {
    const token = authHeader.slice(6)
    const decoded = Buffer.from(token, "base64").toString()
    const [username, password] = decoded.split(":")
    if (username === adminUsername && password === adminPassword) {
      return true
    }
  }

  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/)
  if (match) {
    try {
      const raw = decodeURIComponent(match[1])
      const decoded = Buffer.from(raw, "base64").toString()
      const [username, password] = decoded.split(":")
      if (username === adminUsername && password === adminPassword) {
        return true
      }
    } catch {}
  }

  return false
}

export function verifyAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Basic ")) return false

  const token = authHeader.slice(6)
  const decoded = Buffer.from(token, "base64").toString()
  const [username, password] = decoded.split(":")

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin"
  const adminPassword = process.env.ADMIN_PASSWORD ?? ""

  return username === adminUsername && password === adminPassword
}

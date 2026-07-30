'use client'

import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        body: formData,
        redirect: 'manual',
      })
      if (res.status === 0 || res.type === 'opaqueredirect' || res.ok) {
        window.location.href = '/'
        return
      }
      setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-8">ログイン</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            ユーザー名
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">ユーザー名またはパスワードが正しくありません</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black text-white py-2 hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </main>
  )
}

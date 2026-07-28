export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-8">ログイン</h1>
      <form
        action="/api/auth"
        method="POST"
        className="w-full max-w-sm space-y-4"
      >
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
        <button
          type="submit"
          className="w-full rounded bg-black text-white py-2 hover:bg-gray-800"
        >
          ログイン
        </button>
      </form>
    </main>
  )
}

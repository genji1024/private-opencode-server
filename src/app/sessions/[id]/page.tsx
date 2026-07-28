export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">セッション詳細</h1>
      <p className="text-gray-500">準備中</p>
    </main>
  )
}

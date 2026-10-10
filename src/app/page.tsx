import { prisma } from '@/lib/prisma'
import CardGridSortable, { type CardData } from './CardGridSortable'

export const instant = false

export default async function Home() {
  const roots = await prisma.blueprint.findMany({
    where: { parentId: null },
    include: {
      children: { select: { id: true, slug: true, judul: true }, orderBy: { urut: 'asc' } },
      _count: { select: { bagian: true } },
    },
    orderBy: { urut: 'asc' },
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Blueprint Engine</h1>
          <p className="text-sm text-zinc-500">Wiki aplikasi — human &amp; AI readable</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 text-sm bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800">
            + Baru
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['Semua', 'Mobile', 'Web', 'Backend', 'Library'].map((f, i) => (
          <button
            key={f}
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              i === 0 ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <CardGridSortable initialCards={roots as unknown as CardData[]} />
    </div>
  )
}

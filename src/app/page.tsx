import { prisma } from '@/lib/prisma'

export const instant = false

const STATUS_COLOR: Record<string, string> = {
  aktif: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  arsip: 'bg-zinc-100 text-zinc-500',
}

export default async function Home() {
  const roots = await prisma.blueprint.findMany({
    where: { parentId: null },
    include: {
      children: { select: { slug: true, judul: true }, orderBy: { urut: 'asc' } },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roots.map((bp) => {
          const tags: string[] = JSON.parse(bp.tag)
          return (
            <a
              key={bp.id}
              href={`/bp/${bp.slug}`}
              className="bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[bp.status] || STATUS_COLOR.draft}`}>
                      {bp.status.toUpperCase()}
                    </span>
                    {bp.versi && (
                      <span className="text-[10px] text-zinc-400 font-mono">{bp.versi}</span>
                    )}
                  </div>
                  <h2 className="font-semibold text-base">{bp.judul}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{bp.deskripsi}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{bp.kategori}</span>
              </div>

              {bp.children.length > 0 && (
                <>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1.5">Sub-blueprint</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {bp.children.map((c) => (
                      <span key={c.slug} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                        {c.judul}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">{t}</span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400">
                  {bp.children.length} sub · {bp._count.bagian} bagian
                </span>
                <span className="text-xs text-zinc-600">Buka →</span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

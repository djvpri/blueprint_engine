import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BagianEditor from './BagianEditor'
import KonsepEditor from './KonsepEditor'
import TambahBagian from './TambahBagian'

export const dynamic = 'force-dynamic'

const STATUS_COLOR: Record<string, string> = {
  aktif: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  arsip: 'bg-zinc-100 text-zinc-500',
}

export default async function BlueprintDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const bp = await prisma.blueprint.findUnique({
    where: { slug },
    include: {
      bagian: { orderBy: { urut: 'asc' } },
      children: { select: { slug: true, judul: true, status: true }, orderBy: { urut: 'asc' } },
      parent: { select: { slug: true, judul: true } },
    },
  })

  if (!bp) notFound()

  const tags: string[] = (() => { try { const t = JSON.parse(bp.tag); return Array.isArray(t) ? t : [] } catch { return [] } })()
  // Build breadcrumb chain
  const breadcrumbs: { slug: string; judul: string }[] = []
  let cur: { slug: string; judul: string; parentId: string | null } | null = bp.parent
    ? { slug: bp.parent.slug, judul: bp.parent.judul, parentId: bp.parentId }
    : null
  while (cur) {
    breadcrumbs.unshift({ slug: cur.slug, judul: cur.judul })
    if (!cur.parentId) break
    const up = await prisma.blueprint.findUnique({
      where: { id: cur.parentId },
      select: { slug: true, judul: true, parentId: true },
    })
    cur = up ? { slug: up.slug, judul: up.judul, parentId: up.parentId } : null
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-zinc-400 mb-4 flex-wrap">
        <Link href="/" className="hover:text-zinc-900">Home</Link>
        {breadcrumbs.map((b) => (
          <span key={b.slug} className="flex items-center gap-1">
            <span>›</span>
            <Link href={`/bp/${b.slug}`} className="hover:text-zinc-900">{b.judul}</Link>
          </span>
        ))}
        <span>›</span>
        <span className="text-zinc-900 font-medium">{bp.judul}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[bp.status]}`}>
              {bp.status.toUpperCase()}
            </span>
            {bp.versi && <span className="text-[10px] text-zinc-400 font-mono">{bp.versi}</span>}
            {tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">{t}</span>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{bp.judul}</h1>
          {bp.deskripsi && <p className="text-sm text-zinc-500 mt-1">{bp.deskripsi}</p>}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/bp/${bp.slug}`}
            target="_blank"
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 font-mono"
          >
            JSON
          </a>
        </div>
      </div>

      {/* Konsep / Ide */}
      <KonsepEditor slug={bp.slug} initial={bp.konsep} />

      {/* Sections */}
      <div className="space-y-4 mb-6">
        {bp.bagian.map((b) => (
          <BagianEditor key={b.id} bagian={b} slug={bp.slug} />
        ))}
      </div>

      {/* Add section */}
      <TambahBagian slug={bp.slug} />

      {/* Children */}
      {bp.children.length > 0 && (
        <div className="mt-8 pt-6 border-t border-zinc-200">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Sub-blueprint</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bp.children.map((c) => (
              <Link
                key={c.slug}
                href={`/bp/${c.slug}`}
                className="flex items-center justify-between px-3 py-2 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300"
              >
                <span className="text-sm font-medium">{c.judul}</span>
                <span className="text-xs text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

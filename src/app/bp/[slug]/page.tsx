import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import BagianEditor from './BagianEditor'
import HapusBlueprint from './HapusBlueprint'
import KonsepEditor from './KonsepEditor'
import TambahBagian from './TambahBagian'
import TambahSubBlueprint from './TambahSubBlueprint'
import TreeSortable from './TreeSortable'

// Cache Components: instant=false allows blocking render for dynamic data
export const instant = false

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
  // Mark route dynamic — slug bisa di-create post-build via API, jangan cache prerender
  await headers()
  // Next.js 16 page route terima slug literal (encoded %20), decode untuk match DB
  const dbSlug = slug.includes('%') ? decodeURIComponent(slug) : slug
  const bp = await prisma.blueprint.findUnique({
    where: { slug: dbSlug },
    include: {
      bagian: { orderBy: { urut: 'asc' } },
      children: {
        select: { id: true, slug: true, judul: true, status: true, urut: true,
          children: { select: { id: true, slug: true, judul: true, status: true, urut: true,
            children: { select: { id: true, slug: true, judul: true, status: true, urut: true,
              children: { select: { id: true, slug: true, judul: true, status: true, urut: true } }
            } }
          } }
        },
        orderBy: { urut: 'asc' },
      },
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
          <HapusBlueprint slug={bp.slug} judul={bp.judul} />
        </div>
      </div>

      {/* Mockup link — khusus blueprint yang punya mockup variant */}
      {bp.slug === 'pajak kendaraan kalbar' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Mockup Variant</h3>
          <div className="flex flex-wrap gap-2">
            <a
              href="http://znoe26p91zqfvljnrenjb0ml.103.93.129.94.sslip.io/mockup/admin-v1-clean/index.html"
              target="_blank"
              className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
            >
              Admin v1 Clean →
            </a>
            <a
              href="http://znoe26p91zqfvljnrenjb0ml.103.93.129.94.sslip.io/mockup/001-clean-minimal/index.html"
              target="_blank"
              className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
            >
              001 Clean Minimal →
            </a>
          </div>
        </div>
      )}

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

      {/* Children — drag & drop sortable tree */}
      {bp.children.length > 0 && (
        <div className="mt-8 pt-6 border-t border-zinc-200">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Sub-blueprint</h3>
          <TreeSortable initialTree={bp.children} slug={bp.slug} />
        </div>
      )}
      <div className="mt-3">
        <TambahSubBlueprint parentId={bp.id} />
      </div>
    </div>
  )
}

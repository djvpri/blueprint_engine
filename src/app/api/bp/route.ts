import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bp — list semua root blueprint (card grid)
export async function GET() {
  const roots = await prisma.blueprint.findMany({
    where: { parentId: null },
    include: {
      children: { select: { slug: true, judul: true, status: true }, orderBy: { urut: 'asc' } },
      _count: { select: { bagian: true } },
    },
    orderBy: { urut: 'asc' },
  })

  return NextResponse.json(roots)
}

// POST /api/bp — buat blueprint baru
export async function POST(req: Request) {
  const { slug, judul, deskripsi, parentId, kategori, tag, status, versi } = await req.json()

  if (!slug?.trim()) return NextResponse.json({ error: 'Slug wajib diisi' }, { status: 400 })
  if (!judul?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })

  const exists = await prisma.blueprint.findUnique({ where: { slug } })
  if (exists) return NextResponse.json({ error: 'Slug sudah dipakai' }, { status: 409 })

  // urut = max+1 among siblings
  const siblings = await prisma.blueprint.findMany({
    where: { parentId: parentId ?? null },
    select: { urut: true },
  })
  const urut = siblings.length ? Math.max(...siblings.map(s => s.urut)) + 1 : 0

  const bp = await prisma.blueprint.create({
    data: {
      slug: slug.trim(),
      judul: judul.trim(),
      deskripsi: deskripsi?.trim() || null,
      parentId: parentId || null,
      kategori: kategori || 'web',
      tag: tag ? JSON.stringify(tag) : '[]',
      status: status || 'draft',
      versi: versi || null,
      urut,
    },
  })

  return NextResponse.json({ ok: true, id: bp.id, slug: bp.slug })
}

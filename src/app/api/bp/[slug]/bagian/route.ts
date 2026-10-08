import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bp/[slug]/bagian — list bagian
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const bp = await prisma.blueprint.findUnique({ where: { slug }, select: { id: true } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  const bagian = await prisma.bagian.findMany({
    where: { blueprintId: bp.id },
    orderBy: { urut: 'asc' },
  })
  return NextResponse.json(bagian)
}

// POST /api/bp/[slug]/bagian — tambah bagian
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { judul, konten } = await req.json()

  if (!judul?.trim()) return NextResponse.json({ error: 'Judul bagian wajib diisi' }, { status: 400 })

  const bp = await prisma.blueprint.findUnique({ where: { slug }, select: { id: true } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  const maxUrut = await prisma.bagian.findMany({
    where: { blueprintId: bp.id },
    select: { urut: true },
  })
  const urut = maxUrut.length ? Math.max(...maxUrut.map(b => b.urut)) + 1 : 0

  const bagian = await prisma.bagian.create({
    data: {
      blueprintId: bp.id,
      judul: judul.trim(),
      konten: konten || '',
      urut,
    },
  })

  return NextResponse.json({ ok: true, id: bagian.id })
}

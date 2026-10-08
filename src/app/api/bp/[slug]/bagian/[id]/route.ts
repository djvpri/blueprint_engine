import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/bp/[slug]/bagian/[id] — edit bagian (konten/judul)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const { judul, konten } = await req.json()

  const bp = await prisma.blueprint.findUnique({ where: { slug }, select: { id: true } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  const bagian = await prisma.bagian.findFirst({ where: { id, blueprintId: bp.id } })
  if (!bagian) return NextResponse.json({ error: 'Bagian tidak ditemukan' }, { status: 404 })

  const updated = await prisma.bagian.update({
    where: { id },
    data: {
      ...(judul !== undefined && { judul: judul.trim() }),
      ...(konten !== undefined && { konten }),
    },
  })

  return NextResponse.json({ ok: true, id: updated.id })
}

// DELETE /api/bp/[slug]/bagian/[id] — hapus bagian
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params

  const bp = await prisma.blueprint.findUnique({ where: { slug }, select: { id: true } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  await prisma.bagian.deleteMany({ where: { id, blueprintId: bp.id } })
  return NextResponse.json({ ok: true })
}

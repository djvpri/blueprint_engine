import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bp/[slug] — detail blueprint + bagian + children
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const bp = await prisma.blueprint.findUnique({
    where: { slug },
    include: {
      bagian: { orderBy: { urut: 'asc' } },
      children: { select: { slug: true, judul: true, status: true }, orderBy: { urut: 'asc' } },
      parent: { select: { slug: true, judul: true } },
    },
  })

  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  return NextResponse.json(bp)
}

// DELETE /api/bp/[slug] — hapus blueprint
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const bp = await prisma.blueprint.findUnique({ where: { slug } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  await prisma.blueprint.delete({ where: { id: bp.id } })
  return NextResponse.json({ ok: true })
}

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

// PATCH /api/bp/[slug] — update konsep (ide/konsep blueprint)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { konsep } = await req.json()

  const bp = await prisma.blueprint.findUnique({ where: { slug } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  await prisma.blueprint.update({ where: { id: bp.id }, data: { konsep } })
  return NextResponse.json({ ok: true })
}

// PUT /api/bp/[slug] — update full blueprint (judul, deskripsi, kategori, tag, status, versi, konsep)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()

  const bp = await prisma.blueprint.findUnique({ where: { slug } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.judul !== undefined) data.judul = body.judul
  if (body.deskripsi !== undefined) data.deskripsi = body.deskripsi?.trim() || null
  if (body.kategori !== undefined) data.kategori = body.kategori
  if (body.tag !== undefined) data.tag = typeof body.tag === 'string' ? body.tag : JSON.stringify(body.tag)
  if (body.status !== undefined) data.status = body.status
  if (body.versi !== undefined) data.versi = body.versi?.trim() || null
  if (body.konsep !== undefined) data.konsep = body.konsep

  const updated = await prisma.blueprint.update({ where: { id: bp.id }, data })
  return NextResponse.json(updated)
}

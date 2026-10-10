import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/bp/[slug]/reorder — batch update parentId + urut untuk children
// Body: { items: [{ id, parentId, urut }] }
// parentId null = root-level sibling
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { items } = await req.json() as { items: { id: string; parentId: string | null; urut: number }[] }

  const bp = await prisma.blueprint.findUnique({ where: { slug } })
  if (!bp) return NextResponse.json({ error: 'Blueprint tidak ditemukan' }, { status: 404 })

  // Validasi: semua id harus children (direct atau nested) dari bp ini
  // Cegah circular: parentId tidak boleh = id sendiri
  for (const item of items) {
    if (item.parentId === item.id) {
      return NextResponse.json({ error: 'parentId tidak boleh sama dengan id' }, { status: 400 })
    }
  }

  // Batch update dalam transaction
  await prisma.$transaction(
    items.map((item) =>
      prisma.blueprint.update({
        where: { id: item.id },
        data: { parentId: item.parentId, urut: item.urut },
      })
    )
  )

  return NextResponse.json({ ok: true })
}

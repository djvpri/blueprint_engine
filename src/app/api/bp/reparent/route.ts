import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/bp/reparent — pindah blueprint menjadi child dari blueprint lain
// Body: { id, parentId }
// parentId = id blueprint target (drop destination). null = root.
export async function PATCH(req: Request) {
  const { id, parentId } = await req.json() as { id: string; parentId: string | null }

  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

  // Cegah circular: parentId tidak boleh = id sendiri
  if (parentId === id) {
    return NextResponse.json({ error: 'Tidak bisa jadi child diri sendiri' }, { status: 400 })
  }

  // Cegah circular: parentId tidak boleh merupakan descendant dari id
  if (parentId) {
    const descendant = await prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE tree AS (
        SELECT id, "parentId" FROM "Blueprint" WHERE id = ${id}
        UNION ALL
        SELECT b.id, b."parentId" FROM "Blueprint" b JOIN tree t ON b."parentId" = t.id
      )
      SELECT id FROM tree WHERE id = ${parentId}
    `
    if (descendant.length > 0) {
      return NextResponse.json({ error: 'Circular dependency' }, { status: 400 })
    }
  }

  // Urut: taruh di akhir sibling list parent target
  const siblingCount = await prisma.blueprint.count({ where: { parentId } })
  await prisma.blueprint.update({
    where: { id },
    data: { parentId, urut: siblingCount },
  })

  return NextResponse.json({ ok: true })
}

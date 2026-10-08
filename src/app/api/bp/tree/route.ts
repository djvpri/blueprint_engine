import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type TreeNode = {
  id: string; slug: string; judul: string; deskripsi: string | null;
  parentId: string | null; urut: number; kategori: string;
  tag: string; status: string; versi: string | null;
  children: TreeNode[]
}

// GET /api/bp/tree — full tree JSON (for AI consumption)
export async function GET() {
  const all = await prisma.blueprint.findMany({
    select: {
      id: true, slug: true, judul: true, deskripsi: true,
      parentId: true, urut: true, kategori: true,
      tag: true, status: true, versi: true,
    },
    orderBy: [{ parentId: 'asc' }, { urut: 'asc' }],
  })

  function buildTree(parentId: string | null): TreeNode[] {
    return all
      .filter(b => b.parentId === parentId)
      .map(b => ({ ...b, children: buildTree(b.id) }))
  }

  return NextResponse.json(buildTree(null))
}

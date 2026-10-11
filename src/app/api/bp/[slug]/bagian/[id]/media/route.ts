import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']

type MediaItem = { id: string; tipe: 'gambar' | 'link'; url: string; label?: string }

async function getBagian(slug: string, id: string) {
  const bp = await prisma.blueprint.findUnique({ where: { slug }, select: { id: true } })
  if (!bp) return null
  return prisma.bagian.findFirst({ where: { id, blueprintId: bp.id } })
}

// POST — upload gambar (multipart) atau tambah link (json)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const bagian = await getBagian(slug, id)
  if (!bagian) return NextResponse.json({ error: 'Bagian tidak ditemukan' }, { status: 404 })

  const contentType = req.headers.get('content-type') || ''
  let item: MediaItem

  if (contentType.includes('multipart/form-data')) {
    // Image upload
    const form = await req.formData()
    const file = form.get('file') as File | null
    const label = (form.get('label') as string | null)?.trim() || ''

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: `Tipe file tidak didukung: ${file.type}` }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Ukuran file maksimal 5 MB' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads', 'bp', slug)
    await mkdir(dir, { recursive: true })
    const filepath = path.join(dir, filename)
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()))

    item = { id: crypto.randomBytes(8).toString('hex'), tipe: 'gambar', url: `/api/uploads/bp/${slug}/${filename}`, label }
  } else {
    // Link addition
    const { url, label } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL wajib diisi' }, { status: 400 })
    try { new URL(url.trim()) } catch { return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 }) }
    item = { id: crypto.randomBytes(8).toString('hex'), tipe: 'link', url: url.trim(), label: label?.trim() || '' }
  }

  const media: MediaItem[] = JSON.parse(bagian.media || '[]')
  media.push(item)
  await prisma.bagian.update({ where: { id }, data: { media: JSON.stringify(media) } })

  return NextResponse.json({ ok: true, media: item })
}

// PATCH — edit label media item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const bagian = await getBagian(slug, id)
  if (!bagian) return NextResponse.json({ error: 'Bagian tidak ditemukan' }, { status: 404 })

  const { mediaId, label } = await req.json()
  const media: MediaItem[] = JSON.parse(bagian.media || '[]')
  const idx = media.findIndex(m => m.id === mediaId)
  if (idx === -1) return NextResponse.json({ error: 'Media tidak ditemukan' }, { status: 404 })

  media[idx].label = label?.trim() || ''
  await prisma.bagian.update({ where: { id }, data: { media: JSON.stringify(media) } })
  return NextResponse.json({ ok: true })
}

// DELETE — hapus media item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const bagian = await getBagian(slug, id)
  if (!bagian) return NextResponse.json({ error: 'Bagian tidak ditemukan' }, { status: 404 })

  const url = new URL(req.url)
  const mediaId = url.searchParams.get('mediaId')
  if (!mediaId) return NextResponse.json({ error: 'mediaId wajib diisi' }, { status: 400 })

  const media: MediaItem[] = JSON.parse(bagian.media || '[]')
  const item = media.find(m => m.id === mediaId)
  if (!item) return NextResponse.json({ error: 'Media tidak ditemukan' }, { status: 404 })

  // Hapus file kalau gambar lokal
  if (item.tipe === 'gambar' && item.url.startsWith('/api/uploads/')) {
    try {
      const fs = await import('fs/promises')
      await fs.unlink(path.join(process.cwd(), 'public', 'uploads', item.url.replace('/api/uploads/', '')))
    } catch { /* file mungkin sudah tidak ada */ }
  }

  const filtered = media.filter(m => m.id !== mediaId)
  await prisma.bagian.update({ where: { id }, data: { media: JSON.stringify(filtered) } })
  return NextResponse.json({ ok: true })
}

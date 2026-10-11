import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

// GET /api/uploads/[...path] — serve uploaded files
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const safe = segments.map(s => s.replace(/\.\./g, '')).join('/')
  const ext = safe.split('.').pop()?.toLowerCase() || ''
  const mime = MIME[ext]
  if (!mime) return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })

  const filepath = path.join(process.cwd(), 'public', 'uploads', safe)
  try {
    const buf = await readFile(filepath)
    return new NextResponse(buf, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
  }
}

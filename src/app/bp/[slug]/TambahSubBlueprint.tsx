'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahSubBlueprint({ parentId }: { parentId: string }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [judul, setJudul] = useState('')
  const [slug, setSlug] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function autoSlug(text: string) {
    setJudul(text)
    if (!slug || slug === slugify(judul)) {
      setSlug(slugify(text))
    }
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function buat() {
    if (!judul.trim() || !slug.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: judul.trim(),
          slug: slug.trim(),
          deskripsi: deskripsi.trim(),
          parentId,
          status: 'draft',
        }),
      })
      if (res.ok) {
        router.push(`/bp/${slug.trim()}`)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Gagal buat sub-blueprint')
      }
    } catch {
      setError('Error jaringan')
    }
    setLoading(false)
  }

  if (show) {
    return (
      <div className="p-4 border border-dashed border-zinc-300 rounded-lg bg-zinc-50">
        <h4 className="text-sm font-semibold mb-3">Sub-blueprint baru</h4>
        <div className="space-y-2">
          <input
            autoFocus
            value={judul}
            onChange={(e) => autoSlug(e.target.value)}
            placeholder="Judul..."
            className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 bg-white"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="slug-url..."
            className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 bg-white font-mono"
          />
          <input
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi singkat (opsional)..."
            className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 bg-white"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={buat}
            disabled={loading || !judul.trim() || !slug.trim()}
            className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? 'Membuat...' : 'Buat'}
          </button>
          <button
            onClick={() => { setShow(false); setJudul(''); setSlug(''); setDeskripsi('') }}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-white"
          >
            Batal
          </button>
          {error && <span className="text-xs text-red-500 self-center">{error}</span>}
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShow(true)}
      className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-900 border border-dashed border-zinc-200 rounded-lg"
    >
      + Tambah Sub-blueprint
    </button>
  )
}

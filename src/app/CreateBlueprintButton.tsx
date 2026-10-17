'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateBlueprintButton() {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState('')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategori, setKategori] = useState('web')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/bp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          judul: judul.trim(),
          deskripsi: deskripsi.trim() || undefined,
          kategori,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Gagal membuat blueprint')
        setLoading(false)
        return
      }
      setOpen(false)
      setSlug('')
      setJudul('')
      setDeskripsi('')
      setKategori('web')
      router.push(`/bp/${data.slug}`)
      router.refresh()
    } catch {
      setErr('Network error')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-1.5 text-sm bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800"
      >
        + Baru
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h2 className="text-lg font-bold">Blueprint Baru</h2>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Slug *</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="contoh: zpos-web"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Judul *</label>
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="contoh: ZPos Web"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Deskripsi</label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Deskripsi singkat..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              >
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="backend">Backend</option>
                <option value="library">Library</option>
              </select>
            </div>

            {err && <p className="text-sm text-red-500">{err}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">
                Batal
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50">
                {loading ? 'Membuat...' : 'Buat'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

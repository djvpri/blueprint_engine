'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahBagian({ slug }: { slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [judul, setJudul] = useState('')

  async function tambah() {
    if (!judul.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bp/${slug}/bagian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul: judul.trim(), konten: '' }),
      })
      if (res.ok) {
        setJudul('')
        setShowInput(false)
        router.refresh()
      } else {
        setError('Gagal tambah bagian')
      }
    } catch {
      setError('Error jaringan')
    }
    setLoading(false)
  }

  if (showInput) {
    return (
      <div className="w-full p-3 border border-dashed border-zinc-300 rounded-lg bg-zinc-50">
        <input
          autoFocus
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') tambah(); if (e.key === 'Escape') { setShowInput(false); setJudul('') } }}
          placeholder="Judul bagian baru..."
          className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 bg-white"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={tambah}
            disabled={loading || !judul.trim()}
            className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? 'Menambah...' : 'Tambah'}
          </button>
          <button
            onClick={() => { setShowInput(false); setJudul('') }}
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
      onClick={() => setShowInput(true)}
      className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-900 border border-dashed border-zinc-200 rounded-lg"
    >
      + Tambah Bagian
    </button>
  )
}

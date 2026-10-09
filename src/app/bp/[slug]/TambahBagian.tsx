'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahBagian({ slug }: { slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function tambah() {
    const judul = prompt('Judul bagian baru:')
    if (!judul?.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bp/${slug}/bagian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul: judul.trim(), konten: '' }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        setError('Gagal tambah bagian')
      }
    } catch {
      setError('Error jaringan')
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={tambah}
        disabled={loading}
        className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-900 border border-dashed border-zinc-200 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Menambah...' : '+ Tambah Bagian'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  )
}

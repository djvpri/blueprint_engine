'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HapusBlueprint({ slug, judul }: { slug: string; judul: string }) {
  const router = useRouter()
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [saving, setSaving] = useState(false)

  async function hapus() {
    setSaving(true)
    try {
      const res = await fetch(`/api/bp/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  if (!konfirmasi) {
    return (
      <button
        onClick={() => setKonfirmasi(true)}
        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
      >
        Hapus Blueprint
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-red-600">Hapus &quot;{judul}&quot;?</span>
      <button
        onClick={hapus}
        disabled={saving}
        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
      >
        {saving ? 'Menghapus...' : 'Ya, hapus'}
      </button>
      <button
        onClick={() => setKonfirmasi(false)}
        className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50"
      >
        Batal
      </button>
    </div>
  )
}

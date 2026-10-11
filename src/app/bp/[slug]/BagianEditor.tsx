'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MediaItem {
  id: string
  tipe: 'gambar' | 'link'
  url: string
  label?: string
}

interface BagianData {
  id: string
  judul: string
  konten: string
  urut: number
  media?: string // JSON string
}

export default function BagianEditor({ bagian, slug }: { bagian: BagianData; slug: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [judul, setJudul] = useState(bagian.judul)
  const [konten, setKonten] = useState(bagian.konten)
  const [saving, setSaving] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)
  const [hapus, setHapus] = useState(false)

  // Media state
  const mediaItems: MediaItem[] = (() => { try { return JSON.parse(bagian.media || '[]') } catch { return [] } })()
  const [showMedia, setShowMedia] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [uploadLabel, setUploadLabel] = useState('')
  const [uploading, setUploading] = useState(false)

  async function konfirmasiHapus() {
    setSaving(true)
    try {
      const res = await fetch(`/api/bp/${slug}/bagian/${bagian.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        setPesan('Gagal hapus')
      }
    } catch {
      setPesan('Error jaringan')
    }
    setSaving(false)
  }

  async function simpan() {
    setSaving(true)
    setPesan(null)
    try {
      const res = await fetch(`/api/bp/${slug}/bagian/${bagian.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul, konten }),
      })
      if (res.ok) {
        setEditing(false)
        setPesan('Tersimpan')
        setTimeout(() => setPesan(null), 2000)
      } else {
        setPesan('Gagal simpan')
      }
    } catch {
      setPesan('Error jaringan')
    }
    setSaving(false)
  }

  async function uploadGambar(file: File) {
    setUploading(true)
    setPesan(null)
    try {
      const form = new FormData()
      form.append('file', file)
      if (uploadLabel.trim()) form.append('label', uploadLabel.trim())
      const res = await fetch(`/api/bp/${slug}/bagian/${bagian.id}/media`, { method: 'POST', body: form })
      if (res.ok) {
        setUploadLabel('')
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        setPesan(err.error || 'Gagal upload')
      }
    } catch {
      setPesan('Error jaringan')
    }
    setUploading(false)
  }

  async function tambahLink() {
    if (!linkUrl.trim()) return
    setUploading(true)
    setPesan(null)
    try {
      const res = await fetch(`/api/bp/${slug}/bagian/${bagian.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl.trim(), label: linkLabel.trim() }),
      })
      if (res.ok) {
        setLinkUrl('')
        setLinkLabel('')
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        setPesan(err.error || 'Gagal tambah link')
      }
    } catch {
      setPesan('Error jaringan')
    }
    setUploading(false)
  }

  async function hapusMedia(mediaId: string) {
    try {
      const res = await fetch(`/api/bp/${slug}/bagian/${bagian.id}/media?mediaId=${mediaId}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } catch {
      setPesan('Error jaringan')
    }
  }

  if (editing) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="w-full text-sm font-semibold bg-transparent border-b border-zinc-200 pb-1 mb-2 outline-none focus:border-zinc-400"
        />
        <textarea
          value={konten}
          onChange={(e) => setKonten(e.target.value)}
          rows={Math.max(4, konten.split('\n').length + 1)}
          className="w-full text-sm font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-3 outline-none focus:border-zinc-400 resize-y"
          placeholder="Markdown..."
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={simpan}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={() => { setEditing(false); setJudul(bagian.judul); setKonten(bagian.konten) }}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50"
          >
            Batal
          </button>
          {pesan && <span className="text-xs text-zinc-500 self-center">{pesan}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 group">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">{judul}</h2>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-0.5 rounded hover:bg-zinc-100"
          >
            Edit
          </button>
          <button
            onClick={() => setHapus(true)}
            className="text-xs text-zinc-500 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50"
          >
            Hapus
          </button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none text-zinc-600">
        <MarkdownPreview md={konten} />
      </div>

      {/* Media gallery */}
      {mediaItems.length > 0 && (
        <div className="mt-3 space-y-2">
          {mediaItems.map((m) => (
            <div key={m.id} className="relative group/media">
              {m.tipe === 'gambar' ? (
                <div className="relative">
                  <img src={m.url} alt={m.label || ''} className="rounded-lg border border-zinc-200 max-w-full" />
                  {m.label && <p className="text-xs text-zinc-500 mt-1">{m.label}</p>}
                </div>
              ) : (
                <a href={m.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-blue-600 hover:bg-zinc-100">
                  <span>🔗</span>
                  <span>{m.label || m.url}</span>
                </a>
              )}
              <button
                onClick={() => hapusMedia(m.id)}
                className="absolute top-1 right-1 opacity-0 group-hover/media:opacity-100 transition bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                title="Hapus media"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Media controls */}
      <div className="mt-2">
        {!showMedia ? (
          <button
            onClick={() => setShowMedia(true)}
            className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-0.5 rounded hover:bg-zinc-100"
          >
            + Tambah gambar/link
          </button>
        ) : (
          <div className="space-y-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            {/* Upload gambar */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGambar(f) }}
                disabled={uploading}
                className="text-xs"
              />
              <input
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                placeholder="Label gambar (opsional)"
                className="flex-1 text-xs border border-zinc-200 rounded px-2 py-1 bg-white"
              />
            </div>
            {/* Divider */}
            <div className="border-t border-zinc-200" />
            {/* Input link */}
            <div className="flex items-center gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 text-xs border border-zinc-200 rounded px-2 py-1 bg-white"
              />
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Label link"
                className="w-32 text-xs border border-zinc-200 rounded px-2 py-1 bg-white"
              />
              <button
                onClick={tambahLink}
                disabled={uploading || !linkUrl.trim()}
                className="px-2 py-1 text-xs bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50"
              >Tambah</button>
            </div>
            <button
              onClick={() => setShowMedia(false)}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >Tutup</button>
          </div>
        )}
      </div>

      {pesan && <p className="text-xs text-emerald-600 mt-2">{pesan}</p>}

      {hapus && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-700">Hapus bagian ini?</span>
          <button
            onClick={konfirmasiHapus}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Menghapus...' : 'Hapus'}
          </button>
          <button
            onClick={() => setHapus(false)}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-white"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  )
}

// Minimal markdown renderer — no dependency
function MarkdownPreview({ md }: { md: string }) {
  const lines = md.split('\n')
  const out: React.ReactNode[] = []
  let listItems: string[] = []

  function flushList(key: number) {
    if (listItems.length > 0) {
      out.push(
        <ul key={`ul-${key}`} className="space-y-0.5 my-2 pl-4">
          {listItems.map((li, i) => (
            <li key={i} className="text-sm">{renderInline(li)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
    } else {
      flushList(i)
      if (line.startsWith('```')) {
        // code block — find closing
        const codeLines: string[] = []
        let j = i + 1
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeLines.push(lines[j])
          j++
        }
        out.push(
          <pre key={`pre-${i}`} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-zinc-700">
            {codeLines.join('\n')}
          </pre>
        )
        // skip consumed lines — but we can't modify index in forEach
        // ponytail: this works because closing ``` line will be empty after flush
        return
      }
      if (line.startsWith('### ')) {
        out.push(<h3 key={i} className="text-sm font-semibold mt-2">{line.slice(4)}</h3>)
      } else if (line.startsWith('## ')) {
        out.push(<h2 key={i} className="text-base font-semibold mt-2">{line.slice(3)}</h2>)
      } else if (line.startsWith('# ')) {
        out.push(<h1 key={i} className="text-lg font-bold mt-2">{line.slice(2)}</h1>)
      } else if (line.trim()) {
        out.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>)
      }
    }
  })
  flushList(lines.length)

  return <>{out}</>
}

function renderInline(text: string): React.ReactNode {
  // `code` spans
  const parts = text.split(/(`[^`]+`)/)
  return parts.map((p, i) => {
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="bg-zinc-100 px-1 rounded text-xs font-mono text-zinc-700">{p.slice(1, -1)}</code>
    }
    // bold **text**
    const boldParts = p.split(/(\*\*[^*]+\*\*)/)
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>
      }
      return <span key={`${i}-${j}`}>{bp}</span>
    })
  })
}

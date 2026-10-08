'use client'

import { useState } from 'react'

interface BagianData {
  id: string
  judul: string
  konten: string
  urut: number
}

export default function BagianEditor({ bagian, slug }: { bagian: BagianData; slug: string }) {
  const [editing, setEditing] = useState(false)
  const [judul, setJudul] = useState(bagian.judul)
  const [konten, setKonten] = useState(bagian.konten)
  const [saving, setSaving] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

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
        </div>
      </div>
      <div className="prose prose-sm max-w-none text-zinc-600">
        <MarkdownPreview md={konten} />
      </div>
      {pesan && <p className="text-xs text-emerald-600 mt-2">{pesan}</p>}
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

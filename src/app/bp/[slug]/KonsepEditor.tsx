'use client'

import { useState } from 'react'

export default function KonsepEditor({ slug, initial }: { slug: string; initial: string }) {
  const [editing, setEditing] = useState(false)
  const [konsep, setKonsep] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

  async function simpan() {
    setSaving(true)
    setPesan(null)
    try {
      const res = await fetch(`/api/bp/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ konsep }),
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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">💡 Ide & Konsep</h2>
          <span className="text-[10px] text-amber-500">Markdown</span>
        </div>
        <textarea
          value={konsep}
          onChange={(e) => setKonsep(e.target.value)}
          rows={Math.max(4, konsep.split('\n').length + 1)}
          className="w-full text-sm font-mono bg-white border border-amber-200 rounded-lg p-3 outline-none focus:border-amber-400 resize-y"
          placeholder="Tulis ide, konsep, catatan desain..."
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={simpan}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={() => { setEditing(false); setKonsep(initial) }}
            className="px-3 py-1.5 text-sm border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-100"
          >
            Batal
          </button>
          {pesan && <span className="text-xs text-amber-600 self-center">{pesan}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 group">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">💡 Ide & Konsep</h2>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-amber-600 hover:text-amber-900 px-2 py-0.5 rounded hover:bg-amber-100"
          >
            Edit
          </button>
        </div>
      </div>
      {konsep.trim() ? (
        <div className="prose prose-sm max-w-none text-amber-900">
          <MarkdownPreview md={konsep} />
        </div>
      ) : (
        <p className="text-xs text-amber-400 italic">Belum ada ide. Klik Edit untuk menambahkan.</p>
      )}
      {pesan && <p className="text-xs text-emerald-600 mt-2">{pesan}</p>}
    </div>
  )
}

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
        const codeLines: string[] = []
        let j = i + 1
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeLines.push(lines[j])
          j++
        }
        out.push(
          <pre key={`pre-${i}`} className="bg-amber-100 border border-amber-200 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-amber-800">
            {codeLines.join('\n')}
          </pre>
        )
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
  const parts = text.split(/(`[^`]+`)/)
  return parts.map((p, i) => {
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="bg-amber-100 px-1 rounded text-xs font-mono text-amber-800">{p.slice(1, -1)}</code>
    }
    const boldParts = p.split(/(\*\*[^*]+\*\*)/)
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>
      }
      return <span key={`${i}-${j}`}>{bp}</span>
    })
  })
}

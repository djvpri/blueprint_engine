'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type CardData = {
  id: string
  slug: string
  judul: string
  deskripsi: string | null
  status: string
  kategori: string
  versi: string | null
  tag: string
  children: { slug: string; judul: string }[]
  _count: { bagian: number }
}

const STATUS_COLOR: Record<string, string> = {
  aktif: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  arsip: 'bg-zinc-100 text-zinc-500',
}

export default function CardGridSortable({ initialCards }: { initialCards: CardData[] }) {
  const router = useRouter()
  const [cards] = useState(initialCards)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown saat klik luar — pakai click, bukan mousedown
  // mousedown trigger terlalu cepat → tutup dropdown sebelum klik item sampai
  useEffect(() => {
    if (!menuId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Jangan tutup kalau klik di dalam menu atau tombol menu
      if (target.closest('[data-menu-container]')) return
      setMenuId(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuId])

  const reparent = useCallback(async (draggedId: string, targetId: string | null) => {
    console.log('[REPARENT] start', { draggedId, targetId })
    if (draggedId === targetId) {
      console.log('[REPARENT] skip — same id')
      return
    }
    setSaving(true)
    try {
      console.log('[REPARENT] fetching...', { url: '/api/bp/reparent', body: { id: draggedId, parentId: targetId } })
      const res = await fetch('/api/bp/reparent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggedId, parentId: targetId }),
      })
      console.log('[REPARENT] response', { status: res.status, ok: res.ok })
      const data = await res.json().catch(() => null)
      console.log('[REPARENT] body', data)
      if (res.ok) {
        console.log('[REPARENT] router.refresh()')
        router.refresh()
      } else {
        console.error('[REPARENT] FAILED', { status: res.status, data })
      }
    } catch (err) {
      console.error('[REPARENT] ERROR', err)
    } finally {
      setSaving(false)
      console.log('[REPARENT] done')
    }
  }, [router])

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDragId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverId(id)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    setDragId(null)
    setOverId(null)
    if (!draggedId || draggedId === targetId) return
    reparent(draggedId, targetId)
  }, [reparent])

  return (
    <div>
      {saving && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-50">
          Menyimpan...
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((bp) => {
          const tags: string[] = (() => { try { const t = JSON.parse(bp.tag); return Array.isArray(t) ? t : [] } catch { return [] } })()
          const isDragged = dragId === bp.id
          const isOver = overId === bp.id && dragId !== bp.id
          return (
            <div
              key={bp.id}
              onDragOver={(e) => handleDragOver(e, bp.id)}
              onDrop={(e) => handleDrop(e, bp.id)}
              className={`rounded-xl transition-all ${isOver ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]' : ''} ${isDragged ? 'opacity-30' : ''}`}
            >
              <div
                className={`relative bg-white border rounded-xl overflow-hidden transition-all ${
                  isDragged ? 'border-blue-400' : 'border-zinc-200 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* HEADER — draggable area besar */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, bp.id)}
                  onDragEnd={() => { setDragId(null); setOverId(null) }}
                  className="px-4 pt-4 pb-2 cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[bp.status] || STATUS_COLOR.draft}`}>
                      {bp.status.toUpperCase()}
                    </span>
                    {bp.versi && <span className="text-[10px] text-zinc-400 font-mono">{bp.versi}</span>}
                  </div>
                  <h2 className="font-semibold text-base">{bp.judul}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{bp.deskripsi}</p>
                </div>

                {/* Tombol ⋮ — menu pindah */}
                <div className="absolute top-3 right-3" data-menu-container ref={menuId === bp.id ? menuRef : undefined}>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.log('[MENU] klik ⋮', { bpId: bp.id, judul: bp.judul, menuId }); setMenuId(menuId === bp.id ? null : bp.id) }}
                    className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-100"
                    aria-label="Menu"
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                    </svg>
                  </button>
                  {menuId === bp.id && (
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] text-zinc-400 uppercase tracking-wide border-b border-zinc-100">
                        Pindah ke...
                      </div>
                      <button
                        onClick={() => { console.log('[MENU] pilih Root', { draggedId: bp.id }); reparent(bp.id, null); setMenuId(null) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
                      >
                        🏠 Root (top level)
                      </button>
                      {cards.filter(c => c.id !== bp.id).map(c => (
                        <button
                          key={c.id}
                          onClick={() => { console.log('[MENU] pilih target', { draggedId: bp.id, targetId: c.id, targetJudul: c.judul }); reparent(bp.id, c.id); setMenuId(null) }}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 truncate"
                        >
                          {c.judul}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* BODY — Link, tidak draggable */}
                <Link href={`/bp/${bp.slug}`} className="block px-4 pb-4" draggable={false}>
                  {bp.children.length > 0 && (
                    <>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1.5">Sub-blueprint</div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {bp.children.map((c) => (
                          <span key={c.slug} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">{c.judul}</span>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">{t}</span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                    <span className="text-[10px] text-zinc-400">{bp.children.length} sub · {bp._count.bagian} bagian</span>
                    <span className="text-xs text-zinc-600">Buka →</span>
                  </div>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

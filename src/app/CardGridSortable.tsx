'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'

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

function CardInner({ bp }: { bp: CardData }) {
  const tags: string[] = (() => { try { const t = JSON.parse(bp.tag); return Array.isArray(t) ? t : [] } catch { return [] } })()
  return (
    <>
      <div className="flex items-start justify-between mb-2 pr-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[bp.status] || STATUS_COLOR.draft}`}>
              {bp.status.toUpperCase()}
            </span>
            {bp.versi && <span className="text-[10px] text-zinc-400 font-mono">{bp.versi}</span>}
          </div>
          <h2 className="font-semibold text-base">{bp.judul}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{bp.deskripsi}</p>
        </div>
      </div>

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
    </>
  )
}

function DraggableCard({ bp }: { bp: CardData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: bp.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`relative bg-white border rounded-xl p-4 transition-all ${
        isDragging ? 'opacity-30 border-blue-400' : 'border-zinc-200 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Drag handle — div not button, touch-none for mobile */}
      <div
        {...listeners}
        className="absolute top-3 right-3 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 touch-none p-1 z-10"
        aria-label="Drag to move"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zM12 2a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2z"/>
        </svg>
      </div>

      <Link href={`/bp/${bp.slug}`} className="block">
        <CardInner bp={bp} />
      </Link>
    </div>
  )
}

function StaticCard({ bp }: { bp: CardData }) {
  return (
    <div className="relative bg-white border border-blue-400 rounded-xl p-4 shadow-xl">
      <CardInner bp={bp} />
    </div>
  )
}

function DroppableCard({ bp, children, isOver }: { bp: CardData; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: bp.id })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all ${isOver ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]' : ''}`}
    >
      {children}
    </div>
  )
}

export default function CardGridSortable({ initialCards }: { initialCards: CardData[] }) {
  const router = useRouter()
  const [cards] = useState(initialCards)
  const [overId, setOverId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor)
  )

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }, [])

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    setOverId(null)
    if (!over || active.id === over.id) return

    const draggedId = String(active.id)
    const targetId = String(over.id)

    setSaving(true)
    try {
      const res = await fetch('/api/bp/reparent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggedId, parentId: targetId }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }, [router])

  const activeCard = activeId ? cards.find(c => c.id === activeId) : null

  return (
    <div>
      {saving && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-50">
          Menyimpan...
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={({ over }) => setOverId(over ? String(over.id) : null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((bp) => (
            <DroppableCard key={bp.id} bp={bp} isOver={overId === bp.id}>
              <DraggableCard bp={bp} />
            </DroppableCard>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? <StaticCard bp={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

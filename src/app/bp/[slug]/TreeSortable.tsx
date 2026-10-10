'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type TreeNode = {
  id: string
  slug: string
  judul: string
  status: string
  urut: number
  children?: TreeNode[]
}

// Flatten tree ke array dengan depth info
function flatten(nodes: TreeNode[], depth = 0, parentId: string | null = null): FlatNode[] {
  return nodes.flatMap((n) => [
    { ...n, depth, parentId },
    ...(n.children ? flatten(n.children, depth + 1, n.id) : []),
  ])
}

type FlatNode = TreeNode & { depth: number; parentId: string | null }

const MAX_DEPTH = 4

function SortableRow({ node, onDropInto }: { node: FlatNode; onDropInto: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: `${node.depth * 24 + 12}px`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-2 px-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zM12 2a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 110 2 1 1 0 010-2z"/>
        </svg>
      </button>
      <Link href={`/bp/${node.slug}`} className="flex-1 text-sm font-medium hover:text-blue-600">
        {node.judul}
      </Link>
      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-400 uppercase">{node.status}</span>
      <button
        onClick={() => onDropInto(node.id)}
        className="text-[9px] text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition"
        title="Unindent (move to parent level)"
      >
        ←
      </button>
    </div>
  )
}

export default function TreeSortable({ initialTree, slug }: { initialTree: TreeNode[]; slug: string }) {
  const router = useRouter()
  const [items, setItems] = useState(() => flatten(initialTree))
  const [saving, setSaving] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const persist = useCallback(async (newItems: FlatNode[]) => {
    setSaving(true)
    try {
      await fetch(`/api/bp/${slug}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: newItems.map((n, i) => ({ id: n.id, parentId: n.parentId, urut: i })),
        }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }, [slug, router])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((n) => n.id === active.id)
      const newIndex = prev.findIndex((n) => n.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev

      const dragged = prev[oldIndex]
      const target = prev[newIndex]

      // Reorder dalam sibling group
      const reordered = arrayMove(prev, oldIndex, newIndex)

      // Adjust depth: match target's depth (drop into same level)
      // atau indent lebih dalam jika dekat dengan child
      const newDepth = target.depth
      const depthDiff = newDepth - dragged.depth
      if (Math.abs(depthDiff) > 1) return prev // max 1 level jump per drag

      // Update depth + parentId for dragged node
      reordered[newIndex] = { ...dragged, depth: newDepth, parentId: target.parentId }

      persist(reordered)
      return reordered
    })
  }, [persist])

  // Move node into previous sibling (indent right)
  const handleDropInto = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((n) => n.id === id)
      if (idx === -1) return prev
      const node = prev[idx]
      // Find previous sibling at same depth+parentId — become its child
      let parent: FlatNode | null = null
      for (let i = idx - 1; i >= 0; i--) {
        if (prev[i].depth === node.depth && prev[i].parentId === node.parentId) {
          parent = prev[i]
          break
        }
      }
      if (!parent) return prev
      if (node.depth + 1 >= MAX_DEPTH) return prev

      const updated = [...prev]
      updated[idx] = { ...node, depth: parent.depth + 1, parentId: parent.id }
      persist(updated)
      return updated
    })
  }, [persist])

  return (
    <div>
      {saving && <div className="text-[10px] text-zinc-400 mb-2">Menyimpan...</div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {items.map((node) => (
              <SortableRow key={node.id} node={node} onDropInto={handleDropInto} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

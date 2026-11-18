import { X } from 'lucide-react'
import { ITEMS, trackColor } from '../data'
import type { Item, Person } from '../types'

export function PersonMarker({
  p,
  dragging,
  onPointerDown,
}: {
  p: Person
  dragging?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
}) {
  const color = trackColor(p.trackId)
  const scale = 0.55 + p.y * 0.65 // further away = smaller
  return (
    <div
      className={`walker absolute z-20 ${dragging ? 'dragging' : ''}`}
      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
    >
      <div
        className="flex cursor-grab flex-col items-center active:cursor-grabbing"
        style={{ transform: `translate(-50%, -100%) scale(${scale})`, transformOrigin: 'bottom center' }}
        onPointerDown={onPointerDown}
        title="Drag to move"
      >
        <div
          className="anim-pop mb-1 rounded-full px-2.5 py-0.5 text-sm font-black text-white shadow-lg ring-2 ring-white"
          style={{ background: color }}
        >
          #{p.trackId}
        </div>
        <div className="anim-bob flex flex-col items-center">
          <div className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: color, opacity: 0.9 }} />
          <div className="-mt-0.5 h-10 w-9 rounded-t-[18px] rounded-b-md ring-2 ring-white" style={{ background: color, opacity: 0.8 }} />
        </div>
        <div className="mt-0.5 h-2 w-10 rounded-[50%] bg-black/30 blur-[1px]" />
      </div>
    </div>
  )
}

export function ItemSticker({
  item,
  highlight,
  dimmed,
  onRemove,
  small,
}: {
  item: Item
  highlight?: boolean
  dimmed?: boolean
  onRemove?: () => void
  small?: boolean
}) {
  const meta = ITEMS[item.type]
  const flagged = item.flagged
  const size = small ? 'h-6 w-6 text-sm' : 'h-10 w-10 text-xl sm:h-11 sm:w-11 sm:text-2xl'
  return (
    <div
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, opacity: dimmed ? 0.45 : 1 }}
    >
      <div
        className={`anim-pop flex items-center justify-center rounded-full bg-white shadow-lg ${size} ${
          flagged ? 'ring-[3px] ring-rose' : 'ring-[3px] ring-mint'
        } ${flagged && (highlight ?? true) ? 'anim-flag' : ''}`}
        title={`${meta.label}${flagged ? ' (keep-clear zone)' : ' (OK spot)'}`}
      >
        {meta.emoji}
      </div>
      {!small && flagged && item.issueId && (
        <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose px-1.5 py-px text-[10px] font-black text-white shadow">
          nudged #{item.ownerTrackId}
        </div>
      )}
      {!small && !flagged && (
        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mint text-[10px] font-black text-white">
          ✓
        </div>
      )}
      {onRemove && !item.issueId && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -left-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow group-hover:flex"
          title="Remove"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

export function CamHud() {
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> CAM 1 · LIVE · ANONYMOUS TRACKING
      </div>
      {['left-2 top-2 border-l-2 border-t-2', 'right-2 top-2 border-r-2 border-t-2', 'left-2 bottom-2 border-l-2 border-b-2', 'right-2 bottom-2 border-r-2 border-b-2'].map(
        (c) => (
          <div key={c} className={`pointer-events-none absolute z-30 h-6 w-6 rounded-sm border-white/80 ${c}`} />
        ),
      )}
    </>
  )
}

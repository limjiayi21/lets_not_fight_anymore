import { useEffect, useRef, useState } from 'react'
import { Check, MousePointer2, Pentagon, RotateCcw, Square, Trash2, Users } from 'lucide-react'
import { KitchenCanvas, relPoint } from './KitchenCanvas'
import { ZONE_KINDS, kindLabel } from '../data'
import { useStore } from '../store'
import { toPoints } from '../geometry'
import type { Pt, ZoneKind } from '../types'

type Tool = 'select' | 'rect' | 'poly'

export function LayoutEditor() {
  const { state, actions } = useStore()
  const { zones } = state
  const ref = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [selected, setSelected] = useState<string | null>(null)
  const [rect, setRect] = useState<{ a: Pt; b: Pt } | null>(null)
  const [poly, setPoly] = useState<Pt[]>([])
  const [hover, setHover] = useState<Pt | null>(null)
  const [dragV, setDragV] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  const sel = zones.find((z) => z.id === selected) ?? null

  const createZone = (points: Pt[]) => {
    const id = 'z-' + Math.random().toString(36).slice(2, 8)
    actions.dispatch({ type: 'addZone', zone: { id, name: 'New zone', kind: 'clear', points } })
    setSelected(id)
    setTool('select')
  }

  const finishPoly = () => {
    if (poly.length >= 3) createZone(poly)
    setPoly([])
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Escape') {
        setPoly([])
        setRect(null)
      }
      if (e.key === 'Enter' && tool === 'poly') finishPoly()
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        actions.dispatch({ type: 'deleteZone', id: selected })
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = relPoint(ref.current, e)
    if (tool === 'rect') {
      ref.current?.setPointerCapture(e.pointerId)
      setRect({ a: p, b: p })
    } else if (tool === 'poly') {
      if (poly.length >= 3 && Math.hypot(poly[0][0] - p[0], poly[0][1] - p[1]) < 0.02) finishPoly()
      else setPoly([...poly, p])
    } else {
      setSelected(null)
    }
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = relPoint(ref.current, e)
    setHover(p)
    if (rect) setRect({ ...rect, b: p })
    if (dragV !== null && sel) {
      const pts = sel.points.map((q, i) => (i === dragV ? ([Math.min(1, Math.max(0, p[0])), Math.min(1, Math.max(0, p[1]))] as Pt) : q))
      actions.dispatch({ type: 'updateZone', zone: { ...sel, points: pts, label: undefined } })
    }
  }
  const onUp = () => {
    if (rect) {
      const { a, b } = rect
      if (Math.abs(a[0] - b[0]) > 0.01 && Math.abs(a[1] - b[1]) > 0.01) {
        const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0])
        const y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1])
        createZone([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])
      }
      setRect(null)
    }
    setDragV(null)
  }

  const draft = (
    <>
      {rect && (
        <polygon
          points={toPoints([rect.a, [rect.b[0], rect.a[1]], rect.b, [rect.a[0], rect.b[1]]])}
          fill="rgba(167,139,250,0.25)"
          stroke="#7c5cf0"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {poly.length > 0 && (
        <polyline
          points={toPoints(hover ? [...poly, hover] : poly)}
          fill="rgba(167,139,250,0.2)"
          stroke="#7c5cf0"
          strokeWidth={2}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </>
  )

  const tools: { id: Tool; icon: typeof Square; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'poly', icon: Pentagon, label: 'Polygon' },
  ]

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">House Rules</h2>
            <p className="text-sm text-muted">Draw the spots where stuff is allowed. Everything else stays clear.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-mint-soft px-3 py-1.5 text-sm font-bold text-mint">
            <div className="flex -space-x-2">
              {['#ff8a65', '#5eb4ff', '#a78bfa', '#f2a516'].map((c, i) => (
                <span key={i} className="h-6 w-6 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            <Users size={16} /> Agreed by 4 roommates
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTool(t.id)
                setPoly([])
              }}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
                tool === t.id ? 'bg-ink text-white shadow' : 'bg-ink/5 text-ink hover:bg-ink/10'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
          <span className="ml-1 text-xs text-muted">
            {tool === 'rect' && 'Drag on the photo to draw a box.'}
            {tool === 'poly' && 'Click to add corners, click the first corner or press Enter to finish.'}
            {tool === 'select' && 'Click a zone to edit it. Drag its corners to reshape.'}
          </span>
        </div>

        <KitchenCanvas
          ref={ref}
          zones={zones}
          selectedId={selected}
          onZoneClick={tool === 'select' ? setSelected : undefined}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onDoubleClick={() => tool === 'poly' && finishPoly()}
          cursor={tool === 'select' ? 'default' : 'crosshair'}
          svgExtra={draft}
          className="shadow-inner"
        >
          {sel &&
            tool === 'select' &&
            sel.points.map((p, i) => (
              <div
                key={i}
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white bg-ink shadow"
                style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  ref.current?.setPointerCapture(e.pointerId)
                  setDragV(i)
                }}
              />
            ))}
          {poly.map((p, i) => (
            <div
              key={i}
              className={`pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${i === 0 ? 'bg-lilac' : 'bg-ink'}`}
              style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
            />
          ))}
        </KitchenCanvas>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded border-2 border-mint bg-mint/25" /> OK to leave things here
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded border-2 border-dashed border-rose/70 bg-rose/5" /> Keep clear
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card p-5">
          {sel ? (
            <div className="anim-fade-up space-y-4" key={sel.id}>
              <div className="text-xs font-extrabold uppercase tracking-wider text-muted">Edit zone</div>
              <input
                value={sel.name}
                onChange={(e) => actions.dispatch({ type: 'updateZone', zone: { ...sel, name: e.target.value } })}
                className="w-full rounded-xl border-2 border-ink/10 px-3 py-2 font-bold outline-none focus:border-lilac"
              />
              <div className="grid grid-cols-1 gap-2">
                {ZONE_KINDS.map((k) => (
                  <button
                    key={k.kind}
                    onClick={() => actions.dispatch({ type: 'updateZone', zone: { ...sel, kind: k.kind as ZoneKind } })}
                    className={`rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                      sel.kind === k.kind
                        ? k.kind === 'clear'
                          ? 'bg-rose-soft text-rose ring-2 ring-rose/40'
                          : 'bg-mint-soft text-mint ring-2 ring-mint/40'
                        : 'bg-ink/5 hover:bg-ink/10'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  actions.dispatch({ type: 'deleteZone', id: sel.id })
                  setSelected(null)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-soft py-2 text-sm font-bold text-rose hover:bg-rose/20"
              >
                <Trash2 size={16} /> Delete zone
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-3 text-xs font-extrabold uppercase tracking-wider text-muted">Zones ({zones.length})</div>
              <ul className="space-y-1.5">
                {zones.map((z) => (
                  <li key={z.id}>
                    <button
                      onClick={() => {
                        setTool('select')
                        setSelected(z.id)
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-ink/5"
                    >
                      <span>{z.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${z.kind === 'clear' ? 'bg-rose-soft text-rose' : 'bg-mint-soft text-mint'}`}
                      >
                        {kindLabel(z.kind)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card space-y-2 p-5">
          <button
            onClick={() => {
              setSaved(true)
              setTimeout(() => setSaved(false), 1800)
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-extrabold text-white shadow-lg transition hover:scale-[1.02]"
          >
            {saved ? (
              <>
                <Check size={18} /> Saved. Everyone's on the same page
              </>
            ) : (
              'Save house rules'
            )}
          </button>
          <button
            onClick={() => {
              actions.dispatch({ type: 'resetZones' })
              setSelected(null)
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-muted hover:bg-ink/5"
          >
            <RotateCcw size={14} /> Reset to default layout
          </button>
          <p className="pt-1 text-center text-xs text-muted">Rules are saved on this device and apply to every scan.</p>
        </div>
      </div>
    </div>
  )
}

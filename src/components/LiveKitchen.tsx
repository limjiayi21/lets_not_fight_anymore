import { useEffect, useRef, useState } from 'react'
import { CreditCard, DoorOpen, Lock, LockOpen, LogOut, RotateCcw } from 'lucide-react'
import { KitchenCanvas, relPoint } from './KitchenCanvas'
import { CamHud, ItemSticker, PersonMarker } from './Markers'
import { Phone } from './Phone'
import { ITEMS, ITEM_TYPES, STUDENTS, studentById, trackColor } from '../data'
import { useStore } from '../store'
import type { ItemType } from '../types'

export function LiveKitchen({ tool, setTool }: { tool: ItemType | null; setTool: (t: ItemType | null) => void }) {
  const { state, actions } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tool) return
    if (state.people.length === 0) {
      setToast("Kitchen's locked. Tap a student card first 🔒")
      return
    }
    const [x, y] = relPoint(ref.current, e)
    actions.drop(tool, x, y)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag === null) return
    const [x, y] = relPoint(ref.current, e)
    actions.dispatch({ type: 'move', trackId: drag, x, y })
  }

  const door = state.lastDoor
  const doorStudent = door ? studentById(door.studentId) : null
  const anyInside = state.people.length > 0

  return (
    <div className="grid gap-5 xl:grid-cols-[290px_1fr_300px] lg:grid-cols-[290px_1fr]">
      {/* ---------- left: card reader + tools ---------- */}
      <div className="flex flex-col gap-4">
        <div key={door?.at ?? 'idle'} className={`card p-4 ${door ? 'anim-door' : ''}`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${anyInside ? 'bg-mint-soft text-mint' : 'bg-ink/5 text-ink/60'}`}
            >
              {anyInside ? <LockOpen className="anim-shackle" /> : <Lock />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-wider text-muted">Kitchen door</div>
              <div className="font-black leading-snug">
                {door && doorStudent
                  ? door.dir === 'in'
                    ? `Welcome, ${doorStudent.name} → you're #${door.trackId}`
                    : `Bye #${door.trackId}! ${anyInside ? 'Surfaces checked.' : 'Door locked behind you.'}`
                  : 'Locked. Tap a card to enter'}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted">
            <CreditCard size={14} /> Tap student card
          </div>
          <div className="space-y-2">
            {STUDENTS.map((s) => {
              const p = state.people.find((pp) => pp.studentId === s.id)
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-white" style={{ background: s.color }}>
                    {s.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold leading-tight">{s.name}</div>
                    <div className="text-[11px] font-bold text-muted">
                      {p ? (
                        <span>
                          inside as{' '}
                          <span className="rounded-full px-1.5 text-white" style={{ background: trackColor(p.trackId) }}>
                            #{p.trackId}
                          </span>
                        </span>
                      ) : (
                        s.card
                      )}
                    </div>
                  </div>
                  {p ? (
                    <button
                      onClick={() => actions.tapOut(s.id)}
                      className="flex items-center gap-1 rounded-xl bg-ink px-2.5 py-2 text-xs font-extrabold text-white shadow transition hover:scale-105"
                    >
                      <LogOut size={14} /> Tap out
                    </button>
                  ) : (
                    <button
                      onClick={() => actions.tapIn(s.id)}
                      className="flex items-center gap-1 rounded-xl bg-peach px-2.5 py-2 text-xs font-extrabold text-white shadow transition hover:scale-105"
                    >
                      <DoorOpen size={14} /> Tap in
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-1 text-xs font-extrabold uppercase tracking-wider text-muted">Drop item</div>
          <p className="mb-3 text-xs text-muted">Pick one, then click the photo. It's linked to whoever is nearest.</p>
          <div className="grid grid-cols-3 gap-2">
            {ITEM_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTool(tool === t ? null : t)}
                className={`flex flex-col items-center rounded-2xl py-2 text-xs font-bold transition ${
                  tool === t ? 'bg-lilac text-white shadow-lg ring-2 ring-lilac/40' : 'bg-ink/5 hover:bg-ink/10'
                }`}
              >
                <span className="text-2xl">{ITEMS[t].emoji}</span>
                {ITEMS[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- center: camera view ---------- */}
      <div className="card relative order-first p-3 sm:p-4 lg:order-none">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-2xl font-black">Live Kitchen</h2>
            <p className="text-sm text-muted">Anonymous numbers only. Drag people to move them around.</p>
          </div>
          <button
            onClick={() => actions.dispatch({ type: 'resetLive' })}
            className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-muted hover:bg-ink/10"
          >
            <RotateCcw size={13} /> Clear kitchen
          </button>
        </div>
        <KitchenCanvas
          ref={ref}
          zones={state.zones}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          cursor={tool ? 'copy' : 'default'}
        >
          <CamHud />
          {state.items.map((i) => (
            <ItemSticker key={i.id} item={i} onRemove={() => actions.dispatch({ type: 'removeItem', id: i.id })} />
          ))}
          {state.people.map((p) => (
            <PersonMarker
              key={p.trackId}
              p={p}
              dragging={drag === p.trackId}
              onPointerDown={(e) => {
                e.stopPropagation()
                ref.current?.setPointerCapture(e.pointerId)
                setDrag(p.trackId)
              }}
            />
          ))}
          {toast && (
            <div className="anim-fade-up absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-xl">
              {toast}
            </div>
          )}
        </KitchenCanvas>
        <div className="mt-3 flex flex-wrap gap-4 px-1 text-xs font-bold text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full bg-white ring-2 ring-mint" /> In an OK spot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full bg-white ring-2 ring-rose" /> In a keep-clear zone (checked at tap-out)
          </span>
        </div>
      </div>

      {/* ---------- right: phone ---------- */}
      <div className="card flex flex-col items-center gap-3 p-4 lg:col-span-2 xl:col-span-1">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Private nudges</span>
          <div className="flex gap-1">
            {STUDENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => actions.dispatch({ type: 'setPhone', studentId: s.id })}
                className={`h-7 w-7 rounded-full text-xs font-black text-white transition ${
                  state.phoneStudentId === s.id ? 'scale-110 ring-2 ring-ink ring-offset-2' : 'opacity-60'
                }`}
                style={{ background: s.color }}
                title={`${s.name}'s phone`}
              >
                {s.name[0]}
              </button>
            ))}
          </div>
        </div>
        <Phone studentId={state.phoneStudentId} />
      </div>
    </div>
  )
}

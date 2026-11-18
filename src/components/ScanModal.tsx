import { useEffect, useState } from 'react'
import { Lock, ScanLine, Send, X } from 'lucide-react'
import { KitchenCanvas } from './KitchenCanvas'
import { ItemSticker } from './Markers'
import { ITEMS, studentById, trackColor, zonePhrase } from '../data'
import { useStore } from '../store'

export function ScanModal() {
  const { state } = useStore()
  return state.scan ? <ScanView key={state.scan.id} /> : null
}

function ScanView() {
  const { state, actions } = useStore()
  const scan = state.scan!
  const [phase, setPhase] = useState<'scanning' | 'done'>('scanning')

  useEffect(() => {
    const t = setTimeout(() => setPhase('done'), 1500)
    return () => clearTimeout(t)
  }, [])
  const st = studentById(scan.studentId)
  const flagged = state.items.filter((i) => scan.flaggedItemIds.includes(i.id))
  const issue = state.issues.find((i) => i.id === scan.issueId)
  const clean = scan.flaggedItemIds.length === 0
  const close = () => actions.dispatch({ type: 'dismissScan' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={close}>
      <div className="card anim-fade-up relative w-full max-w-4xl p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-ink/5">
          <X size={20} />
        </button>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lilac-soft text-lilac">
            <ScanLine />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-muted">
              <span className="rounded-full px-1.5 text-white" style={{ background: trackColor(scan.trackId) }}>
                #{scan.trackId}
              </span>{' '}
              tapped out
            </div>
            <h3 className="text-2xl font-black">{phase === 'scanning' ? 'Scanning surfaces…' : 'Scan complete'}</h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-sm font-extrabold text-muted">Before · agreed clean layout</div>
            <KitchenCanvas zones={state.zones} showLabels={false} />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-extrabold text-muted">After · right now</div>
            <KitchenCanvas zones={state.zones} showLabels={false} dim={phase === 'scanning'}>
              {phase === 'scanning' && <div className="scan-line" />}
              {state.items.map((i) => {
                const mine = scan.flaggedItemIds.includes(i.id)
                return <ItemSticker key={i.id} item={i} small={!mine} highlight={mine && phase === 'done'} dimmed={!mine} />
              })}
            </KitchenCanvas>
          </div>
        </div>

        {phase === 'done' && (
          <div className="anim-fade-up mt-5">
            {clean ? (
              <div className="flex items-center gap-4 rounded-2xl bg-mint-soft p-4">
                <svg viewBox="0 0 52 52" className="h-14 w-14 shrink-0">
                  <circle cx="26" cy="26" r="24" fill="#34c38f" />
                  <path className="anim-check" d="M15 27 l8 8 l15 -17" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="text-xl font-black text-ink">All clear, thanks {st.name}!</div>
                  <div className="text-sm font-semibold text-muted">Kitchen matches the house rules. Nothing to do, no nudge sent.</div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="rounded-2xl bg-rose-soft p-4">
                  <div className="text-xl font-black text-ink">
                    {scan.flaggedItemIds.length} thing{scan.flaggedItemIds.length > 1 ? 's' : ''} to tidy
                  </div>
                  <ul className="mt-1 space-y-0.5 text-sm font-bold text-ink/80">
                    {flagged.map((i) => {
                      const z = state.zones.find((zz) => zz.id === i.zoneId)
                      return (
                        <li key={i.id}>
                          {ITEMS[i.type].emoji} {ITEMS[i.type].noun} {z ? zonePhrase(z.name) : ''}
                        </li>
                      )
                    })}
                    {flagged.length === 0 && issue?.resolvedAt && <li>✨ Already cleaned. Thank you!</li>}
                  </ul>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-lilac-soft p-4 text-sm font-bold text-ink/80">
                  <span className="flex items-center gap-2">
                    <Send size={16} className="text-lilac" /> Kind nudge sent to {st.name}'s phone
                  </span>
                  <span className="flex items-center gap-2">
                    <Lock size={16} className="text-lilac" /> Private. Never posted to the group
                  </span>
                  {issue?.synced && <span className="text-lilac">✓ Synced to 2DooD</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

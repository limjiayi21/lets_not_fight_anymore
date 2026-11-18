import { useEffect, useState } from 'react'
import { CheckCircle2, ListChecks } from 'lucide-react'
import { fmtTime, studentById } from '../data'
import { useStore } from '../store'
import type { Issue } from '../types'

export function nudgeText(issue: Issue) {
  const name = studentById(issue.studentId).name
  const many = issue.itemIds.length > 1
  return `Hey ${name}, quick one before it turns into a group chat drama: looks like ${issue.summary} at ${fmtTime(issue.createdAt)}. Mind clearing ${many ? 'them' : 'it'} in the next 30 min? Let's not fight 🙂`
}

function Clock() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(t)
  }, [])
  return <>{fmtTime(now).replace(/\s?[AP]M/i, '')}</>
}

export function Phone({ studentId, big }: { studentId: string; big?: boolean }) {
  const { state, actions } = useStore()
  const st = studentById(studentId)
  const mine = state.issues.filter((i) => i.studentId === studentId)
  const open = mine.filter((i) => !i.resolvedAt).reverse()
  const done = mine.filter((i) => i.resolvedAt).slice(-2).reverse()

  return (
    <div
      className={`relative mx-auto rounded-[2.6rem] bg-ink p-2.5 shadow-2xl ring-1 ring-black/20 ${big ? 'w-[320px]' : 'w-[260px]'}`}
    >
      <div className={`relative overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-[#ffd3c2] via-[#e9dcff] to-[#c9e8ff] ${big ? 'h-[620px]' : 'h-[500px]'}`}>
        <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
        <div className="flex items-center justify-between px-6 pt-2.5 text-xs font-extrabold text-ink">
          <span>
            <Clock />
          </span>
          <span className="tracking-tighter">5G ▂▄▆█</span>
        </div>
        <div className="mt-6 text-center">
          <div className={`font-black tracking-tight text-ink/85 ${big ? 'text-6xl' : 'text-5xl'}`}>
            <Clock />
          </div>
          <div className="mt-1 text-xs font-bold text-ink/60">{st.name}'s phone</div>
        </div>

        <div className="mt-6 space-y-2.5 px-3">
          {open.map((i) => (
            <div key={i.id} className="anim-slide-down rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-peach text-sm">🤝</div>
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink/70">Let's Not Fight</span>
                <span className="ml-auto text-[11px] text-ink/50">now</span>
              </div>
              <p className="text-[13px] font-semibold leading-snug text-ink">{nudgeText(i)}</p>
              {i.synced && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-lilac-soft px-2 py-0.5 text-[10px] font-black text-lilac">
                  <ListChecks size={11} /> Synced to 2DooD
                </div>
              )}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => actions.dispatch({ type: 'resolve', issueId: i.id })}
                  className="rounded-xl bg-mint py-2 text-xs font-black text-white shadow transition hover:scale-[1.03] active:scale-95"
                >
                  Cleaned it ✓
                </button>
                <button className="rounded-xl bg-ink/5 py-2 text-xs font-bold text-ink/70" title="Just a snooze, no penalty">
                  On it in 10
                </button>
              </div>
            </div>
          ))}
          {done.map((i) => (
            <div key={i.id} className="anim-fade-up flex items-start gap-2 rounded-2xl bg-white/70 p-3 shadow">
              <CheckCircle2 className="mt-0.5 shrink-0 text-mint" size={18} />
              <div>
                <p className="text-[12px] font-bold text-ink">Thanks {st.name}! Kitchen's back to peaceful ✨</p>
                <p className="text-[10px] text-ink/50">Resolved at {fmtTime(i.resolvedAt!)}</p>
              </div>
            </div>
          ))}
          {open.length === 0 && done.length === 0 && (
            <div className="rounded-2xl bg-white/50 p-4 text-center text-xs font-bold text-ink/55">
              No nudges. Nothing to clean 🕊️
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-ink/60" />
      </div>
    </div>
  )
}

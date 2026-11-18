import { CheckCircle2, DoorOpen, ListChecks, LogOut, MessageCircleHeart, Sparkles, TriangleAlert } from 'lucide-react'
import { fmtTime, studentById } from '../data'
import { useStore } from '../store'
import type { LogKind } from '../types'

const META: Record<LogKind, { icon: typeof DoorOpen; color: string; bg: string }> = {
  enter: { icon: DoorOpen, color: 'text-sky', bg: 'bg-sky/15' },
  exit: { icon: LogOut, color: 'text-muted', bg: 'bg-ink/5' },
  issue: { icon: TriangleAlert, color: 'text-rose', bg: 'bg-rose-soft' },
  nudge: { icon: MessageCircleHeart, color: 'text-lilac', bg: 'bg-lilac-soft' },
  resolved: { icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint-soft' },
  clear: { icon: Sparkles, color: 'text-mint', bg: 'bg-mint-soft' },
  sync: { icon: ListChecks, color: 'text-lilac', bg: 'bg-lilac-soft' },
}

function dayLabel(t: number) {
  const d = new Date(t)
  const today = new Date()
  const y = new Date(Date.now() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

export function PeaceLog() {
  const { state, actions } = useStore()
  const total = state.issues.length
  const resolved = state.issues.filter((i) => i.resolvedAt)
  const rate = total ? Math.round((resolved.length / total) * 100) : 100
  const avgMin = resolved.length
    ? Math.max(1, Math.round(resolved.reduce((s, i) => s + (i.resolvedAt! - i.createdAt), 0) / resolved.length / 60000))
    : null
  const visits = state.log.filter((l) => l.kind === 'exit').length

  const stats = [
    { label: 'Days without a kitchen fight', value: state.daysWithoutFight, emoji: '🕊️', tint: 'bg-mint-soft', big: true },
    { label: 'Clean-up rate', value: `${rate}%`, emoji: '🧽', tint: 'bg-peach-soft' },
    { label: 'Nudges sent (privately)', value: total, emoji: '💌', tint: 'bg-lilac-soft' },
    { label: 'Avg. time to tidy', value: avgMin ? `${avgMin} min` : '—', emoji: '⏱️', tint: 'bg-sky/15' },
  ]

  const entries = [...state.log].reverse()
  let lastDay = ''

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black">Peace Log</h2>
            <p className="text-sm text-muted">Every visit, every tidy-up. Card taps become anonymous numbers.</p>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset the log and stats back to the demo starting point?')) actions.dispatch({ type: 'resetAll' })
            }}
            className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-muted hover:bg-ink/10"
          >
            Reset log
          </button>
        </div>
        <ol className="relative space-y-1">
          {entries.map((e) => {
            const m = META[e.kind]
            const day = dayLabel(e.t)
            const showDay = day !== lastDay
            lastDay = day
            const st = e.studentId ? studentById(e.studentId) : null
            const issue = e.kind === 'issue' ? state.issues.find((i) => Math.abs(i.createdAt - e.t) < 50 && i.studentId === e.studentId) : null
            return (
              <li key={e.id}>
                {showDay && <div className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wider text-muted first:mt-0">{day}</div>}
                <div className="anim-fade-up flex items-start gap-3 rounded-2xl p-2.5 hover:bg-ink/[0.03]">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
                    <m.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold leading-snug">{e.text}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                      <span>{fmtTime(e.t)}</span>
                      {(e.kind === 'nudge' || e.kind === 'resolved') && st && <span>· only {st.name} sees nudges</span>}
                      {issue && (
                        <span className={`rounded-full px-2 py-px font-extrabold ${issue.resolvedAt ? 'bg-mint-soft text-mint' : 'bg-peach-soft text-peach'}`}>
                          {issue.resolvedAt ? `resolved ${fmtTime(issue.resolvedAt)}` : 'waiting for tidy-up'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`card flex items-center gap-4 p-5 ${s.big ? 'ring-2 ring-mint/30' : ''}`}>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${s.tint}`}>{s.emoji}</div>
            <div>
              <div key={String(s.value)} className={`font-black ${s.big ? 'anim-tick text-5xl' : 'text-3xl'}`}>
                {s.value}
              </div>
              <div className="text-sm font-bold text-muted">{s.label}</div>
            </div>
          </div>
        ))}
        <div className="card p-5 text-sm">
          <div className="mb-1 font-black">🤝 No leaderboards. Ever.</div>
          <p className="text-muted">
            We don't rank roommates or post who forgot what. Nudges go to one person, privately, and fade once things are tidy. {visits} visits logged so far.
          </p>
        </div>
      </div>
    </div>
  )
}

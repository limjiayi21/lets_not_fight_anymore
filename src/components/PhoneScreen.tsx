import { ListChecks, Lock, RefreshCw } from 'lucide-react'
import { useTwoDooDTasks } from '../twodood'
import { Phone } from './Phone'
import { STUDENTS, studentById } from '../data'
import { useStore } from '../store'

export function PhoneScreen() {
  const { state, actions } = useStore()
  const st = studentById(state.phoneStudentId)
  const open = state.issues.filter((i) => !i.resolvedAt && i.studentId === st.id).length

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 flex-col gap-6">
      <div className="card space-y-5 p-6">
        <div>
          <h2 className="text-2xl font-black">Phone Nudge</h2>
          <p className="text-sm text-muted">What a roommate sees after leaving something behind.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STUDENTS.map((s) => {
            const n = state.issues.filter((i) => !i.resolvedAt && i.studentId === s.id).length
            return (
              <button
                key={s.id}
                onClick={() => actions.dispatch({ type: 'setPhone', studentId: s.id })}
                className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 font-extrabold transition ${
                  state.phoneStudentId === s.id ? 'bg-ink text-white shadow-lg' : 'bg-ink/5 hover:bg-ink/10'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-white" style={{ background: s.color }}>
                  {s.name[0]}
                </span>
                {s.name}
                {n > 0 && <span className="rounded-full bg-rose px-1.5 text-xs text-white">{n}</span>}
              </button>
            )
          })}
        </div>
        <div className="rounded-2xl bg-lilac-soft p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-black text-ink">
            <Lock size={16} className="text-lilac" /> Only {st.name} gets this
          </div>
          <p className="text-ink/70">
            Nudges go straight to one phone. They're never posted in the house group chat, and nobody else can see who left what.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-black">The tone we aim for</div>
          <ul className="space-y-1.5 text-ink/75">
            <li>💬 Kind and specific: what, where, when.</li>
            <li>⏳ A relaxed window (30 min) instead of an alarm.</li>
            <li>🎉 One tap to say it's done, and the whole house's streak goes up.</li>
          </ul>
        </div>
        <div className="text-sm font-bold text-muted">
          {open ? `${st.name} has ${open} open nudge${open > 1 ? 's' : ''}.` : `${st.name} has nothing to tidy right now. Try the Live Kitchen or Run demo.`}
        </div>
      </div>
      {state.sync2dood ? <TwoDooDList /> : null}
      </div>
      <Phone studentId={st.id} big />
    </div>
  )
}

function TwoDooDList() {
  const { state } = useStore()
  const { tasks, demo, error, reload } = useTwoDooDTasks(state.issues)
  const clean = (tasks ?? []).filter((t) => t.title.startsWith('Clean:'))
  const other = (tasks ?? []).filter((t) => !t.title.startsWith('Clean:')).slice(0, 3)
  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac-soft text-lilac">
          <ListChecks size={18} />
        </div>
        <div className="mr-auto">
          <div className="font-black">2DooD list · live from the MeloMed 2DooD MCP server</div>
          <div className="text-xs font-bold text-muted">
            {demo ? 'Demo account (fictional student Maya Chen, in-memory data)' : 'Signed-in 2DooD account'}
          </div>
        </div>
        <button onClick={reload} className="flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-muted hover:bg-ink/10">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {error ? (
        <p className="rounded-xl bg-ink/5 p-3 text-sm font-semibold text-muted">
          Can't reach the 2DooD bridge ({error}). It runs with <code>npm run dev</code>.
        </p>
      ) : !tasks ? (
        <p className="text-sm text-muted">Connecting to 2DooD…</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {[...clean, ...other].map((t) => (
            <li
              key={t.id}
              className={`anim-fade-up flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
                t.title.startsWith('Clean:') ? 'bg-lilac-soft text-ink' : 'bg-ink/[0.03] text-ink/70'
              }`}
            >
              <span className="h-4 w-4 shrink-0 rounded-md border-2 border-ink/25" />
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {t.due && <span className="shrink-0 text-[11px] font-semibold text-muted">{t.due}</span>}
            </li>
          ))}
          {clean.length === 0 && (
            <li className="text-xs font-semibold text-muted sm:col-span-2">No kitchen to-dos open. Cleaned ones are ticked off automatically.</li>
          )}
        </ul>
      )}
    </div>
  )
}

import { Lock } from 'lucide-react'
import { Phone } from './Phone'
import { STUDENTS, studentById } from '../data'
import { useStore } from '../store'

export function PhoneScreen() {
  const { state, actions } = useStore()
  const st = studentById(state.phoneStudentId)
  const open = state.issues.filter((i) => !i.resolvedAt && i.studentId === st.id).length

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
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
      <Phone studentId={st.id} big />
    </div>
  )
}

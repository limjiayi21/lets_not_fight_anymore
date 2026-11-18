import { Camera, CreditCard, EyeOff, MessageCircleHeart, X } from 'lucide-react'

const POINTS = [
  { icon: CreditCard, title: 'Identity comes from your card tap', body: 'The door knows who tapped in. That is the only moment a name is involved.' },
  { icon: EyeOff, title: 'No facial recognition', body: 'Ceiling cameras see anonymous shapes with a number (#1, #2), like a cashierless store. Faces are never analyzed.' },
  { icon: Camera, title: 'Surfaces, not people', body: 'We only store snapshots of the counters, island, stove, sink and floor, compared against the layout you all agreed on. No video of people is kept.' },
  { icon: MessageCircleHeart, title: 'Nudges are private', body: 'If something is left out, only the person who left it gets a friendly ping. Never the group chat, never a leaderboard.' },
]

export function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card anim-fade-up relative w-full max-w-lg p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-ink/5">
          <X size={20} />
        </button>
        <h3 className="text-2xl font-black">How it works</h3>
        <p className="mb-5 text-sm text-muted">Built for peace, designed for privacy.</p>
        <ul className="space-y-4">
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lilac-soft text-lilac">
                <p.icon size={20} />
              </div>
              <div>
                <div className="font-extrabold">{p.title}</div>
                <div className="text-sm text-muted">{p.body}</div>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-6 w-full rounded-xl bg-ink py-3 font-extrabold text-white">
          Sounds fair 🤝
        </button>
      </div>
    </div>
  )
}

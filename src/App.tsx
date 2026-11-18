import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardList, Info, ListChecks, Pause, Play, ScrollText, SkipForward, Smartphone, Video, X } from 'lucide-react'
import { LayoutEditor } from './components/LayoutEditor'
import { LiveKitchen } from './components/LiveKitchen'
import { PhoneScreen } from './components/PhoneScreen'
import { PeaceLog } from './components/PeaceLog'
import { ScanModal } from './components/ScanModal'
import { HowItWorks } from './components/HowItWorks'
import { Confetti } from './components/Confetti'
import { TwoDooDSync } from './twodood'
import { DEMO_STEPS, type Tab } from './demo'
import { useStore } from './store'
import type { ItemType } from './types'

const TABS: { id: Tab; label: string; icon: typeof Video }[] = [
  { id: 'rules', label: 'House Rules', icon: ClipboardList },
  { id: 'live', label: 'Live Kitchen', icon: Video },
  { id: 'phone', label: 'Phone Nudge', icon: Smartphone },
  { id: 'log', label: 'Peace Log', icon: ScrollText },
]

type Demo = { running: boolean; paused: boolean; index: number; caption: string }
const IDLE: Demo = { running: false, paused: false, index: 0, caption: '' }

export default function App() {
  const { state, actions } = useStore()
  const [tab, setTab] = useState<Tab>('live')
  const [tool, setTool] = useState<ItemType | null>(null)
  const [about, setAbout] = useState(false)
  const [demo, setDemo] = useState<Demo>(IDLE)

  const api = useRef({ actions, setTab })
  api.current = { actions, setTab }

  const runStep = useCallback((i: number) => {
    const step = DEMO_STEPS[i]
    if (!step) return
    step.run(api.current)
    setDemo((d) => ({ ...d, index: i + 1, caption: step.caption }))
  }, [])

  // auto-advance
  useEffect(() => {
    if (!demo.running || demo.paused) return
    if (demo.index >= DEMO_STEPS.length) {
      const t = setTimeout(() => setDemo(IDLE), 6000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => runStep(demo.index), DEMO_STEPS[demo.index].wait)
    return () => clearTimeout(t)
  }, [demo.running, demo.paused, demo.index, runStep])

  const startDemo = () => {
    setTool(null)
    setDemo({ running: true, paused: false, index: 0, caption: 'Starting demo…' })
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-peach to-lilac text-xl shadow-md">🤝</div>
            <div className="leading-tight">
              <div className="text-lg font-black tracking-tight">Let's Not Fight</div>
              <div className="text-[11px] font-bold text-muted">Let's Not Fight. Anymore.</div>
            </div>
          </div>

          <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto px-1 md:order-none md:ml-6 md:w-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-extrabold transition ${
                  tab === t.id ? 'bg-ink text-white shadow-md' : 'text-ink/70 hover:bg-ink/5'
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-sm font-extrabold text-mint sm:flex" title="Days without a kitchen fight">
              🕊️ <span key={state.daysWithoutFight} className="anim-tick">{state.daysWithoutFight}</span>
              <span className="hidden lg:inline">days fight-free</span>
            </div>
            <button
              onClick={() => actions.dispatch({ type: 'toggle2dood' })}
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition md:flex ${
                state.sync2dood ? 'bg-lilac text-white shadow' : 'bg-ink/5 text-muted hover:bg-ink/10'
              }`}
              title="Also add a to-do to the student's 2DooD list through the MeloMed 2DooD MCP server"
            >
              <ListChecks size={14} /> 2DooD sync {state.sync2dood ? 'on' : 'off'}
            </button>
            <button onClick={() => setAbout(true)} className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-extrabold hover:bg-ink/10">
              <Info size={14} /> <span className="hidden sm:inline">How it works</span>
            </button>
            <button
              onClick={startDemo}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-peach to-[#ff7a8a] px-4 py-2 text-sm font-black text-white shadow-lg transition hover:scale-105"
            >
              <Play size={15} fill="white" /> Run demo
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {tab === 'rules' && <LayoutEditor />}
        {tab === 'live' && <LiveKitchen tool={tool} setTool={setTool} />}
        {tab === 'phone' && <PhoneScreen />}
        {tab === 'log' && <PeaceLog />}
      </main>

      <ScanModal />
      {about && <HowItWorks onClose={() => setAbout(false)} />}
      <Confetti />
      <TwoDooDSync />

      {demo.running && (
        <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
          <div className="card anim-fade-up flex w-full max-w-3xl items-center gap-3 p-3 pl-5 ring-2 ring-peach/40">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-peach">Demo</span>
                <div className="flex gap-1">
                  {DEMO_STEPS.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i < demo.index ? 'w-4 bg-peach' : 'w-1.5 bg-ink/15'}`} />
                  ))}
                </div>
              </div>
              <div key={demo.caption} className="anim-fade-up text-base font-extrabold leading-snug sm:text-lg">
                {demo.caption}
              </div>
            </div>
            <button
              onClick={() => setDemo((d) => ({ ...d, paused: !d.paused }))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10"
              title={demo.paused ? 'Resume' : 'Pause'}
            >
              {demo.paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              onClick={() => runStep(demo.index)}
              disabled={demo.index >= DEMO_STEPS.length}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
              title="Next step"
            >
              <SkipForward size={18} />
            </button>
            <button onClick={() => setDemo(IDLE)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/5" title="Stop demo">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

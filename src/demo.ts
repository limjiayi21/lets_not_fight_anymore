import type { Pt } from './types'
import type { Actions } from './store'

export type Tab = 'rules' | 'live' | 'phone' | 'log'
export type DemoApi = { actions: Actions; setTab: (t: Tab) => void }

export type DemoStep = { wait: number; caption: string; run: (api: DemoApi) => void }

const MAYA_SPOT: Pt = [0.4, 0.72]
const ALEX_SPOT: Pt = [0.8, 0.88]

export const DEMO_STEPS: DemoStep[] = [
  {
    wait: 0,
    caption: 'A quiet evening in the shared kitchen. The door is locked.',
    run: ({ actions, setTab }) => {
      actions.dispatch({ type: 'resetAll' })
      setTab('live')
    },
  },
  {
    wait: 1800,
    caption: 'Maya taps a student card. The door unlocks and the camera tracks an anonymous #1.',
    run: ({ actions }) => actions.tapIn('maya', MAYA_SPOT),
  },
  {
    wait: 2800,
    caption: 'Alex taps in as #2. No faces, just numbers.',
    run: ({ actions }) => actions.tapIn('alex', ALEX_SPOT),
  },
  {
    wait: 2800,
    caption: 'Maya leaves a bowl on the island…',
    run: ({ actions }) => actions.drop('bowl', 0.47, 0.56),
  },
  {
    wait: 2200,
    caption: '…and a little spill on the counter.',
    run: ({ actions }) => actions.drop('spill', 0.51, 0.49),
  },
  {
    wait: 2400,
    caption: 'Alex parks a pan in the agreed pots & pans spot. Totally fine ✓',
    run: ({ actions }) => {
      actions.walk('alex', [0.74, 0.8])
      setTimeout(() => actions.drop('pan', 0.77, 0.537), 1200)
    },
  },
  {
    wait: 3200,
    caption: 'Maya taps out. The kitchen is compared with the agreed clean layout…',
    run: ({ actions }) => actions.tapOut('maya'),
  },
  {
    wait: 5600,
    caption: "2 things flagged. A kind, private nudge lands on Maya's phone. No group chat drama.",
    run: ({ actions }) => {
      actions.dispatch({ type: 'dismissScan' })
      actions.dispatch({ type: 'setPhone', studentId: 'maya' })
    },
  },
  {
    wait: 3600,
    caption: 'Alex taps out. All clear, nothing to do ✓',
    run: ({ actions }) => actions.tapOut('alex'),
  },
  {
    wait: 5000,
    caption: 'Maya tidies up and taps “Cleaned it”…',
    run: ({ actions }) => actions.dispatch({ type: 'dismissScan' }),
  },
  {
    wait: 1800,
    caption: "Peace restored. The fight-free streak ticks up. Let's not fight. Anymore. 🕊️",
    run: ({ actions }) => actions.resolveOpenFor('maya'),
  },
]

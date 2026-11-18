import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { StoreCtx } from './storeContext'
import { DEFAULT_ZONES, DOOR, ITEMS, SPOTS, studentById, zonePhrase } from './data'
import { dist, zoneAt } from './geometry'
import type { AppState, Issue, IssueSync, Item, ItemType, LogEntry, LogKind, Pt, ScanResult, Zone } from './types'

const KEY = 'lets-not-fight-v1'
const uid = () => Math.random().toString(36).slice(2, 10)

const DAY = 86400000
function seedLog(): LogEntry[] {
  const now = Date.now()
  return [
    { id: uid(), t: now - 2 * DAY - 3600000, kind: 'enter', text: 'Card NYU-7712 tapped in → tracked as #1', studentId: 'sam', trackId: 1 },
    { id: uid(), t: now - 2 * DAY - 2400000, kind: 'exit', text: '#1 tapped out', studentId: 'sam', trackId: 1 },
    { id: uid(), t: now - 2 * DAY - 2399000, kind: 'clear', text: 'Scan complete: all clear ✨', studentId: 'sam', trackId: 1 },
  ]
}

export function initialState(): AppState {
  return {
    zones: DEFAULT_ZONES,
    people: [],
    items: [],
    issues: [],
    log: seedLog(),
    nextTrackId: 1,
    daysWithoutFight: 12,
    sync2dood: false,
    scan: null,
    celebrate: 0,
    lastDoor: null,
    phoneStudentId: 'maya',
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as AppState
      // a 2DooD call that was in flight when the page closed gets retried
      const issues = (saved.issues ?? []).map((i) => (i.sync?.status === 'pending' ? { ...i, sync: undefined } : i))
      return { ...initialState(), ...saved, issues, scan: null }
    }
  } catch {
    /* ignore */
  }
  return initialState()
}

type Action =
  | { type: 'tapIn'; studentId: string }
  | { type: 'move'; trackId: number; x: number; y: number }
  | { type: 'drop'; item: ItemType; x: number; y: number }
  | { type: 'removeItem'; id: string }
  | { type: 'tapOut'; studentId: string }
  | { type: 'resolve'; issueId: string }
  | { type: 'dismissScan' }
  | { type: 'syncUpdate'; issueId: string; sync: Partial<IssueSync>; log?: string }
  | { type: 'setPhone'; studentId: string }
  | { type: 'addZone'; zone: Zone }
  | { type: 'updateZone'; zone: Zone }
  | { type: 'deleteZone'; id: string }
  | { type: 'resetZones' }
  | { type: 'toggle2dood' }
  | { type: 'set2dood'; on: boolean }
  | { type: 'resetLive' }
  | { type: 'resetAll' }

const entry = (kind: LogKind, text: string, extra: Partial<LogEntry> = {}): LogEntry => ({
  id: uid(),
  t: Date.now(),
  kind,
  text,
  ...extra,
})

function joinNice(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? ''
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
}

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'tapIn': {
      if (s.people.some((p) => p.studentId === a.studentId)) return s
      const st = studentById(a.studentId)
      const trackId = s.nextTrackId
      return {
        ...s,
        people: [...s.people, { trackId, studentId: a.studentId, x: DOOR[0], y: DOOR[1], enteredAt: Date.now() }],
        nextTrackId: trackId + 1,
        lastDoor: { studentId: a.studentId, trackId, at: Date.now(), dir: 'in' },
        log: [...s.log, entry('enter', `Card ${st.card} tapped in → tracked as #${trackId}`, { studentId: st.id, trackId })],
      }
    }
    case 'move':
      return {
        ...s,
        people: s.people.map((p) => (p.trackId === a.trackId ? { ...p, x: clamp(a.x), y: clamp(a.y) } : p)),
      }
    case 'drop': {
      if (s.people.length === 0) return s
      const zone = zoneAt(a.x, a.y, s.zones)
      let owner = s.people[0]
      for (const p of s.people) if (dist(p.x, p.y, a.x, a.y) < dist(owner.x, owner.y, a.x, a.y)) owner = p
      const item: Item = {
        id: uid(),
        type: a.item,
        x: a.x,
        y: a.y,
        placedAt: Date.now(),
        zoneId: zone?.id ?? null,
        flagged: zone?.kind === 'clear',
        ownerTrackId: owner.trackId,
      }
      return { ...s, items: [...s.items, item] }
    }
    case 'removeItem':
      return { ...s, items: s.items.filter((i) => i.id !== a.id || !!i.issueId) }
    case 'tapOut': {
      const person = s.people.find((p) => p.studentId === a.studentId)
      if (!person) return s
      const st = studentById(a.studentId)
      const mine = s.items.filter((i) => i.flagged && !i.issueId && i.ownerTrackId === person.trackId)
      const log = [...s.log, entry('exit', `#${person.trackId} tapped out`, { studentId: st.id, trackId: person.trackId })]
      let issues = s.issues
      let items = s.items
      let issue: Issue | null = null
      if (mine.length) {
        const parts = mine.map((i) => {
          const z = s.zones.find((zz) => zz.id === i.zoneId)
          return `${ITEMS[i.type].noun} ${z ? zonePhrase(z.name) : 'out'}`
        })
        issue = {
          id: uid(),
          studentId: st.id,
          trackId: person.trackId,
          itemIds: mine.map((i) => i.id),
          summary: joinNice(parts),
          createdAt: Date.now(),
          synced: s.sync2dood,
          todoTitles: mine.map((i) => {
            const z = s.zones.find((zz) => zz.id === i.zoneId)
            return `Clean: ${ITEMS[i.type].label.toLowerCase()} ${z ? zonePhrase(z.name) : 'in the kitchen'}`
          }),
        }
        issues = [...issues, issue]
        items = items.map((i) => (issue!.itemIds.includes(i.id) ? { ...i, issueId: issue!.id } : i))
        log.push(entry('issue', `Scan found ${mine.length} thing${mine.length > 1 ? 's' : ''} out of place: ${issue.summary}`, { studentId: st.id, trackId: person.trackId }))
        log.push(entry('nudge', `Friendly nudge sent privately to ${st.name}`, { studentId: st.id, trackId: person.trackId }))
      } else {
        log.push(entry('clear', 'Scan complete: all clear ✨', { studentId: st.id, trackId: person.trackId }))
      }
      const scan: ScanResult = {
        id: uid(),
        studentId: st.id,
        trackId: person.trackId,
        issueId: issue?.id ?? null,
        flaggedItemIds: mine.map((i) => i.id),
        at: Date.now(),
      }
      return {
        ...s,
        people: s.people.filter((p) => p !== person),
        items,
        issues,
        log,
        scan,
        lastDoor: { studentId: st.id, trackId: person.trackId, at: Date.now(), dir: 'out' },
        phoneStudentId: issue ? st.id : s.phoneStudentId,
      }
    }
    case 'resolve': {
      const issue = s.issues.find((i) => i.id === a.issueId)
      if (!issue || issue.resolvedAt) return s
      const st = studentById(issue.studentId)
      return {
        ...s,
        issues: s.issues.map((i) => (i.id === issue.id ? { ...i, resolvedAt: Date.now() } : i)),
        items: s.items.filter((i) => !issue.itemIds.includes(i.id)),
        daysWithoutFight: s.daysWithoutFight + 1,
        celebrate: s.celebrate + 1,
        log: [...s.log, entry('resolved', `${st.name} cleaned it up. Peace kept 🕊️`, { studentId: st.id, trackId: issue.trackId })],
      }
    }
    case 'syncUpdate': {
      const issue = s.issues.find((i) => i.id === a.issueId)
      if (!issue) return s
      const sync = { status: 'pending', ...issue.sync, ...a.sync } as IssueSync
      return {
        ...s,
        issues: s.issues.map((i) => (i.id === issue.id ? { ...i, sync } : i)),
        log: a.log ? [...s.log, entry('sync', a.log, { studentId: issue.studentId })] : s.log,
      }
    }
    case 'dismissScan':
      return { ...s, scan: null }
    case 'setPhone':
      return { ...s, phoneStudentId: a.studentId }
    case 'addZone':
      return { ...s, zones: [...s.zones, a.zone] }
    case 'updateZone':
      return { ...s, zones: s.zones.map((z) => (z.id === a.zone.id ? a.zone : z)) }
    case 'deleteZone':
      return { ...s, zones: s.zones.filter((z) => z.id !== a.id) }
    case 'resetZones':
      return { ...s, zones: DEFAULT_ZONES }
    case 'toggle2dood':
      return { ...s, sync2dood: !s.sync2dood }
    case 'set2dood':
      return { ...s, sync2dood: a.on }
    case 'resetLive':
      return { ...s, people: [], items: [], scan: null, nextTrackId: 1, lastDoor: null }
    case 'resetAll':
      return { ...initialState(), zones: s.zones, sync2dood: s.sync2dood }
  }
}

const clamp = (v: number) => Math.min(0.99, Math.max(0.01, v))

function useActions(dispatch: React.Dispatch<Action>, getState: () => AppState) {
  return useMemo(() => {
    const api = {
      dispatch,
      tapIn(studentId: string, target?: Pt) {
        const before = getState()
        if (before.people.some((p) => p.studentId === studentId)) return
        dispatch({ type: 'tapIn', studentId })
        const trackId = before.nextTrackId
        const spot = target ?? SPOTS[before.people.length % SPOTS.length]
        setTimeout(() => dispatch({ type: 'move', trackId, x: spot[0], y: spot[1] }), 120)
      },
      walk(studentId: string, to: Pt) {
        const p = getState().people.find((pp) => pp.studentId === studentId)
        if (p) dispatch({ type: 'move', trackId: p.trackId, x: to[0], y: to[1] })
      },
      tapOut(studentId: string) {
        const p = getState().people.find((pp) => pp.studentId === studentId)
        if (!p) return
        dispatch({ type: 'move', trackId: p.trackId, x: DOOR[0], y: DOOR[1] })
        setTimeout(() => dispatch({ type: 'tapOut', studentId }), 1000)
      },
      drop(item: ItemType, x: number, y: number) {
        dispatch({ type: 'drop', item, x, y })
      },
      resolveOpenFor(studentId: string) {
        const open = getState().issues.filter((i) => i.studentId === studentId && !i.resolvedAt)
        open.forEach((i) => dispatch({ type: 'resolve', issueId: i.id }))
      },
    }
    return api
  }, [dispatch, getState])
}

export type Actions = ReturnType<typeof useActions>

let latest: AppState
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  latest = state
  const getState = useMemo(() => () => latest, [])
  const actions = useActions(dispatch, getState)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  return <StoreCtx.Provider value={{ state, actions }}>{children}</StoreCtx.Provider>
}

export { useStore } from './storeContext'

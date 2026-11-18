import type { ItemType, Pt, Student, Zone, ZoneKind } from './types'

// The photo is 2000x1500; zones are authored in pixels and stored normalized (0..1).
const W = 2000
const H = 1500
const px = (pts: [number, number][]): Pt[] => pts.map(([x, y]) => [x / W, y / H])

export const DEFAULT_ZONES: Zone[] = [
  {
    id: 'z-floor',
    name: 'Floor',
    kind: 'clear',
    points: px([[450, 918], [800, 880], [810, 960], [1105, 1290], [1265, 1240], [1265, 1010], [1600, 1170], [1760, 1265], [2000, 1420], [2000, 1500], [330, 1500]]),
  },
  {
    id: 'z-island',
    name: 'Island',
    kind: 'clear',
    points: px([[772, 768], [850, 755], [1295, 895], [1292, 935], [1265, 958], [1020, 942], [790, 800]]),
  },
  {
    id: 'z-counter',
    name: 'Counter',
    kind: 'clear',
    label: [0.79, 0.6],
    points: px([[950, 720], [1045, 710], [1590, 745], [1590, 880], [1808, 895], [1805, 928], [950, 742]]),
  },
  {
    id: 'z-sink',
    name: 'Sink',
    kind: 'clear',
    points: px([[1040, 733], [1110, 726], [1178, 740], [1112, 760], [1045, 750]]),
  },
  {
    id: 'z-stove',
    name: 'Stove',
    kind: 'clear',
    points: px([[1205, 772], [1325, 758], [1500, 792], [1495, 815], [1365, 825], [1215, 790]]),
  },
  {
    id: 'z-rack',
    name: 'Drying rack',
    kind: 'drying',
    points: px([[1048, 472], [1178, 470], [1178, 610], [1048, 612]]),
  },
  {
    id: 'z-pots',
    name: 'Pots & pans spot',
    kind: 'pots',
    points: px([[1490, 748], [1588, 754], [1588, 868], [1490, 852]]),
  },
  {
    id: 'z-appliances',
    name: 'Microwave & toaster',
    kind: 'appliances',
    points: px([[1590, 612], [1848, 612], [1848, 880], [1590, 880]]),
  },
]

export const ZONE_KINDS: { kind: ZoneKind; label: string }[] = [
  { kind: 'clear', label: 'Keep clear' },
  { kind: 'drying', label: 'OK: drying rack' },
  { kind: 'pots', label: 'OK: pots & pans' },
  { kind: 'appliances', label: 'OK: appliances' },
]

export const kindLabel = (k: ZoneKind) => ZONE_KINDS.find((z) => z.kind === k)?.label ?? k

export const STUDENTS: Student[] = [
  { id: 'maya', name: 'Maya', card: 'NYU-4821', color: '#ff8a65' },
  { id: 'alex', name: 'Alex', card: 'NYU-1937', color: '#5eb4ff' },
  { id: 'sam', name: 'Sam', card: 'NYU-7712', color: '#a78bfa' },
]

export const studentById = (id: string) => STUDENTS.find((s) => s.id === id) ?? STUDENTS[0]

export const TRACK_COLORS = ['#ff7a59', '#4aa8ff', '#9b7bf7', '#22b07d', '#f2a516', '#ec5c9b']
export const trackColor = (n: number) => TRACK_COLORS[(n - 1) % TRACK_COLORS.length]

export const ITEMS: Record<ItemType, { emoji: string; label: string; noun: string }> = {
  bowl: { emoji: '🥣', label: 'Bowl', noun: 'a bowl' },
  plate: { emoji: '🍽️', label: 'Plate', noun: 'a plate' },
  cup: { emoji: '☕', label: 'Cup', noun: 'a cup' },
  pan: { emoji: '🍳', label: 'Pan', noun: 'a pan' },
  spill: { emoji: '💦', label: 'Spill', noun: 'a spill' },
  foodbag: { emoji: '🛍️', label: 'Food bag', noun: 'a food bag' },
}

export const ITEM_TYPES = Object.keys(ITEMS) as ItemType[]

export const DOOR: Pt = [0.5, 0.97]
export const SPOTS: Pt[] = [
  [0.38, 0.74],
  [0.8, 0.86],
  [0.3, 0.9],
  [0.62, 0.93],
]

export const zonePhrase = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('sink')) return `in the ${n}`
  return `on the ${n}`
}

export const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export type Pt = [number, number] // normalized 0..1 image coordinates

export type ZoneKind = 'drying' | 'pots' | 'appliances' | 'clear'

export interface Zone {
  id: string
  name: string
  kind: ZoneKind
  points: Pt[]
  label?: Pt // optional label anchor
}

export interface Student {
  id: string
  name: string
  card: string
  color: string
}

export interface Person {
  trackId: number
  studentId: string
  x: number
  y: number
  enteredAt: number
}

export type ItemType = 'bowl' | 'plate' | 'cup' | 'pan' | 'spill' | 'foodbag'

export interface Item {
  id: string
  type: ItemType
  x: number
  y: number
  placedAt: number
  zoneId: string | null
  flagged: boolean
  ownerTrackId: number | null // nearest anonymous person when it appeared
  issueId?: string
}

export interface Issue {
  id: string
  studentId: string
  trackId: number
  itemIds: string[]
  summary: string // e.g. "a bowl on the island and a spill on the counter"
  createdAt: number
  resolvedAt?: number
  synced: boolean
}

export type LogKind = 'enter' | 'exit' | 'issue' | 'nudge' | 'resolved' | 'clear' | 'sync'

export interface LogEntry {
  id: string
  t: number
  kind: LogKind
  text: string
  studentId?: string
  trackId?: number
}

export interface ScanResult {
  id: string
  studentId: string
  trackId: number
  issueId: string | null
  flaggedItemIds: string[]
  at: number
}

export interface AppState {
  zones: Zone[]
  people: Person[]
  items: Item[]
  issues: Issue[]
  log: LogEntry[]
  nextTrackId: number
  daysWithoutFight: number
  sync2dood: boolean
  scan: ScanResult | null
  celebrate: number
  lastDoor: { studentId: string; trackId: number; at: number; dir: 'in' | 'out' } | null
  phoneStudentId: string
}

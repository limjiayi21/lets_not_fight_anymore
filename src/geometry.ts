import type { Pt, Zone } from './types'

export function pointInPolygon(x: number, y: number, pts: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}

export function polygonArea(pts: Pt[]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1])
  }
  return Math.abs(a / 2)
}

export function centroid(pts: Pt[]): Pt {
  const n = pts.length || 1
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n]
}

/** The smallest zone that contains the point wins (so a small OK spot can sit inside a big keep-clear area). */
export function zoneAt(x: number, y: number, zones: Zone[]): Zone | null {
  let best: Zone | null = null
  let bestArea = Infinity
  for (const z of zones) {
    if (z.points.length < 3) continue
    if (pointInPolygon(x, y, z.points)) {
      const a = polygonArea(z.points)
      if (a < bestArea) {
        best = z
        bestArea = a
      }
    }
  }
  return best
}

// distance in image space (photo is 4:3, so scale y)
export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, (ay - by) * 0.75)
}

export const toPoints = (pts: Pt[]) => pts.map((p) => `${p[0]},${p[1]}`).join(' ')

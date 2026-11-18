import { forwardRef, type ReactNode } from 'react'
import { centroid, toPoints } from '../geometry'
import type { Zone } from '../types'

export const zoneStyle = (z: Zone, selected = false) => {
  const ok = z.kind !== 'clear'
  return {
    fill: ok ? (selected ? 'rgba(52,195,143,0.38)' : 'rgba(52,195,143,0.24)') : selected ? 'rgba(240,80,110,0.18)' : 'rgba(240,80,110,0.05)',
    stroke: ok ? '#22b07d' : selected ? '#f0506e' : 'rgba(240,80,110,0.75)',
    strokeWidth: selected ? 3 : ok ? 2.5 : 1.75,
    strokeDasharray: ok ? undefined : '6 5',
  }
}

type Props = {
  zones: Zone[]
  showZones?: boolean
  showLabels?: boolean
  selectedId?: string | null
  onZoneClick?: (id: string) => void
  children?: ReactNode
  svgExtra?: ReactNode
  className?: string
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  cursor?: string
  dim?: boolean
}

export const KitchenCanvas = forwardRef<HTMLDivElement, Props>(function KitchenCanvas(
  { zones, showZones = true, showLabels = true, selectedId, onZoneClick, children, svgExtra, className = '', cursor, dim, ...handlers },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`relative select-none overflow-hidden rounded-2xl bg-ink/5 touch-none ${className}`}
      style={{ cursor, aspectRatio: '4 / 3' }}
      {...handlers}
    >
      <img
        src={`${import.meta.env.BASE_URL}kitchen.png`}
        alt="Shared dorm kitchen"
        className={`absolute inset-0 h-full w-full object-cover transition ${dim ? 'brightness-75 saturate-50' : ''}`}
        draggable={false}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
        {showZones &&
          zones.map((z) => {
            const st = zoneStyle(z, z.id === selectedId)
            return (
              <polygon
                key={z.id}
                points={toPoints(z.points)}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={st.strokeWidth}
                strokeDasharray={st.strokeDasharray}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                style={{ cursor: onZoneClick ? 'pointer' : undefined, pointerEvents: onZoneClick ? 'auto' : 'none' }}
                onPointerDown={(e) => {
                  if (onZoneClick) {
                    e.stopPropagation()
                    onZoneClick(z.id)
                  }
                }}
              />
            )
          })}
        {svgExtra}
      </svg>
      {showZones &&
        showLabels &&
        zones.map((z) => {
          const [cx, cy] = z.label ?? centroid(z.points)
          const ok = z.kind !== 'clear'
          return (
            <div
              key={z.id}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold shadow-sm sm:text-xs ${
                ok ? 'bg-mint text-white' : 'bg-white/85 text-rose'
              } ${z.id === selectedId ? 'ring-2 ring-ink' : ''}`}
              style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}
            >
              {ok ? '✓ ' : ''}
              {z.name}
            </div>
          )
        })}
      {children}
    </div>
  )
})

export function relPoint(el: HTMLElement | null, e: { clientX: number; clientY: number }): [number, number] {
  if (!el) return [0, 0]
  const r = el.getBoundingClientRect()
  return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
}

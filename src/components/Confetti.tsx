import { useEffect, useState } from 'react'
import { useStore } from '../store'

const COLORS = ['#ff9f80', '#a78bfa', '#34c38f', '#5eb4ff', '#f2c94c', '#ff6b9a']

type Piece = { id: number; left: number; color: string; dx: number; rot: number; dur: number; delay: number; round: boolean }

export function Confetti() {
  const { state } = useStore()
  const [burst, setBurst] = useState<{ key: number; pieces: Piece[] } | null>(null)
  const [first] = useState(state.celebrate)

  useEffect(() => {
    if (state.celebrate === first) return
    const pieces: Piece[] = Array.from({ length: 110 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      dx: (Math.random() - 0.5) * 300,
      rot: (Math.random() - 0.5) * 1440,
      dur: 1.8 + Math.random() * 1.6,
      delay: Math.random() * 0.4,
      round: Math.random() < 0.3,
    }))
    setBurst({ key: state.celebrate, pieces })
    const t = setTimeout(() => setBurst(null), 4200)
    return () => clearTimeout(t)
  }, [state.celebrate, first])

  if (!burst) return null
  return (
    <div key={burst.key}>
      {burst.pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}vw`,
              background: p.color,
              borderRadius: p.round ? '50%' : 3,
              animationDelay: `${p.delay}s`,
              '--dx': `${p.dx}px`,
              '--rot': `${p.rot}deg`,
              '--dur': `${p.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

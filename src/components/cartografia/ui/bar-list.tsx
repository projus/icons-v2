'use client'

const NAVY_RAMP = ['#e8ecf4', '#b5c4d9', '#7a96bc', '#3d679c', '#1a2744']
const GOLD_RAMP = ['#fdf3d7', '#f5d98a', '#d4a017', '#b8860b', '#7a5a07']
const TEAL_RAMP = ['#d7f0f0', '#8dd5d5', '#3daaaa', '#0d7c7c', '#0d5c5c']

export const RAMPS = { navy: NAVY_RAMP, gold: GOLD_RAMP, teal: TEAL_RAMP }

function rampColor(ramp: string[], value: number, max: number) {
  const idx = Math.min(Math.floor((value / max) * ramp.length), ramp.length - 1)
  return ramp[idx]
}

export function BarList({ data, ramp = 'navy', nameWidth = 130 }: {
  data: [string, number][]
  ramp?: 'navy' | 'gold' | 'teal'
  nameWidth?: number
}) {
  const max = data[0]?.[1] || 1
  const colors = RAMPS[ramp]

  return (
    <div className="flex flex-col gap-[5px]">
      {data.map(([name, value]) => {
        const pct = Math.round((value / max) * 100)
        const color = rampColor(colors, value, max)
        const display = value < 50 ? value.toFixed(1) : value.toLocaleString('pt-BR')
        return (
          <div key={name} className="flex items-center gap-2 text-[11px]">
            <span
              className="shrink-0 truncate text-foreground"
              style={{ width: nameWidth }}
            >
              {name}
            </span>
            <div className="flex-1 h-1 rounded-sm bg-paper-dark overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="w-11 shrink-0 text-right font-mono text-[10px] text-stone">
              {display}
            </span>
          </div>
        )
      })}
    </div>
  )
}

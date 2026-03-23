'use client'
import { useState } from 'react'
import { Card } from '../ui/card'
import type { CalorData } from '../types'

function heatCol(v: number, max: number) {
  if (!v) return '#f5f0e8'
  const stops = ['#e8ecf4', '#b5c4d9', '#7a96bc', '#3d679c', '#1a3a6e', '#0f2244']
  return stops[Math.min(Math.floor((v / max) * stops.length), stops.length - 1)]
}

export default function PanelCalor({ data }: { data: CalorData }) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const maxH = Math.max(...data.matrix.flat())

  return (
    <Card title="Intensidade decisória: relator × período de 5 anos">
      {/* Column labels */}
      <div className="flex gap-[3px] mb-1" style={{ marginLeft: 113 }}>
        {data.buckets.map(b => (
          <div key={b} className="w-[38px] text-center font-mono text-[8px] text-stone">{b}</div>
        ))}
      </div>

      {/* Heatmap rows */}
      {data.relatores.map((rel, ri) => (
        <div key={rel} className="flex items-center gap-[3px] mb-[3px]">
          <span className="w-[110px] shrink-0 truncate text-right font-mono text-[9px] text-stone">{rel}</span>
          <div className="flex gap-[3px]">
            {data.matrix[ri].map((v, bi) => (
              <div
                key={bi}
                className="flex h-[22px] w-[38px] cursor-pointer items-center justify-center rounded-[3px] font-mono text-[8px] text-white/60 transition-opacity hover:opacity-75"
                style={{ background: heatCol(v, maxH) }}
                onMouseEnter={(e) => setTooltip({ text: `${rel} · ${data.buckets[bi]}: ${v} decisões`, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              >
                {v || ''}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-2.5 rounded border-l-[3px] border-gold bg-paper-dark/50 p-2 text-[10px] leading-[1.5] text-stone">
        Passe o mouse nas células para detalhes. Células escuras = maior concentração de decisões naquele período.
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[9999] max-w-[200px] rounded bg-navy px-2.5 py-1.5 font-mono text-[10px] text-paper shadow-[0_8px_48px_rgba(15,14,13,.14)]"
          style={{ left: tooltip.x + 14, top: tooltip.y - 30 }}
        >
          {tooltip.text}
        </div>
      )}
    </Card>
  )
}

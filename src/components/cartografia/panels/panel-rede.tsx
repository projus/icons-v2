'use client'
import { useMemo } from 'react'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { RedeData } from '../types'

export default function PanelRede({ data }: { data: RedeData }) {
  // Layout nodes in a circle
  const layout = useMemo(() => {
    const cx = 350, cy = 160, radius = 120
    return data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2 - Math.PI / 2
      return {
        ...n,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        r: Math.max(14, Math.min(34, n.weight / 8)),
      }
    })
  }, [data.nodes])

  const nodeMap = new Map(layout.map(n => [n.id, n]))

  return (
    <>
      <Card title="Rede de co-citação — clusters jurisprudenciais" className="mb-5">
        <svg viewBox="0 0 700 320" className="block w-full">
          {/* Edges */}
          {data.edges.map(([a, b, w], i) => {
            const na = nodeMap.get(a)
            const nb = nodeMap.get(b)
            if (!na || !nb) return null
            return (
              <line
                key={i}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke="rgba(15,14,13,.1)" strokeWidth={w}
              />
            )
          })}
          {/* Nodes */}
          {layout.map(n => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.cor} opacity={0.9} />
              <text
                x={n.x} y={n.y}
                textAnchor="middle" dominantBaseline="central"
                fill="#f5f0e8" fontSize={9} fontFamily="'DM Mono', monospace"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Artigos &ldquo;ponte&rdquo; — presentes em múltiplos clusters">
          <BarList data={data.pontes} ramp="gold" nameWidth={140} />
        </Card>
        <Card title="Nós da rede">
          <div className="flex flex-col gap-1">
            {data.nodes.slice(0, 10).map(n => (
              <div key={n.id} className="flex items-center gap-2 text-[11px]">
                <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: n.cor }} />
                <span className="font-medium">{n.label}</span>
                <span className="ml-auto font-mono text-[9px] text-stone">{n.weight} vínculos</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

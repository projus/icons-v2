'use client'
import '@/components/cartografia/chart-setup'
import { Bar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import type { TemasData } from '../types'

const COLORS = ['#1a2744','#243058','#b8860b','#d4a017','#0d5c5c','#8b3a1a','#4a3080','#2d6a2d','#5c3a1a','#1a5c5c','#6b4226']
const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelTemas({ data }: { data: TemasData }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Decisões por bloco temático">
        <div className="relative h-[280px]">
          <Bar
            data={{
              labels: data.blocos.map(t => t[0]),
              datasets: [{ data: data.blocos.map(t => t[1]), backgroundColor: COLORS, borderRadius: 3 }],
            }}
            options={{
              indexAxis: 'y', responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
                y: { ticks: { font: { size: 10 }, color: tc } },
              },
            }}
          />
        </div>
      </Card>

      <Card title="Clusters jurisprudenciais — artigos co-citados">
        {data.clusters.map(c => (
          <div key={c.tema} className="flex items-center gap-2 border-b border-black/[.12] py-1.5 text-[11px] last:border-b-0">
            <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: c.cor }} />
            <span className="w-[165px] shrink-0 font-medium">{c.tema}</span>
            <div className="flex flex-wrap gap-1">
              {c.arts.map(a => (
                <span
                  key={a}
                  className="rounded border px-1.5 py-px font-mono text-[9px]"
                  style={{ background: c.cor + '18', color: c.cor, borderColor: c.cor + '44' }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

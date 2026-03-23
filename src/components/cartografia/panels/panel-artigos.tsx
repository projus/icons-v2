'use client'
import '@/components/cartografia/chart-setup'
import { Bar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { ArtigosData } from '../types'

const COLORS = ['#1a2744','#243058','#b8860b','#d4a017','#0d5c5c','#8b3a1a','#4a3080','#2d6a2d','#5c3a1a','#1a5c5c','#6b4226']
const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelArtigos({ data }: { data: ArtigosData }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Top 20 artigos — litigiosidade">
        <BarList data={data.top20} ramp="gold" nameWidth={160} />
      </Card>

      <Card title="Por bloco temático">
        <div className="relative h-[300px]">
          <Bar
            data={{
              labels: data.temas.map(t => t[0]),
              datasets: [{ data: data.temas.map(t => t[1]), backgroundColor: COLORS, borderRadius: 3 }],
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
    </div>
  )
}

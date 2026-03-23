'use client'
import '@/components/cartografia/chart-setup'
import { Line } from 'react-chartjs-2'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { RelatoresData } from '../types'

const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelRelatores({ data }: { data: RelatoresData }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Top 20 relatores — volume total">
        <BarList data={data.top20} ramp="teal" nameWidth={130} />
      </Card>

      <Card title="Curva de concentração decisória">
        <div className="relative h-[200px]">
          <Line
            data={{
              labels: data.top20.map(r => r[0].split(' ')[0]),
              datasets: [{
                data: data.cumulative,
                borderColor: '#1a2744', borderWidth: 2,
                pointBackgroundColor: '#b8860b', pointRadius: 3,
                fill: true, backgroundColor: 'rgba(26,39,68,.06)',
                tension: 0.3,
              }],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { font: { size: 8 }, color: tc, maxRotation: 45 } },
                y: { grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
              },
            }}
          />
        </div>
        <div className="mt-3 rounded border-l-[3px] border-gold bg-paper-dark/50 p-2 text-[10px] leading-[1.5] text-stone">
          Os 5 primeiros relatores respondem por ~28% do acervo. Os 10 primeiros por ~45%. Alta concentração histórica.
        </div>
      </Card>
    </div>
  )
}

'use client'
import '@/components/cartografia/chart-setup'
import { Bar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { TempoData } from '../types'

const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelTempo({ data }: { data: TempoData }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Tempo médio entre decisões por artigo (anos)">
        <div className="relative h-[270px]">
          <Bar
            data={{
              labels: data.intervalo.map(d => d[0]),
              datasets: [{
                data: data.intervalo.map(d => d[1]),
                backgroundColor: data.intervalo.map(d => d[1] < 2 ? '#1a2744' : d[1] < 4 ? '#3d679c' : '#b5c4d9'),
                borderRadius: 3,
              }],
            }}
            options={{
              indexAxis: 'y', responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => `${((c.parsed as unknown as {x:number}).x).toFixed(1)} anos entre decisões` } },
              },
              scales: {
                x: { title: { display: true, text: 'anos', font: { size: 9 }, color: tc }, grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
                y: { ticks: { font: { size: 9 }, color: tc } },
              },
            }}
          />
        </div>
      </Card>

      <Card title="Artigos mais revisitados — recorrência">
        <BarList data={data.recorrencia} ramp="teal" nameWidth={130} />
        <div className="mt-3 rounded border-l-[3px] border-gold bg-paper-dark/50 p-2 text-[10px] leading-[1.5] text-stone">
          Artigos com baixo tempo médio entre decisões = contencioso crônico, tema não pacificado. Artigos com alto intervalo = decisões pontuais, tema estabilizado.
        </div>
      </Card>
    </div>
  )
}

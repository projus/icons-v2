'use client'
import '@/components/cartografia/chart-setup'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { ClassesData } from '../types'

const COLORS = ['#1a2744','#243058','#b8860b','#d4a017','#0d5c5c','#8b3a1a','#4a3080','#2d6a2d','#5c3a1a','#1a5c5c','#6b4226','#2d4a6b','#444','#666','#888']
const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelClasses({ data }: { data: ClassesData }) {
  const total = data.distribution.reduce((s, c) => s + c[1], 0)

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 mb-5">
        <Card title="Proporção por classe processual">
          <div className="relative h-[230px]">
            <Doughnut
              data={{
                labels: data.distribution.map(c => c[0]),
                datasets: [{
                  data: data.distribution.map(c => c[1]),
                  backgroundColor: COLORS,
                  borderWidth: 2, borderColor: '#f5f0e8',
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 12 } },
                  tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed.toLocaleString('pt-BR')} (${((c.parsed / total) * 100).toFixed(1)}%)` } },
                },
              }}
            />
          </div>
        </Card>

        <Card title="Volume absoluto">
          <BarList data={data.distribution} ramp="navy" nameWidth={55} />
        </Card>
      </div>

      <Card title="Evolução das principais classes por período">
        <div className="relative h-[160px]">
          <Bar
            data={{
              labels: data.evolution.map(e => e.period),
              datasets: Object.keys(data.evolution[0]?.data || {}).map((cls, i) => ({
                label: cls,
                data: data.evolution.map(e => e.data[cls] || 0),
                backgroundColor: COLORS[i],
              })),
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, color: tc, boxWidth: 10 } } },
              scales: {
                x: { stacked: true, ticks: { font: { size: 9 }, color: tc } },
                y: { stacked: true, grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
              },
            }}
          />
        </div>
      </Card>
    </>
  )
}

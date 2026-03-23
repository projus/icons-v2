'use client'
import '@/components/cartografia/chart-setup'
import { Bubble } from 'react-chartjs-2'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { DecidibilidadeData } from '../types'

const COLORS = ['#1a2744','#243058','#b8860b','#d4a017','#0d5c5c','#8b3a1a','#4a3080','#2d6a2d']
const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelDecidibilidade({ data }: { data: DecidibilidadeData }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Matriz decidibilidade: volume × saturação × dispersão">
        <div className="relative h-[240px]">
          <Bubble
            data={{
              datasets: data.bubble.map((d, i) => ({
                label: d.cls,
                data: [{ x: d.volume, y: d.saturacao, r: Math.max(d.dispersao / 2.2, 4) }],
                backgroundColor: COLORS[i] + 'bb',
              })),
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { font: { size: 9 }, color: tc, boxWidth: 10 } },
                tooltip: { callbacks: { label: c => `${c.dataset.label}: ${(c.parsed as unknown as {x:number;y:number}).x.toLocaleString()} dec. · sat. ${(c.parsed as unknown as {x:number;y:number}).y}%` } },
              },
              scales: {
                x: { title: { display: true, text: 'Volume', font: { size: 9 }, color: tc }, grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
                y: { title: { display: true, text: 'Saturação (%)', font: { size: 9 }, color: tc }, grid: { color: gc }, ticks: { font: { size: 9 }, color: tc }, min: 0, max: 100 },
              },
            }}
          />
        </div>
        <div className="mt-1 font-mono text-[9px] text-stone">
          Tamanho = nº de relatores distintos · X = volume · Y = saturação temática (%)
        </div>
      </Card>

      <Card title="Índice de decidibilidade (IDC) por classe">
        <BarList data={data.porClasse} ramp="navy" nameWidth={65} />
        <div className="mt-3 rounded border-l-[3px] border-gold bg-paper-dark/50 p-2 text-[10px] leading-[1.5] text-stone">
          IDC = (saturação × 0,4) + (volume_norm × 0,4) + (1/dispersão_norm × 0,2). Maior IDC = jurisprudência mais consolidada.
        </div>
      </Card>
    </div>
  )
}

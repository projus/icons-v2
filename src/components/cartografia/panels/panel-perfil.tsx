'use client'
import '@/components/cartografia/chart-setup'
import { useState } from 'react'
import { Radar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import { BarList } from '../ui/bar-list'
import type { PerfilData } from '../types'

const gc = 'rgba(15,14,13,.06)'
const tc = '#6b6355'

export default function PanelPerfil({ data }: { data: PerfilData }) {
  const relatorNames = Object.keys(data.relatores)
  const [selected, setSelected] = useState(relatorNames[0] || '')

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 mb-5">
        <Card title="Perfil decisório — especialização temática">
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="mb-2.5 rounded border border-black/[.22] bg-paper px-2 py-1 font-mono text-[10px] text-foreground"
          >
            {relatorNames.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative h-[240px]">
            {selected && data.relatores[selected] && (
              <Radar
                data={{
                  labels: data.radarLabels,
                  datasets: [{
                    label: selected,
                    data: data.relatores[selected],
                    backgroundColor: 'rgba(26,39,68,.1)',
                    borderColor: '#1a2744', borderWidth: 2,
                    pointBackgroundColor: '#b8860b', pointRadius: 4,
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    r: {
                      ticks: { font: { size: 8 }, color: tc, backdropColor: 'transparent' },
                      grid: { color: gc },
                      pointLabels: { font: { size: 10 }, color: tc },
                      min: 0, max: 100,
                    },
                  },
                }}
              />
            )}
          </div>
        </Card>

        <Card title="Índice de especialização temática (IET) — top 10">
          <BarList data={data.iet} ramp="navy" nameWidth={130} />
          <div className="mt-3 rounded border-l-[3px] border-gold bg-paper-dark/50 p-2 text-[10px] leading-[1.5] text-stone">
            IET = concentração das decisões do relator em um único bloco temático. Quanto maior, mais especializado.
          </div>
        </Card>
      </div>
    </>
  )
}

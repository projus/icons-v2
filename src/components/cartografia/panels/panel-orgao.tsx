'use client'
import '@/components/cartografia/chart-setup'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import type { OrgaoData } from '../types'

const ORGAO_COLORS = ['#1a2744', '#0d5c5c', '#b8860b', '#9b9186', '#4a3080', '#8b3a1a', '#2d6a2d', '#666']
const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelOrgao({ data }: { data: OrgaoData }) {
  const total = data.distribution.reduce((s, d) => s + d[1], 0)

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 mb-5">
        <Card title="Plenário vs. Turmas">
          <div className="relative h-[220px]">
            <Doughnut
              data={{
                labels: data.distribution.map(d => d[0]),
                datasets: [{
                  data: data.distribution.map(d => d[1]),
                  backgroundColor: ORGAO_COLORS, borderWidth: 2, borderColor: '#f5f0e8',
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

        <Card title="Distribuição por classe e órgão">
          <div className="relative h-[220px]">
            <Bar
              data={{
                labels: data.porClasse.map(d => d.classe),
                datasets: [
                  { label: 'Plenário', data: data.porClasse.map(d => d.P), backgroundColor: '#1a2744' },
                  { label: '1ª Turma', data: data.porClasse.map(d => d.T1), backgroundColor: '#0d5c5c' },
                  { label: '2ª Turma', data: data.porClasse.map(d => d.T2), backgroundColor: '#b8860b' },
                ],
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
      </div>
    </>
  )
}

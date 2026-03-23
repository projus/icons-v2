'use client'
import '@/components/cartografia/chart-setup'
import { Bar } from 'react-chartjs-2'
import { Card } from '../ui/card'
import type { TemporalData } from '../types'

const gc = 'rgba(15,14,13,.06)'
const tc = '#9b9186'

export default function PanelTemporal({ data }: { data: TemporalData }) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 mb-5">
        <Card title="Decisões por ano (1988–2026)">
          <div className="relative h-[220px]">
            <Bar
              data={{
                labels: data.yearly.map(d => String(d.year)),
                datasets: [{
                  data: data.yearly.map(d => d.count),
                  backgroundColor: data.yearly.map(d =>
                    d.count > 400 ? '#1a2744' : d.count > 200 ? '#3d679c' : '#b5c4d9'
                  ),
                  borderRadius: 2,
                  borderSkipped: false,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: false },
                  y: { grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
                },
              }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9px] text-stone">
            <span>1988</span><span>1995</span><span>2000</span><span>2005</span><span>2010</span><span>2015</span><span>2020</span><span>2026</span>
          </div>
        </Card>

        <Card title="Por década">
          <div className="relative h-[220px]">
            <Bar
              data={{
                labels: data.decades.map(d => d.label),
                datasets: [{
                  data: data.decades.map(d => d.count),
                  backgroundColor: ['#b5c4d9', '#3d679c', '#1a2744', '#b8860b'],
                  borderRadius: 4,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { font: { size: 10 }, color: tc } },
                  y: { grid: { color: gc }, ticks: { font: { size: 9 }, color: tc } },
                },
              }}
            />
          </div>
        </Card>
      </div>

      <Card title="Fases do contencioso constitucional">
        <div className="flex flex-col gap-2.5">
          {[
            { color: '#b5c4d9', title: '1988–1994 · Fase fundacional', desc: 'Baixo volume, jurisprudência formativa. Estabelecimento dos parâmetros constitucionais básicos.' },
            { color: '#7a96bc', title: '1995–2001 · Fase expansiva', desc: 'Crescimento acelerado pós-plano real e redemocratização plena. Consolidação da jurisdição constitucional.' },
            { color: '#3d679c', title: '2002–2011 · Fase de sobrecarga', desc: 'Pico em 2007–2008. Repercussão geral introduzida em 2007 pela EC 45/2004.' },
            { color: '#1a2744', title: '2012–2019 · Fase de seletividade', desc: 'Filtros processuais ativos. Pauta política e criminal cresce expressivamente.' },
            { color: '#b8860b', title: '2020–2026 · Fase democrática', desc: 'Pandemia, eleições, democracia e meio ambiente dominam a pauta. Retomada de volume.' },
          ].map(phase => (
            <div key={phase.title} className="flex items-start gap-2.5">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: phase.color }} />
              <div>
                <strong className="block text-[11px] font-medium">{phase.title}</strong>
                <span className="text-[10px] text-stone">{phase.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

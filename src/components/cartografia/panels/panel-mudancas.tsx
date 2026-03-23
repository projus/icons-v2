'use client'
import { Card } from '../ui/card'
import type { MudancasData } from '../types'

export default function PanelMudancas({ data }: { data: MudancasData }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Artigos com maior amplitude temporal">
        {data.artigos.map(m => (
          <div key={m.art} className="mb-2 rounded-r border-l-[3px] border-navy bg-paper-dark p-2.5">
            <div className="text-[11px] font-medium">{m.art}</div>
            <div className="mt-0.5 font-mono text-[9px] text-stone">{m.span} · {m.anos} anos · {m.dec} decisões</div>
          </div>
        ))}
      </Card>

      <Card title="Marcos de volume decisório">
        {data.marcos.map(m => (
          <div key={m.ano} className="mb-2 flex items-start gap-2 text-[11px]">
            <span className="inline-block shrink-0 rounded bg-navy px-1.5 py-0.5 font-mono text-[9px] font-medium text-gold-light">
              {m.ano}
            </span>
            <span className="leading-[1.4] text-stone">{m.desc}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

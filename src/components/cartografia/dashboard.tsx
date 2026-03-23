'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { CartografiaData } from './types'

const PANELS = [
  { id: 'temporal', label: '① Temporal' },
  { id: 'classes', label: '② Classes' },
  { id: 'relatores', label: '③ Relatores' },
  { id: 'artigos', label: '④ Artigos' },
  { id: 'calor', label: '⑤ Calor' },
  { id: 'mudancas', label: '⑥ Mudanças' },
  { id: 'orgao', label: '⑦ Órgão' },
  { id: 'temas', label: '⑧ Temas' },
  { id: 'decidib', label: '⑨ Decidibilidade' },
  { id: 'tempo', label: '⑩ Tempo' },
  { id: 'rede', label: '⑪ Rede' },
  { id: 'perfil', label: '⑫ Perfil' },
] as const

const PanelTemporal = dynamic(() => import('./panels/panel-temporal'))
const PanelClasses = dynamic(() => import('./panels/panel-classes'))
const PanelRelatores = dynamic(() => import('./panels/panel-relatores'))
const PanelArtigos = dynamic(() => import('./panels/panel-artigos'))
const PanelCalor = dynamic(() => import('./panels/panel-calor'))
const PanelMudancas = dynamic(() => import('./panels/panel-mudancas'))
const PanelOrgao = dynamic(() => import('./panels/panel-orgao'))
const PanelTemas = dynamic(() => import('./panels/panel-temas'))
const PanelDecidibilidade = dynamic(() => import('./panels/panel-decidibilidade'))
const PanelTempo = dynamic(() => import('./panels/panel-tempo'))
const PanelRede = dynamic(() => import('./panels/panel-rede'))
const PanelPerfil = dynamic(() => import('./panels/panel-perfil'))

export function Dashboard({ data }: { data: CartografiaData }) {
  const [active, setActive] = useState('temporal')

  return (
    <>
      {/* Eixos nav bar */}
      <div className="mb-5 flex flex-wrap items-center gap-1 rounded-md border border-black/[.12] bg-white p-2.5 shadow-[0_2px_24px_rgba(15,14,13,.08)]">
        <span className="mr-2 shrink-0 border-r border-black/[.12] pr-2 font-mono text-[9px] uppercase tracking-widest text-stone">
          Eixos analíticos
        </span>
        {PANELS.map(p => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={`whitespace-nowrap rounded px-2.5 py-1 font-mono text-[10px] tracking-wider border transition-all ${
              active === p.id
                ? 'bg-navy text-gold-light border-navy font-medium'
                : 'bg-paper text-stone border-black/[.12] hover:bg-paper-dark hover:text-foreground hover:border-black/[.22]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div key={active} className="animate-[fadeUp_.3s_ease_both]">
        {active === 'temporal' && <PanelTemporal data={data.temporal} />}
        {active === 'classes' && <PanelClasses data={data.classes} />}
        {active === 'relatores' && <PanelRelatores data={data.relatores} />}
        {active === 'artigos' && <PanelArtigos data={data.artigos} />}
        {active === 'calor' && <PanelCalor data={data.calor} />}
        {active === 'mudancas' && <PanelMudancas data={data.mudancas} />}
        {active === 'orgao' && <PanelOrgao data={data.orgao} />}
        {active === 'temas' && <PanelTemas data={data.temas} />}
        {active === 'decidib' && <PanelDecidibilidade data={data.decidibilidade} />}
        {active === 'tempo' && <PanelTempo data={data.tempo} />}
        {active === 'rede' && <PanelRede data={data.rede} />}
        {active === 'perfil' && <PanelPerfil data={data.perfil} />}
      </div>
    </>
  )
}

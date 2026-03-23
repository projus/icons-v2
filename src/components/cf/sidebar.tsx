'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Titulo {
  id: number
  numero_romano: string
  denominacao: string
  cor_hex: string
  capitulos: { id: number; numero_romano: string; denominacao: string }[]
}

export function Sidebar({ titulos, tituloAtivo }: { titulos: Titulo[]; tituloAtivo?: number }) {
  const [expandido, setExpandido] = useState<number | null>(tituloAtivo ?? null)

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-y-auto border-r border-paper-dark/60 bg-white">
      <div className="border-b border-paper-dark/60 px-5 py-4">
        <h2 className="font-serif text-[13px] font-bold text-navy">Constituição Federal</h2>
        <p className="font-mono text-[9px] tracking-wider text-stone-light">CF/88 · Topografia</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {titulos.map((t) => (
          <div key={t.id}>
            <button
              onClick={() => setExpandido(expandido === t.id ? null : t.id)}
              className={`flex w-full items-center gap-2.5 px-5 py-2.5 text-left transition-colors hover:bg-paper/60 ${expandido === t.id ? 'bg-paper/40' : ''}`}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: t.cor_hex }}
              />
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[9px] tracking-wider text-stone-light">
                  Título {t.numero_romano}
                </span>
                <p className="truncate text-[12px] font-medium leading-snug text-navy">
                  {t.denominacao}
                </p>
              </div>
              <svg
                className={`h-3 w-3 shrink-0 text-stone-light/50 transition-transform ${expandido === t.id ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {expandido === t.id && t.capitulos.length > 0 && (
              <div className="ml-[30px] border-l border-paper-dark/50 pb-1">
                {t.capitulos.map((c) => (
                  <Link
                    key={c.id}
                    href={`/constituicao?titulo=${t.id}&capitulo=${c.id}`}
                    className="block px-4 py-[7px] text-[11px] text-stone transition-colors hover:bg-paper/40 hover:text-navy"
                  >
                    <span className="font-mono text-[9px] text-stone-light">
                      Cap. {c.numero_romano}
                    </span>
                    <span className="ml-1.5">{c.denominacao}</span>
                  </Link>
                ))}
              </div>
            )}

            {expandido === t.id && t.capitulos.length === 0 && (
              <div className="ml-[30px] border-l border-paper-dark/50 px-4 py-[7px]">
                <Link
                  href={`/constituicao?titulo=${t.id}`}
                  className="text-[11px] text-stone hover:text-navy"
                >
                  Ver artigos
                </Link>
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

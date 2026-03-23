import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const TIPO_BLOCO_LABEL: Record<string, { label: string; cor: string }> = {
  concentrado: { label: 'Controle Concentrado', cor: 'bg-red-800' },
  repercussao_geral: { label: 'Repercussão Geral', cor: 'bg-blue-800' },
  correlato: { label: 'Julgados Correlatos', cor: 'bg-stone-600' },
  sumula: { label: 'Súmulas', cor: 'bg-amber-700' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArtigoPage({ params }: Props) {
  const { id } = await params
  const artigoId = parseInt(id)

  // Carregar artigo
  const { data: artigo } = await supabase
    .from('cf_artigos')
    .select('*, cf_titulos(numero_romano, denominacao, cor_hex)')
    .eq('id', artigoId)
    .single()

  if (!artigo) notFound()

  // Carregar parágrafos, incisos, alíneas
  const [{ data: paragrafos }, { data: incisos }] = await Promise.all([
    supabase
      .from('cf_paragrafos')
      .select('id, tipo, numero_texto, texto, ordem')
      .eq('artigo_id', artigoId)
      .order('ordem'),
    supabase
      .from('cf_incisos')
      .select('id, paragrafo_id, numero_romano, texto, ordem')
      .eq('artigo_id', artigoId)
      .order('ordem'),
  ])

  // Alíneas dos incisos deste artigo
  const incisoIds = (incisos ?? []).map((i) => i.id)
  const { data: alineas } = incisoIds.length
    ? await supabase
        .from('cf_alineas')
        .select('id, inciso_id, letra, texto, ordem')
        .in('inciso_id', incisoIds)
        .order('ordem')
    : { data: [] }

  // Vínculos com decisões
  const { data: vinculos } = await supabase
    .from('cf_vinculos')
    .select('id, tipo_bloco, texto_contexto, ordem, stf_decisoes(id, classe, numero, classe_numero, relator, data_julgamento, orgao_julgador, ementa, integra_url, tipo_decisao)')
    .eq('artigo_id', artigoId)
    .order('ordem')

  // Agrupar vínculos por tipo_bloco
  const vinculosPorBloco = new Map<string, typeof vinculos>()
  for (const v of vinculos ?? []) {
    const key = v.tipo_bloco
    if (!vinculosPorBloco.has(key)) vinculosPorBloco.set(key, [])
    vinculosPorBloco.get(key)!.push(v)
  }

  const titulo = artigo.cf_titulos as { numero_romano: string; denominacao: string; cor_hex: string } | null

  // Incisos do caput (sem paragrafo_id)
  const incisosCaput = (incisos ?? []).filter((i) => !i.paragrafo_id)
  // Agrupar incisos por parágrafo
  type Inciso = NonNullable<typeof incisos>[number]
  const incisosPorParagrafo = new Map<number, Inciso[]>()
  for (const i of (incisos ?? []).filter((i) => i.paragrafo_id)) {
    if (!incisosPorParagrafo.has(i.paragrafo_id!)) incisosPorParagrafo.set(i.paragrafo_id!, [])
    incisosPorParagrafo.get(i.paragrafo_id!)!.push(i)
  }

  // Agrupar alíneas por inciso
  type Alinea = NonNullable<typeof alineas>[number]
  const alineasPorInciso = new Map<number, Alinea[]>()
  for (const a of alineas ?? []) {
    if (!alineasPorInciso.has(a.inciso_id)) alineasPorInciso.set(a.inciso_id, [])
    alineasPorInciso.get(a.inciso_id)!.push(a)
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 font-mono text-[10px] tracking-wider text-stone-light">
        <Link href="/constituicao" className="transition-colors hover:text-navy">CF/88</Link>
        <span className="text-stone-light/40">/</span>
        {titulo && (
          <>
            <Link
              href={`/constituicao?titulo=${artigo.titulo_id}`}
              className="transition-colors hover:text-navy"
            >
              Título {titulo.numero_romano}
            </Link>
            <span className="text-stone-light/40">/</span>
          </>
        )}
        <span className="text-navy">Art. {artigo.numero_texto}</span>
      </div>

      {/* Título do artigo */}
      <div className="mb-10 flex items-start gap-3">
        {titulo && (
          <div
            className="mt-1.5 h-[14px] w-[14px] shrink-0 rounded-[3px]"
            style={{ backgroundColor: titulo.cor_hex }}
          />
        )}
        <div>
          <h1 className="font-serif text-[26px] font-bold text-navy">
            Art. {artigo.numero_texto}
          </h1>
          {titulo && (
            <p className="mt-0.5 text-[13px] text-stone">
              {titulo.denominacao}
            </p>
          )}
        </div>
        <div className="ml-auto flex shrink-0 flex-col items-center rounded-md bg-navy/[.04] px-4 py-2">
          <span className="font-mono text-[24px] font-bold leading-none text-navy">
            {vinculos?.length || 0}
          </span>
          <span className="mt-1 font-mono text-[8px] uppercase tracking-wider text-stone-light">decidibilidade</span>
        </div>
      </div>

      {/* Texto constitucional */}
      <section className="mb-12 rounded-xl border border-paper-dark/70 bg-white p-7 shadow-[0_2px_12px_rgba(15,14,13,.03)]">
        {/* Caput */}
        <p className="text-sm leading-relaxed text-navy">
          <span className="font-mono text-xs font-bold text-gold">CAPUT</span>
          <br />
          {artigo.caput}
        </p>

        {/* Incisos do caput */}
        {incisosCaput.length > 0 && (
          <div className="mt-4 space-y-1.5 pl-4 border-l-2 border-paper-dark">
            {incisosCaput.map((inc) => (
              <div key={inc.id}>
                <p className="text-sm text-navy">
                  <span className="font-mono text-xs text-stone">{inc.numero_romano} – </span>
                  {inc.texto}
                </p>
                {/* Alíneas */}
                {alineasPorInciso.has(inc.id) && (
                  <div className="mt-1 space-y-0.5 pl-4">
                    {alineasPorInciso.get(inc.id)!.map((al) => (
                      <p key={al.id} className="text-sm text-stone">
                        <span className="font-mono text-xs">{al.letra})</span> {al.texto}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Parágrafos */}
        {(paragrafos ?? []).map((par) => (
          <div key={par.id} className="mt-4">
            <p className="text-sm leading-relaxed text-navy">
              <span className="font-mono text-xs font-bold text-gold">
                § {par.numero_texto}
              </span>
              <br />
              {par.texto}
            </p>
            {/* Incisos do parágrafo */}
            {incisosPorParagrafo.has(par.id) && (
              <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-paper-dark">
                {incisosPorParagrafo.get(par.id)!.map((inc) => (
                  <div key={inc.id}>
                    <p className="text-sm text-navy">
                      <span className="font-mono text-xs text-stone">{inc.numero_romano} – </span>
                      {inc.texto}
                    </p>
                    {alineasPorInciso.has(inc.id) && (
                      <div className="mt-1 space-y-0.5 pl-4">
                        {alineasPorInciso.get(inc.id)!.map((al) => (
                          <p key={al.id} className="text-sm text-stone">
                            <span className="font-mono text-xs">{al.letra})</span> {al.texto}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Decisões por bloco */}
      {['concentrado', 'repercussao_geral', 'correlato', 'sumula'].map((bloco) => {
        const lista = vinculosPorBloco.get(bloco)
        if (!lista?.length) return null
        const meta = TIPO_BLOCO_LABEL[bloco]

        return (
          <section key={bloco} className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${meta.cor}`} />
              <h2 className="font-serif text-lg font-bold text-navy">{meta.label}</h2>
              <span className="font-mono text-xs text-stone-light">({lista.length})</span>
            </div>

            <div className="space-y-3">
              {lista.map((v) => {
                const raw = v.stf_decisoes as unknown
                const d = (Array.isArray(raw) ? raw[0] : raw) as {
                  id: number; classe: string; numero: string; classe_numero: string;
                  relator: string | null; data_julgamento: string | null;
                  orgao_julgador: string | null; ementa: string | null;
                  integra_url: string | null; tipo_decisao: string | null;
                } | null
                if (!d) return null

                return (
                  <div
                    key={v.id}
                    className="rounded-lg border border-paper-dark bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-sm font-bold text-navy">
                          {d.classe_numero}
                        </span>
                        {d.relator && (
                          <span className="ml-2 text-xs text-stone">
                            Rel. Min. {d.relator}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-stone-light">
                        {d.orgao_julgador && (
                          <span className="rounded bg-navy/5 px-1.5 py-0.5">
                            {d.orgao_julgador}
                          </span>
                        )}
                        {d.tipo_decisao && (
                          <span className="rounded bg-navy/5 px-1.5 py-0.5">
                            {d.tipo_decisao}
                          </span>
                        )}
                        {d.data_julgamento && (
                          <span>{new Date(d.data_julgamento).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>

                    {/* Contexto do vínculo ou ementa */}
                    {(v.texto_contexto || d.ementa) && (
                      <p className="mt-2 text-xs leading-relaxed text-stone">
                        {(v.texto_contexto || d.ementa || '').substring(0, 400)}
                        {(v.texto_contexto || d.ementa || '').length > 400 ? '...' : ''}
                      </p>
                    )}

                    {d.integra_url && (
                      <a
                        href={d.integra_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block font-mono text-[10px] text-teal hover:underline"
                      >
                        Inteiro teor →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {(!vinculos || vinculos.length === 0) && (
        <p className="text-sm text-stone">
          Nenhuma decisão vinculada a este dispositivo.
        </p>
      )}
    </div>
  )
}

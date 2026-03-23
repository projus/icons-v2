import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/cf/sidebar'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ titulo?: string; capitulo?: string }>
}

export default async function ConstituicaoPage({ searchParams }: Props) {
  const params = await searchParams
  const tituloId = params.titulo ? parseInt(params.titulo) : null
  const capituloId = params.capitulo ? parseInt(params.capitulo) : null

  // Carregar títulos + capítulos para sidebar
  const { data: titulos } = await supabase
    .from('cf_titulos')
    .select('id, numero_romano, denominacao, cor_hex, ordem')
    .order('ordem')

  const { data: capitulos } = await supabase
    .from('cf_capitulos')
    .select('id, titulo_id, numero_romano, denominacao, ordem')
    .order('ordem')

  // Montar hierarquia para sidebar
  const titulosComCaps = (titulos ?? []).map((t) => ({
    ...t,
    capitulos: (capitulos ?? []).filter((c) => c.titulo_id === t.id),
  }))

  // Carregar artigos filtrados
  let artigosQuery = supabase
    .from('cf_artigos')
    .select('id, numero, numero_texto, caput, tipo, titulo_id, capitulo_id')
    .eq('tipo', 'CF')
    .order('ordem')

  if (capituloId) {
    artigosQuery = artigosQuery.eq('capitulo_id', capituloId)
  } else if (tituloId) {
    artigosQuery = artigosQuery.eq('titulo_id', tituloId)
  } else {
    artigosQuery = artigosQuery.limit(20)
  }

  const { data: artigos } = await artigosQuery

  // Buscar contagem de vínculos por artigo
  const artigoIds = (artigos ?? []).map((a) => a.id)
  const { data: vinculos } = artigoIds.length
    ? await supabase
        .from('cf_vinculos')
        .select('artigo_id')
        .in('artigo_id', artigoIds)
    : { data: [] }

  const vinculoCount = new Map<number, number>()
  for (const v of vinculos ?? []) {
    vinculoCount.set(v.artigo_id, (vinculoCount.get(v.artigo_id) || 0) + 1)
  }

  // Título ativo
  const tituloAtivo = titulosComCaps.find((t) => t.id === tituloId)

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <Sidebar titulos={titulosComCaps} tituloAtivo={tituloId ?? undefined} />

      <div className="flex-1 overflow-y-auto bg-paper px-8 py-8">
        {/* Header do conteúdo */}
        {tituloAtivo ? (
          <div className="mb-8 flex items-center gap-3">
            <div
              className="h-[14px] w-[14px] rounded-[3px]"
              style={{ backgroundColor: tituloAtivo.cor_hex }}
            />
            <div>
              <span className="font-mono text-[10px] tracking-wider text-stone-light">
                Título {tituloAtivo.numero_romano}
              </span>
              <h1 className="font-serif text-xl font-bold text-navy">
                {tituloAtivo.denominacao}
              </h1>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="font-serif text-xl font-bold text-navy">
              Constituição Federal de 1988
            </h1>
            <p className="mt-1 text-[13px] text-stone">
              Selecione um Título na barra lateral para navegar.
              Exibindo os primeiros 20 artigos.
            </p>
          </div>
        )}

        {/* Lista de artigos */}
        <div className="space-y-3">
          {(artigos ?? []).map((art) => {
            const count = vinculoCount.get(art.id) || 0
            return (
              <Link
                key={art.id}
                href={`/constituicao/${art.id}`}
                className="group block rounded-lg border border-paper-dark/70 bg-white p-5 transition-all hover:-translate-y-[2px] hover:border-gold/20 hover:shadow-[0_8px_30px_rgba(15,14,13,.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[11px] font-medium text-gold">
                      Art. {art.numero_texto}
                    </span>
                    <p className="mt-1.5 text-[13px] leading-[1.7] text-navy">
                      {art.caput.length > 300
                        ? art.caput.substring(0, 300) + '...'
                        : art.caput}
                    </p>
                  </div>

                  {count > 0 && (
                    <div className="flex shrink-0 flex-col items-center rounded-md bg-navy/[.04] px-3 py-1.5">
                      <span className="font-mono text-[18px] font-bold leading-none text-navy">
                        {count}
                      </span>
                      <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-stone-light">
                        {count === 1 ? 'decisão' : 'decisões'}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

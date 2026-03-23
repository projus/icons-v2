import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Dashboard } from '@/components/cartografia/dashboard'
import { MetricCard } from '@/components/cartografia/ui/card'
import {
  aggregateTemporal, aggregateClasses, aggregateRelatores, aggregateArtigos,
  aggregateCalor, aggregateMudancas, aggregateOrgao, aggregateTemas,
  aggregateDecidibilidade, aggregateTempo, aggregateRede, aggregatePerfil,
  aggregateMetrics,
} from '@/lib/cartografia-queries'

export const metadata = {
  title: 'Cartografia do Contencioso Constitucional · ICONS · STF 1988–2026',
}

export default async function CartografiaPage() {
  // Fetch all raw data in parallel
  const [
    { data: decisoes },
    { data: vinculos },
    { data: artigos },
    { data: titulos },
  ] = await Promise.all([
    supabase
      .from('stf_decisoes')
      .select('id, classe, relator, data_julgamento, orgao_julgador')
      .range(0, 9999),
    supabase
      .from('cf_vinculos')
      .select('artigo_id, decisao_id, tipo_bloco')
      .range(0, 9999),
    supabase
      .from('cf_artigos')
      .select('id, numero, numero_texto, tipo, titulo_id'),
    supabase
      .from('cf_titulos')
      .select('id, denominacao, cor_hex')
      .order('ordem'),
  ])

  const d = decisoes || []
  const v = vinculos || []
  const a = artigos || []
  const t = titulos || []

  // Aggregate all data server-side
  const data = {
    temporal: aggregateTemporal(d),
    classes: aggregateClasses(d),
    relatores: aggregateRelatores(d),
    artigos: aggregateArtigos(v, a, t),
    calor: aggregateCalor(d),
    mudancas: aggregateMudancas(d, v, a),
    orgao: aggregateOrgao(d),
    temas: aggregateTemas(v, a, t),
    decidibilidade: aggregateDecidibilidade(d, v),
    tempo: aggregateTempo(d, v, a),
    rede: aggregateRede(v, a, t),
    perfil: aggregatePerfil(d, v, a, t),
    metrics: aggregateMetrics(d, v),
  }

  const m = data.metrics

  return (
    <div className="pt-[60px]">
      {/* Hero */}
      <section className="border-b border-gold/30 bg-navy px-8 pt-12 pb-10 text-paper">
        <div className="mx-auto grid max-w-[1400px] items-end gap-12 md:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[.15em] text-gold-light">
              ICONS · Instituto Constituição Aberta · Projeto Justiça Aberta
            </div>
            <h1 className="mb-4 font-serif text-[clamp(28px,4vw,48px)] font-black leading-[1.1]">
              Cartografia do<br /><span className="text-gold-light">Contencioso Constitucional</span>
            </h1>
            <p className="max-w-[560px] text-[13px] leading-[1.6] text-paper/65">
              Mapeamento jurisprudencial das decisões do Supremo Tribunal Federal desde a
              promulgação da Constituição Federal de 1988 até 2026.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 rounded border border-gold/40 px-3.5 py-1.5 font-mono text-[10px] text-gold-light transition-all hover:bg-gold/10"
            >
              ⤷ Voltar à página inicial
            </Link>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <div className="text-right">
              <div className="font-serif text-4xl font-black leading-none text-gold-light">
                {m.totalDecisoes.toLocaleString('pt-BR')}
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-paper/45">
                decisões mapeadas
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-4xl font-black leading-none text-gold-light">
                {m.totalArtigos}
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-paper/45">
                artigos comentados
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-4xl font-black leading-none text-gold-light">
                {m.totalRelatores}+
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-paper/45">
                relatores mapeados
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-[1400px] px-8 py-8">
        {/* Metric cards */}
        <div className="mb-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Decisões mapeadas"
            value={m.totalDecisoes.toLocaleString('pt-BR')}
            sub="1988–2026"
          />
          <MetricCard
            label="Artigos da CF/88"
            value={String(m.totalArtigos)}
            sub="com decisões"
          />
          <MetricCard
            label="Classes processuais"
            value={String(m.totalClasses)}
            sub={m.classeTop}
          />
          <MetricCard
            label="Relatores"
            value={`${m.totalRelatores}+`}
            sub="ministros e ex-ministros"
          />
        </div>

        {/* Dashboard with 12 panels */}
        <Dashboard data={data} />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gold/20 bg-navy px-8 py-6 text-center">
        <div className="font-mono text-[9px] tracking-wider text-paper/40">
          <strong className="text-gold-light">ICONS · Instituto Constituição Aberta</strong> · Projeto Justiça Aberta · Coord. Damares Medina<br />
          Dados extraídos da Constituição Federal Comentada pelas decisões do STF · {m.totalDecisoes.toLocaleString('pt-BR')} precedentes · 1988–2026
        </div>
      </footer>
    </div>
  )
}

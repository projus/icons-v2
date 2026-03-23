/**
 * scripts/download-decisoes.ts
 * Enriquece stf_decisoes com ementas e links do inteiro teor
 * via API do STF (jurisprudencia.stf.jus.br)
 *
 * v3 — busca em TODAS as bases (acordaos + monocraticas + decisoes + sumulas)
 * com sinonimo=true e plural=true igual ao site real do STF.
 * Súmulas usam endpoint dedicado.
 * Loop automático até zerar todas as pendentes.
 *
 * Execute: npx tsx --env-file=.env.local scripts/download-decisoes.ts
 */
import { chromium, type Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = parseInt(process.env.DOWNLOAD_LIMIT || '1000')
const DELAY_MS   = parseInt(process.env.DOWNLOAD_DELAY || '800')

const PRIORIDADE_CLASSES = [
  'ADI', 'RE', 'MS', 'ADPF', 'ARE', 'MI', 'AI', 'RMS',
  'ACO', 'Rcl', 'Pet', 'AO', 'ADO', 'AC', 'ADC',
  'AR', 'AP', 'INQ', 'PET', 'SL', 'STA', 'CR', 'CC', 'SE',
  'HC', 'RHC',
  'Súmula Vinculante', 'Súmula',
]

// ============================================================================
// NORMALIZAR ÓRGÃO JULGADOR
// ============================================================================
function normalizarOrgao(raw: string | null): string | null {
  if (!raw) return null
  const s = raw.trim().toLowerCase()
  if (s.includes('plenário') || s.includes('pleno') || s === 'tribunal pleno') return 'P'
  if (s.includes('primeira turma') || s.includes('1ª turma')) return '1T'
  if (s.includes('segunda turma') || s.includes('2ª turma')) return '2T'
  if (s.includes('monocrática') || s.includes('monocr')) return 'mono'
  return null
}

// ============================================================================
// LIMPAR NÚMERO PARA BUSCA
// ============================================================================
function limparQuery(classeNumero: string): string {
  return classeNumero
    .replace(/\./g, '')
    .replace(/\s+(AgR|ED|MC|RG|QO|TP|REF|MC-REF|MC-R|AgR-QO|AgR-ED|QO-RG|ED-ED|AgR-A)[\w-]*/gi, '')
    .trim()
}

// ============================================================================
// BUSCA EM TODAS AS BASES
// Replica: /pages/search?base=acordaos&sinonimo=true&plural=true&queryString=ADI+4650
// ============================================================================
async function buscarTodasBases(page: Page, classeNumero: string) {
  try {
    const query = limparQuery(classeNumero)
    const BASES = ['acordaos', 'monocraticas', 'decisoes', 'pautas']

    let melhorSource: any = null
    let melhorScore = -1
    const normalizado = query.replace(/\s+/g, ' ').toUpperCase()

    for (const base of BASES) {
      const result = await page.evaluate(
        async ({ base, query }: { base: string; query: string }) => {
          const body = {
            query: {
              bool: {
                must: [{
                  query_string: {
                    query,
                    default_operator: 'AND',
                    fields: [
                      'titulo.sinonimo^6', 'titulo.plural^6',
                      'processo_codigo_completo.sinonimo^5', 'processo_codigo_completo.plural^5',
                      'ementa_texto.sinonimo^3', 'ementa_texto.plural^3',
                    ],
                    type: 'cross_fields',
                    analyzer: 'legal_search_analyzer',
                    quote_analyzer: 'legal_index_analyzer',
                  },
                }],
              },
            },
            _source: [
              'titulo', 'processo_codigo_completo',
              'relator_processo_nome', 'julgamento_data', 'publicacao_data',
              'orgao_julgador', 'ementa_texto', 'inteiro_teor_url',
            ],
            size: 5,
            from: 0,
            post_filter: { bool: { must: [{ term: { base } }], should: [] } },
            sort: [{ _score: 'desc' }],
            track_total_hits: true,
          }
          try {
            const res = await fetch('/api/search/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            if (!res.ok) return null
            const data = await res.json()
            return data?.result?.hits?.hits || null
          } catch { return null }
        },
        { base, query }
      )

      if (!result?.length) continue

      for (const h of result) {
        const titulo = (h._source.titulo || h._source.processo_codigo_completo || '')
          .replace(/\./g, '').toUpperCase()
        const score = h._score || 0
        const exactMatch = titulo === normalizado || titulo.startsWith(normalizado)
        const finalScore = exactMatch ? score + 1000 : score

        if (finalScore > melhorScore) {
          melhorScore = finalScore
          melhorSource = h._source
        }
      }
    }

    if (!melhorSource) return null

    return {
      ementa:              melhorSource.ementa_texto || null,
      integra_url:         melhorSource.inteiro_teor_url || null,
      orgao_julgador_api:  melhorSource.orgao_julgador || null,
      relator_api:         melhorSource.relator_processo_nome || null,
      data_julgamento_api: melhorSource.julgamento_data || null,
      data_dje_api:        melhorSource.publicacao_data || null,
    }
  } catch { return null }
}

// ============================================================================
// BUSCA DEDICADA PARA SÚMULAS
// ============================================================================
async function buscarSumula(page: Page, classeNumero: string) {
  try {
    const isVinculante = classeNumero.toLowerCase().includes('vinculante')
    const numero = classeNumero.replace(/\D/g, '')
    const base = isVinculante ? 'sumulas_vinculantes' : 'sumulas'

    const result = await page.evaluate(
      async ({ base, numero }: { base: string; numero: string }) => {
        const body = {
          query: {
            bool: {
              must: [{
                query_string: {
                  query: numero,
                  fields: ['numero_verbete^10', 'enunciado_verbete^3'],
                  default_operator: 'AND',
                },
              }],
            },
          },
          _source: ['numero_verbete', 'enunciado_verbete', 'data_aprovacao', 'data_publicacao_dou'],
          size: 3,
          from: 0,
          post_filter: { bool: { must: [{ term: { base } }], should: [] } },
          sort: [{ _score: 'desc' }],
          track_total_hits: true,
        }
        try {
          const res = await fetch('/api/search/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (!res.ok) return null
          const data = await res.json()
          return data?.result?.hits?.hits || null
        } catch { return null }
      },
      { base, numero }
    )

    if (!result?.length) return null
    const source = result[0]._source

    return {
      ementa:              source.enunciado_verbete || null,
      integra_url:         null,
      orgao_julgador_api:  'P',
      relator_api:         null,
      data_julgamento_api: source.data_aprovacao || null,
      data_dje_api:        source.data_publicacao_dou || null,
    }
  } catch { return null }
}

// ============================================================================
// ROTEADOR — escolhe busca por tipo
// ============================================================================
async function buscarDecisao(page: Page, d: { classe: string; classe_numero: string }) {
  if (d.classe.startsWith('Súmula')) return buscarSumula(page, d.classe_numero)
  return buscarTodasBases(page, d.classe_numero)
}

// ============================================================================
// CARREGAR PRÓXIMO BATCH
// ============================================================================
async function carregarPendentes() {
  const skipClasses = (process.env.SKIP_CLASSES || '').split(',').filter(Boolean)
  const pendentes: { id: number; classe: string; numero: string; classe_numero: string }[] = []

  for (const cls of PRIORIDADE_CLASSES) {
    if (skipClasses.includes(cls)) continue
    if (pendentes.length >= BATCH_SIZE) break

    const { data, error } = await supabase
      .from('stf_decisoes')
      .select('id, classe, numero, classe_numero')
      .eq('downloaded', false)
      .eq('classe', cls)
      .order('id')
      .limit(BATCH_SIZE - pendentes.length)

    if (error) throw new Error('Erro ao carregar: ' + error.message)
    if (data?.length) pendentes.push(...data)
  }

  return pendentes
}

// ============================================================================
// PROCESSAR UM BATCH
// ============================================================================
async function processarBatch(
  page: Page,
  pendentes: { id: number; classe: string; numero: string; classe_numero: string }[],
  rodada: number
) {
  let encontradas = 0, naoEncontradas = 0, erros = 0
  const inicio = Date.now()

  for (let i = 0; i < pendentes.length; i++) {
    const d = pendentes[i]
    const elapsed = (Date.now() - inicio) / 1000
    const rate = i > 0 ? i / elapsed : 0
    const eta = rate > 0 ? Math.round((pendentes.length - i) / rate / 60) : '?'

    process.stdout.write(
      `\r  R${rodada} [${i+1}/${pendentes.length}] ${d.classe_numero.padEnd(28)} ` +
      `✓${encontradas} ✗${naoEncontradas} ETA:${eta}min   `
    )

    try {
      const resultado = await buscarDecisao(page, d)

      if (resultado?.ementa) {
        const orgao = normalizarOrgao(resultado.orgao_julgador_api)
        const update: Record<string, unknown> = {
          ementa:      resultado.ementa,
          integra_url: resultado.integra_url,
          downloaded:  true,
        }
        if (orgao) update.orgao_julgador = orgao
        if (resultado.relator_api && !d.classe.startsWith('Súmula')) update.relator = resultado.relator_api
        if (resultado.data_julgamento_api) update.data_julgamento = resultado.data_julgamento_api
        if (resultado.data_dje_api)        update.data_dje = resultado.data_dje_api

        const { error } = await supabase.from('stf_decisoes').update(update).eq('id', d.id)
        if (error) erros++
        else encontradas++
      } else {
        await supabase.from('stf_decisoes').update({ downloaded: true }).eq('id', d.id)
        naoEncontradas++
      }
    } catch { erros++ }

    if (i < pendentes.length - 1) await new Promise(r => setTimeout(r, DELAY_MS))
  }

  const duracao = Math.round((Date.now() - inicio) / 1000)
  console.log(`\n  ✅ R${rodada}: ${encontradas} ementas · ${naoEncontradas} não encontradas · ${erros} erros · ${duracao}s`)
  return { encontradas, naoEncontradas, erros }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('📥 Download ementas STF — v3 (todas as bases + súmulas)\n')

  const { count: totalInicial } = await supabase
    .from('stf_decisoes').select('id', { count: 'exact', head: true }).eq('downloaded', false)

  if (!totalInicial) { console.log('✅ Nada pendente!'); return }

  console.log(`Pendentes:  ${totalInicial}`)
  console.log(`Batch:      ${BATCH_SIZE} · Delay: ${DELAY_MS}ms`)
  console.log(`Bases:      acordaos + monocraticas + decisoes + pautas + sumulas\n`)

  // Browser abre UMA vez e fica aberto até o fim
  console.log('Abrindo browser...')
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  })
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })).newPage()

  // WAF challenge — resolve UMA vez
  console.log('Resolvendo WAF...')
  await page.goto(
    'https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&sinonimo=true&plural=true&page=1&pageSize=10&queryString=ADI+4650&sort=_score&sortBy=desc',
    { waitUntil: 'networkidle', timeout: 60000 }
  )
  await page.waitForTimeout(3000)
  console.log('✓ Pronto\n')

  let rodada = 1, totalEnc = 0, totalNao = 0, totalErr = 0

  while (true) {
    const pendentes = await carregarPendentes()
    if (!pendentes.length) { console.log('\n✅ CONCLUÍDO!'); break }

    const dist: Record<string, number> = {}
    for (const d of pendentes) dist[d.classe] = (dist[d.classe] || 0) + 1
    console.log(`\nRodada ${rodada} — ${pendentes.length} decisões`)
    console.log('  ' + Object.entries(dist).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([c,n])=>`${c}(${n})`).join(' · '))

    const { encontradas, naoEncontradas, erros } = await processarBatch(page, pendentes, rodada)
    totalEnc += encontradas; totalNao += naoEncontradas; totalErr += erros

    const { count: restantes } = await supabase
      .from('stf_decisoes').select('id', { count: 'exact', head: true }).eq('downloaded', false)

    console.log(`  Progresso: ${Math.round(((totalInicial-(restantes||0))/totalInicial)*100)}% · Restantes: ${restantes||0}`)
    if (!restantes) break

    rodada++
    await new Promise(r => setTimeout(r, 5000))
  }

  await browser.close()

  const { count: comEmenta } = await supabase
    .from('stf_decisoes').select('id', { count: 'exact', head: true }).not('ementa', 'is', null)

  console.log('\n' + '═'.repeat(50))
  console.log(`Rodadas:          ${rodada}`)
  console.log(`Ementas baixadas: ${totalEnc}`)
  console.log(`Não encontradas:  ${totalNao}`)
  console.log(`Erros:            ${totalErr}`)
  console.log(`Total com ementa: ${comEmenta}`)
  console.log('═'.repeat(50))
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message || err)
  process.exit(1)
})

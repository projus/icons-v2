/**
 * scripts/download-decisoes.ts
 * Enriquece stf_decisoes com ementas e links do inteiro teor
 * via API do STF (jurisprudencia.stf.jus.br/api/search/search)
 *
 * A API tem WAF que exige browser real — usa Playwright headed.
 * O browser abre uma vez, resolve o challenge, e depois faz as buscas via page.evaluate.
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

// Quantas decisões processar por execução (para não ficar horas)
const BATCH_LIMIT = parseInt(process.env.DOWNLOAD_LIMIT || '500')
// Delay entre requests (ms) para não sobrecarregar o STF
const DELAY_MS = parseInt(process.env.DOWNLOAD_DELAY || '1500')

// ============================================================================
// NORMALIZAR ÓRGÃO JULGADOR DO STF PARA NOSSO ENUM
// ============================================================================

function normalizarOrgao(raw: string | null): { orgao: string | null; tipo_decisao: string | null } {
  if (!raw) return { orgao: null, tipo_decisao: null }
  const s = raw.trim().toLowerCase()
  if (s.includes('plenário') || s.includes('pleno') || s === 'tribunal pleno') {
    return { orgao: 'P', tipo_decisao: 'colegiada' }
  }
  if (s.includes('primeira turma') || s.includes('1ª turma')) {
    return { orgao: '1T', tipo_decisao: 'colegiada' }
  }
  if (s.includes('segunda turma') || s.includes('2ª turma')) {
    return { orgao: '2T', tipo_decisao: 'colegiada' }
  }
  if (s.includes('monocrática') || s.includes('monocr')) {
    return { orgao: 'mono', tipo_decisao: 'monocratica' }
  }
  return { orgao: null, tipo_decisao: null }
}

// ============================================================================
// BUSCAR NA API DO STF VIA BROWSER
// ============================================================================

function buildElasticQuery(queryText: string, size: number = 3) {
  return {
    query: {
      function_score: {
        functions: [
          { exp: { julgamento_data: { origin: 'now', scale: '47450d', offset: '1095d', decay: 0.1 } } },
          { filter: { term: { 'orgao_julgador.keyword': 'Tribunal Pleno' } }, weight: 1.15 },
          { filter: { term: { is_repercussao_geral: true } }, weight: 1.1 },
        ],
        query: {
          bool: {
            filter: [{
              query_string: {
                default_operator: 'AND',
                fields: ['titulo.plural^6', 'processo_codigo_completo.plural', 'ementa_texto.plural^3'],
                query: queryText,
                type: 'cross_fields',
                analyzer: 'legal_search_analyzer',
                quote_analyzer: 'legal_index_analyzer',
              },
            }],
            must: [],
            should: [],
          },
        },
      },
    },
    _source: [
      'id', 'titulo', 'processo_codigo_completo', 'processo_numero',
      'processo_classe_processual_unificada_classe_sigla',
      'relator_processo_nome', 'relator_acordao_nome',
      'julgamento_data', 'publicacao_data', 'orgao_julgador',
      'julgamento_is_sessao_virtual', 'ementa_texto', 'inteiro_teor_url',
      'is_repercussao_geral', 'acompanhamento_processual_url',
    ],
    size,
    from: 0,
    post_filter: { bool: { must: [{ term: { base: 'acordaos' } }], should: [] } },
    sort: [{ _score: 'desc' }],
    track_total_hits: true,
  }
}

async function buscarNoSTF(page: Page, classeNumero: string): Promise<{
  ementa: string | null
  integra_url: string | null
  orgao_julgador_api: string | null
  relator_api: string | null
  data_julgamento_api: string | null
  data_dje_api: string | null
} | null> {
  try {
    // Remover pontos e sufixos processuais para busca
    // "RE 436.996 AgR" → "RE 436996", "ADPF 1.058 MC-R" → "ADPF 1058"
    const queryText = classeNumero
      .replace(/\./g, '')
      .replace(/\s+(AgR|ED|MC|RG|QO|TP|REF|MC-REF|MC-R|AgR-QO|AgR-ED|QO-QO|QO-RG|ED-ED|ED-A|AgR-A)[\w-]*/gi, '')
      .trim()
    const body = buildElasticQuery(queryText, 5)

    const result = await page.evaluate(async (reqBody: unknown) => {
      const res = await fetch('/api/search/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      })
      if (!res.ok) return null
      return res.json()
    }, body)

    if (!result?.result?.hits?.hits?.length) return null

    // Procurar o hit que melhor bate com nossa classe_numero
    const hits = result.result.hits.hits
    const normalizado = classeNumero.replace(/\./g, '').replace(/\s+/g, ' ').toUpperCase()
    let source = hits[0]._source

    for (const h of hits) {
      const titulo = (h._source.titulo || h._source.processo_codigo_completo || '').replace(/\./g, '').toUpperCase()
      if (titulo === normalizado || titulo.startsWith(normalizado)) {
        source = h._source
        break
      }
    }

    return {
      ementa: source.ementa_texto || null,
      integra_url: source.inteiro_teor_url || null,
      orgao_julgador_api: source.orgao_julgador || null,
      relator_api: source.relator_processo_nome || null,
      data_julgamento_api: source.julgamento_data || null,
      data_dje_api: source.publicacao_data || null,
    }
  } catch {
    return null
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('📥 Download de ementas do STF\n')

  // 1. Buscar decisões sem ementa
  console.log('Carregando decisões pendentes...')
  // Ordem de prioridade por ocorrência (mais pendentes primeiro)
  const PRIORIDADE_CLASSES = [
    'ADI', 'RE', 'MS', 'ADPF', 'ARE', 'MI', 'AI', 'RMS',
    'Súmula', 'ACO', 'Rcl', 'Súmula Vinculante', 'Pet', 'AO',
    'ADO', 'AC', 'ADC', 'HD', 'Ext', 'Inq', 'SS', 'RHD',
    'AR', 'AP', 'INQ', 'PET', 'SL', 'STA', 'CR', 'CC', 'SE', 'EP',
    // Por último (segredo de justiça frequente)
    'HC', 'RHC',
  ]

  const skipClasses = (process.env.SKIP_CLASSES || '').split(',').filter(Boolean)

  // Buscar pendentes por classe prioritária (evita limite de 1000 rows do Supabase)
  let todasPendentes: { id: number; classe: string; numero: string; classe_numero: string }[] = []
  let error: unknown = null

  for (const cls of PRIORIDADE_CLASSES) {
    if (skipClasses.includes(cls)) continue
    if (todasPendentes.length >= BATCH_LIMIT) break
    const { data, error: err } = await supabase
      .from('stf_decisoes')
      .select('id, classe, numero, classe_numero')
      .eq('downloaded', false)
      .eq('classe', cls)
      .order('id')
      .limit(BATCH_LIMIT - todasPendentes.length)
    if (err) { error = err; break }
    if (data?.length) todasPendentes.push(...data)
  }

  if (error) throw new Error('Erro ao carregar decisões: ' + (error as any).message)
  if (!todasPendentes?.length) {
    console.log('Nenhuma decisão pendente!')
    return
  }

  const pendentes = todasPendentes

  // Mostrar distribuição do batch
  const dist: Record<string, number> = {}
  for (const d of pendentes) dist[d.classe] = (dist[d.classe] || 0) + 1
  console.log('  Batch de', pendentes.length, 'decisões:')
  for (const [cls, n] of Object.entries(dist)) console.log('    ', cls, ':', n)

  console.log()

  // 2. Abrir browser (headed para contornar WAF)
  console.log('Abrindo browser...')
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  })
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await ctx.newPage()

  // Navegar uma vez para resolver WAF challenge
  console.log('Resolvendo WAF challenge...')
  await page.goto('https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&queryString=teste', {
    waitUntil: 'networkidle',
    timeout: 60000,
  })
  await page.waitForTimeout(3000)
  console.log('  ✓ Browser pronto\n')

  // 3. Processar cada decisão
  let encontradas = 0
  let naoEncontradas = 0
  let erros = 0

  for (let i = 0; i < pendentes.length; i++) {
    const d = pendentes[i]
    process.stdout.write(`\r  [${i + 1}/${pendentes.length}] ${d.classe_numero.padEnd(30)}`)

    try {
      const resultado = await buscarNoSTF(page, d.classe_numero)

      if (resultado?.ementa) {
        const { orgao, tipo_decisao } = normalizarOrgao(resultado.orgao_julgador_api)

        const update: Record<string, unknown> = {
          ementa: resultado.ementa,
          integra_url: resultado.integra_url,
          downloaded: true,
        }

        // Preencher campos nulos com dados da API (enriquecer, não sobrescrever)
        if (orgao) update.orgao_julgador = orgao
        if (tipo_decisao) update.tipo_decisao = tipo_decisao
        if (resultado.relator_api && !d.classe.startsWith('Súmula')) update.relator = resultado.relator_api
        if (resultado.data_julgamento_api) update.data_julgamento = resultado.data_julgamento_api
        if (resultado.data_dje_api) update.data_dje = resultado.data_dje_api

        const { error: errUp } = await supabase
          .from('stf_decisoes')
          .update(update)
          .eq('id', d.id)

        if (errUp) {
          erros++
        } else {
          encontradas++
        }
      } else {
        // Marcar como tentada para não reprocessar
        await supabase
          .from('stf_decisoes')
          .update({ downloaded: true })
          .eq('id', d.id)
        naoEncontradas++
      }
    } catch {
      erros++
    }

    // Rate limiting
    if (i < pendentes.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  await browser.close()

  console.log('\n\n✅ DOWNLOAD CONCLUÍDO!')
  console.log(`  Encontradas e atualizadas: ${encontradas}`)
  console.log(`  Não encontradas na API:    ${naoEncontradas}`)
  console.log(`  Erros:                     ${erros}`)
  console.log(`  Total processado:          ${pendentes.length}`)

  // Contar quantas ainda faltam
  const { count } = await supabase
    .from('stf_decisoes')
    .select('id', { count: 'exact', head: true })
    .eq('downloaded', false)
  console.log(`\n  Restantes sem ementa: ${count ?? '?'}`)
  if (count && count > 0) {
    console.log('  Execute novamente para continuar o download.')
  }
}

main().catch((err) => {
  console.error('\n❌ Erro:', err.message || err)
  process.exit(1)
})

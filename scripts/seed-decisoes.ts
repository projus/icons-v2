/**
 * scripts/seed-decisoes.ts
 * Lê constituição_comentada_stf.docx e popula stf_decisoes + cf_vinculos
 *
 * Padrão de citação no docx:
 *   [CLASSE NUMERO, rel. min. NOME, j. DD-MM-YYYY, ÓRGÃO, DJ/DJE de DD-MM-YYYY.]
 *   [Súmula Vinculante 56.]
 *   [Súmula 394.]
 *
 * Blocos no docx (marcadores de tipo):
 *   "Controle concentrado de constitucionalidade" → concentrado
 *   "Repercussão geral"                          → repercussao_geral
 *   "Julgados correlatos" / "Julgado correlato"   → correlato
 *   "Súmula Vinculante NN." (inline)             → sumula
 *
 * Regra central: cada vínculo dispositivo↔decisão = +1 no índice de decidibilidade
 *
 * Execute: npx tsx --env-file=.env.local scripts/seed-decisoes.ts
 */
import { createClient } from '@supabase/supabase-js'
import mammoth from 'mammoth'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const DOCX_PATH = 'C:/Users/medin/Desktop/infoprodutos/constituição comentada stf.docx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// TIPOS
// ============================================================================

interface DecisaoRaw {
  caso: string
  classe: string
  numero: string
  classe_numero: string
  relator: string | null
  redator_acordao: string | null
  data_julgamento: string | null
  data_dje: string | null
  orgao_julgador: string | null
  tipo_decisao: string | null
  tema_rg: string | null
  downloaded: boolean
}

interface VinculoRaw {
  artigo_numero: number
  artigo_tipo: string
  dispositivo_texto: string
  decisao_key: string // classe_numero como chave
  tipo_bloco: string
  texto_contexto: string
}

// ============================================================================
// NORMALIZAÇÃO DE ÓRGÃO JULGADOR
// ============================================================================

function normalizarOrgao(raw: string): { orgao: string | null; tipo_decisao: string | null } {
  const s = raw.trim()

  // Plenário
  if (/^P$/i.test(s) || /Plen/i.test(s)) {
    return { orgao: 'P', tipo_decisao: 'colegiada' }
  }
  // 1ª Turma (variantes: 1ªT, 1ºT, 1ª T, 1ª Turma)
  if (/1[ªº]\s*T/i.test(s)) {
    return { orgao: '1T', tipo_decisao: 'colegiada' }
  }
  // 2ª Turma
  if (/2[ªº]\s*T/i.test(s)) {
    return { orgao: '2T', tipo_decisao: 'colegiada' }
  }
  // Decisão monocrática
  if (/monoc/i.test(s) || /dec\.\s*monoc/i.test(s)) {
    return { orgao: 'mono', tipo_decisao: 'monocratica' }
  }

  return { orgao: null, tipo_decisao: null }
}

// ============================================================================
// PARSING DE DATA (formatos: DD-MM-YYYY, DD.MM.YYYY, 1º-7-2010)
// ============================================================================

function parsearData(raw: string | null): string | null {
  if (!raw) return null
  let s = raw.trim()
  // Substituir 1º por 1, 2º por 2, etc
  s = s.replace(/(\d+)º/g, '$1')
  // Normalizar separadores
  s = s.replace(/\./g, '-')
  // Formato esperado: DD-MM-YYYY
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!m) return null
  const dia = m[1].padStart(2, '0')
  const mes = m[2].padStart(2, '0')
  const ano = m[3]
  return `${ano}-${mes}-${dia}` // ISO format para o banco
}

// ============================================================================
// PARSING DE CITAÇÃO ENTRE COLCHETES
// ============================================================================

// Padrão: [CLASSE NUMERO, rel. min. NOME, j. DD-MM-YYYY, ÓRGÃO, DJ/DJE de DD-MM-YYYY.]
// Também: [Súmula Vinculante 56.]  [Súmula 394.]
// Também: [CLASSE NUMERO, rel. min. NOME, red. do ac. min. NOME2, j. DD-MM-YYYY, ...]
// Também pode ter: Tema NNN, com mérito pendente/julgado

const RE_CITACAO = /\[([^\]]+)\]/g

// Classes processuais do STF
const CLASSES_STF = [
  'ADI', 'ADPF', 'ADC', 'ADO',
  'RE', 'ARE',
  'HC', 'MS', 'MI', 'RHC', 'AP', 'ACO', 'AI',
  'Rcl', 'SS', 'IF', 'Pet', 'Ext', 'SL', 'Inq', 'AO', 'CC', 'SE', 'AC',
  'AgR', 'ED', 'QO', 'MC', 'TP',
]

function parsearCitacao(texto: string): DecisaoRaw | null {
  const s = texto.trim().replace(/\.$/, '')

  // ---- Súmulas ----
  const mSumula = s.match(/^Súmula\s+(Vinculante\s+)?(\d+)/)
  if (mSumula) {
    const tipo = mSumula[1] ? 'SV' : 'S'
    const num = mSumula[2]
    return {
      caso: s,
      classe: tipo === 'SV' ? 'Súmula Vinculante' : 'Súmula',
      numero: num,
      classe_numero: tipo === 'SV' ? `Súmula Vinculante ${num}` : `Súmula ${num}`,
      relator: null,
      redator_acordao: null,
      data_julgamento: null,
      data_dje: null,
      orgao_julgador: null,
      tipo_decisao: null,
      tema_rg: null,
      downloaded: false,
    }
  }

  // ---- Decisões regulares ----
  // Extrair classe e número no início
  // Ex: "ADI 4.650", "ARE 1.058.822 RG", "ADPF 395 e ADPF 444", "HC 73.454"
  const mClasse = s.match(/^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+([\d.]+(?:\s+(?:MC|AgR|ED|QO|RG|EDv|TP)(?:-[A-Z]+)?)*)/)
  if (!mClasse) return null

  const classe = mClasse[1].trim()
  const numeroCompleto = mClasse[2].trim()
  const numero = numeroCompleto.split(/\s/)[0] // só o número, sem sufixos
  const caso = `${classe} ${numeroCompleto}`
  const classe_numero = caso

  // Relator: "rel. min. NOME" ou "voto do(a) min. NOME"
  let relator: string | null = null
  const mRel = s.match(/(?:rel\.\s*min\.|voto\s+d[oa]\s*(?:rel\.\s*)?min\.)\s+([^,\]]+)/i)
  if (mRel) relator = mRel[1].trim()

  // Redator do acórdão: "red. do ac. min. NOME"
  let redator_acordao: string | null = null
  const mRed = s.match(/red\.\s*do\s*ac\.\s*min\.\s+([^,\]]+)/i)
  if (mRed) redator_acordao = mRed[1].trim()

  // Data de julgamento: "j. DD-MM-YYYY"
  let data_julgamento: string | null = null
  const mJulg = s.match(/j\.\s+([\d\-./º]+)/)
  if (mJulg) data_julgamento = parsearData(mJulg[1])

  // Órgão julgador: vem depois da data de julgamento, antes do DJ/DJE
  let orgao_julgador: string | null = null
  let tipo_decisao: string | null = null
  // Pegar o trecho entre "j. DATA," e "DJ/DJE/Informativo"
  const mOrgao = s.match(/j\.\s+[\d\-./º]+\s*,\s*([^,]+?)\s*,\s*(?:DJ|Informativo)/i)
  if (mOrgao) {
    const norm = normalizarOrgao(mOrgao[1])
    orgao_julgador = norm.orgao
    tipo_decisao = norm.tipo_decisao
  } else {
    // Fallback: tentar encontrar órgão solto no texto
    const mOrgFb = s.match(/,\s*(P|1[ªº]\s*T(?:urma)?|2[ªº]\s*T(?:urma)?|Plenário|dec\.\s*monoc[^,]*)\s*[,.\]]/i)
    if (mOrgFb) {
      const norm = normalizarOrgao(mOrgFb[1])
      orgao_julgador = norm.orgao
      tipo_decisao = norm.tipo_decisao
    }
  }

  // Data DJ/DJE: "DJ de DD-MM-YYYY" ou "DJE de DD-MM-YYYY"
  let data_dje: string | null = null
  const mDJ = s.match(/DJ[Ee]?\s+de\s+([\d\-./º]+)/i)
  if (mDJ) data_dje = parsearData(mDJ[1])

  // Tema de repercussão geral
  let tema_rg: string | null = null
  const mTema = s.match(/Tema\s+([\d.]+)/i)
  if (mTema) tema_rg = mTema[1].replace(/\./g, '')

  return {
    caso,
    classe,
    numero,
    classe_numero,
    relator,
    redator_acordao,
    data_julgamento,
    data_dje,
    orgao_julgador,
    tipo_decisao,
    tema_rg,
    downloaded: false,
  }
}

// ============================================================================
// IDENTIFICAR ARTIGO ATUAL A PARTIR DO TEXTO
// ============================================================================

// Padrões de artigo no docx:
// "Art. 1º ..." , "Art. 5º ...", "Art. 100. ...", "Art. 12. ..."
const RE_ARTIGO = /^Art\.\s+(\d+)[º.]?\s/

// Padrões de dispositivo (inciso, parágrafo, alínea)
const RE_INCISO = /^([IVXLCDM]+)\s*[-–—]\s/
const RE_PARAGRAFO = /^§\s*(\d+)[º.]?\s|^Parágrafo\s+único/i
const RE_ALINEA = /^([a-z])\)\s/

// ============================================================================
// IDENTIFICAR TIPO DE BLOCO
// ============================================================================

function identificarBloco(linha: string): string | null {
  const l = linha.trim()
  if (/^Controle concentrado/i.test(l)) return 'concentrado'
  if (/^Repercussão geral/i.test(l)) return 'repercussao_geral'
  if (/^Julgado[s]?\s+correlato/i.test(l)) return 'correlato'
  return null
}

// ============================================================================
// PROCESSAMENTO PRINCIPAL
// ============================================================================

async function processarDocx(): Promise<{ decisoes: Map<string, DecisaoRaw>; vinculos: VinculoRaw[] }> {
  console.log('Lendo docx...')
  const result = await mammoth.extractRawText({ path: DOCX_PATH })
  const lines = result.value.split('\n')
  console.log(`  ${lines.length} linhas extraídas\n`)

  const decisoesMap = new Map<string, DecisaoRaw>()
  const vinculos: VinculoRaw[] = []

  let artigoAtual: number | null = null
  let artigoTipo = 'CF'
  let dispositivoTexto = ''
  let blocoAtual = 'correlato' // default se não houver marcador
  let dentroDaADCT = false

  for (let i = 0; i < lines.length; i++) {
    const linha = lines[i].trim()
    if (!linha) continue

    // Detectar ADCT
    if (/^Ato das Disposições Constitucionais Transitórias/i.test(linha) ||
        /^ADCT/i.test(linha)) {
      dentroDaADCT = true
      artigoAtual = null
      continue
    }

    // Detectar artigo
    const mArt = linha.match(RE_ARTIGO)
    if (mArt) {
      artigoAtual = parseInt(mArt[1])
      artigoTipo = dentroDaADCT ? 'ADCT' : 'CF'
      dispositivoTexto = `Art. ${mArt[1]}`
      blocoAtual = 'correlato' // reset bloco a cada artigo
      continue
    }

    // Detectar tipo de bloco
    const bloco = identificarBloco(linha)
    if (bloco) {
      blocoAtual = bloco
      continue
    }

    // Detectar dispositivo específico (parágrafo, inciso, alínea) para contexto
    if (RE_PARAGRAFO.test(linha)) {
      const mP = linha.match(/^§\s*(\d+)/)
      dispositivoTexto = mP ? `Art. ${artigoAtual}, § ${mP[1]}` : `Art. ${artigoAtual}, § único`
    } else if (RE_INCISO.test(linha)) {
      const mI = linha.match(RE_INCISO)
      if (mI) dispositivoTexto = `Art. ${artigoAtual}, ${mI[1]}`
    } else if (RE_ALINEA.test(linha)) {
      const mA = linha.match(RE_ALINEA)
      if (mA) dispositivoTexto = `${dispositivoTexto}, ${mA[1]})`
    }

    // Extrair citações entre colchetes
    if (artigoAtual === null) continue

    let match
    RE_CITACAO.lastIndex = 0
    while ((match = RE_CITACAO.exec(linha)) !== null) {
      const citacaoTexto = match[1]
      const decisao = parsearCitacao(citacaoTexto)
      if (!decisao) continue

      // Deduplica decisões pelo classe_numero
      if (!decisoesMap.has(decisao.classe_numero)) {
        decisoesMap.set(decisao.classe_numero, decisao)
      } else {
        // Merge: preencher campos nulos com dados de outra citação da mesma decisão
        const existente = decisoesMap.get(decisao.classe_numero)!
        if (!existente.relator && decisao.relator) existente.relator = decisao.relator
        if (!existente.data_julgamento && decisao.data_julgamento) existente.data_julgamento = decisao.data_julgamento
        if (!existente.data_dje && decisao.data_dje) existente.data_dje = decisao.data_dje
        if (!existente.orgao_julgador && decisao.orgao_julgador) existente.orgao_julgador = decisao.orgao_julgador
        if (!existente.tipo_decisao && decisao.tipo_decisao) existente.tipo_decisao = decisao.tipo_decisao
        if (!existente.tema_rg && decisao.tema_rg) existente.tema_rg = decisao.tema_rg
      }

      // Determinar tipo_bloco: súmulas têm seu próprio tipo
      let tipoBloco = blocoAtual
      if (decisao.classe === 'Súmula Vinculante' || decisao.classe === 'Súmula') {
        tipoBloco = 'sumula'
      }
      // Repercussão geral pela presença de Tema
      if (decisao.tema_rg && tipoBloco === 'correlato') {
        tipoBloco = 'repercussao_geral'
      }

      // Extrair contexto: o texto da ementa que precede a citação (mesma linha)
      const idxCit = linha.indexOf(match[0])
      let contexto = ''
      if (idxCit > 0) {
        // Pegar o texto antes da citação nesta linha
        contexto = linha.substring(0, idxCit).trim()
      }
      // Se a linha é só a citação, pegar a linha anterior como contexto
      if (!contexto && i > 0) {
        const linhaAnt = lines[i - 1]?.trim()
        if (linhaAnt && !linhaAnt.startsWith('[') && !identificarBloco(linhaAnt) && !RE_ARTIGO.test(linhaAnt)) {
          contexto = linhaAnt.substring(0, 500)
        }
      }

      vinculos.push({
        artigo_numero: artigoAtual,
        artigo_tipo: artigoTipo,
        dispositivo_texto: dispositivoTexto,
        decisao_key: decisao.classe_numero,
        tipo_bloco: tipoBloco,
        texto_contexto: contexto || null as any,
      })
    }
  }

  return { decisoes: decisoesMap, vinculos }
}

// ============================================================================
// INSERÇÃO NO SUPABASE
// ============================================================================

async function insertBatch(table: string, rows: Record<string, unknown>[], batchSize = 200) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' })
    if (error) throw new Error(`${table} lote ${Math.floor(i / batchSize)}: ${error.message}`)
    process.stdout.write(`\r  ${table}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`)
  }
  console.log()
}

async function seed() {
  console.log('⚖️  Populando decisões do STF e vínculos\n')

  // 1. Processar docx
  const { decisoes, vinculos } = await processarDocx()
  console.log(`Decisões únicas encontradas: ${decisoes.size}`)
  console.log(`Vínculos (citações totais): ${vinculos.length}\n`)

  // 2. Limpar dados existentes
  console.log('Limpando dados anteriores...')
  await supabase.from('cf_vinculos').delete().neq('id', 0)
  await supabase.from('stf_decisoes').delete().neq('id', 0)
  console.log('  ✓\n')

  // 3. Buscar mapa de artigos do banco (numero+tipo → id)
  console.log('Carregando artigos do banco...')
  const { data: artigos, error: errArt } = await supabase
    .from('cf_artigos')
    .select('id, numero, tipo')
  if (errArt) throw new Error('Erro ao carregar artigos: ' + errArt.message)

  const artigoMap = new Map<string, number>()
  for (const a of artigos!) {
    artigoMap.set(`${a.numero}_${a.tipo}`, a.id)
  }
  console.log(`  ${artigoMap.size} artigos carregados\n`)

  // 4. Inserir decisões
  console.log('Inserindo decisões...')
  let decisaoId = 1
  const decisaoIdMap = new Map<string, number>() // classe_numero → id

  const decisoesRows: Record<string, unknown>[] = []
  for (const [key, d] of decisoes) {
    const id = decisaoId++
    decisaoIdMap.set(key, id)
    decisoesRows.push({
      id,
      caso: d.caso,
      classe: d.classe,
      numero: d.numero,
      classe_numero: d.classe_numero,
      relator: d.relator,
      data_julgamento: d.data_julgamento,
      data_dje: d.data_dje,
      orgao_julgador: d.orgao_julgador,
      tipo_decisao: d.tipo_decisao,
      tema_rg: d.tema_rg,
      downloaded: d.downloaded,
    })
  }
  await insertBatch('stf_decisoes', decisoesRows)

  // 5. Montar e inserir vínculos
  console.log('Inserindo vínculos...')
  let vinculoId = 1
  let ignorados = 0
  const vinculosRows: Record<string, unknown>[] = []

  for (const v of vinculos) {
    const artigoId = artigoMap.get(`${v.artigo_numero}_${v.artigo_tipo}`)
    const decisaoId = decisaoIdMap.get(v.decisao_key)

    if (!artigoId) {
      ignorados++
      continue
    }
    if (!decisaoId) {
      ignorados++
      continue
    }

    vinculosRows.push({
      id: vinculoId++,
      artigo_id: artigoId,
      decisao_id: decisaoId,
      tipo_bloco: v.tipo_bloco,
      status_jurisprudencial: 'nao_classificado',
      texto_contexto: v.texto_contexto,
      ordem: vinculoId - 1,
    })
  }
  await insertBatch('cf_vinculos', vinculosRows)

  // 6. Relatório
  console.log('\n✅ SEED CONCLUÍDO!')
  console.log(`  ${decisoesRows.length} decisões únicas`)
  console.log(`  ${vinculosRows.length} vínculos dispositivo↔decisão`)
  if (ignorados > 0) {
    console.log(`  ${ignorados} vínculos ignorados (artigo não encontrado no banco)`)
  }

  // Estatísticas por tipo de bloco
  const stats: Record<string, number> = {}
  for (const v of vinculosRows) {
    const tb = v.tipo_bloco as string
    stats[tb] = (stats[tb] || 0) + 1
  }
  console.log('\n  Vínculos por tipo:')
  for (const [tipo, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${tipo}: ${count}`)
  }
}

seed().catch((err) => {
  console.error('\n❌ Erro:', err.message || err)
  process.exit(1)
})

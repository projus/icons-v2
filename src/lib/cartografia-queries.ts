import type {
  TemporalData, ClassesData, RelatoresData, ArtigosData,
  CalorData, MudancasData, OrgaoData, TemasData,
  DecidibilidadeData, TempoData, RedeData, PerfilData, MetricsData,
} from '@/components/cartografia/types'

type Decisao = {
  id: number
  classe: string
  relator: string | null
  data_julgamento: string | null
  orgao_julgador: string | null
}

type Vinculo = {
  artigo_id: number
  decisao_id: number
  tipo_bloco: string
}

type Artigo = {
  id: number
  numero: number
  numero_texto: string
  tipo: string
  titulo_id: number | null
}

type Titulo = {
  id: number
  denominacao: string
  cor_hex: string
}

// ── Helpers ──

function countBy<T>(arr: T[], key: (item: T) => string | null): Record<string, number> {
  const m: Record<string, number> = {}
  for (const item of arr) {
    const k = key(item)
    if (k) m[k] = (m[k] || 0) + 1
  }
  return m
}

function topN(obj: Record<string, number>, n: number): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function yearFromDate(d: string | null): number | null {
  if (!d) return null
  const y = parseInt(d.substring(0, 4))
  return isNaN(y) ? null : y
}

function bucket5(year: number): string {
  if (year <= 1992) return '88–92'
  if (year <= 1997) return '93–97'
  if (year <= 2002) return '98–02'
  if (year <= 2007) return '03–07'
  if (year <= 2012) return '08–12'
  if (year <= 2017) return '13–17'
  if (year <= 2022) return '18–22'
  return '23–26'
}

function bucketDecade(year: number): string {
  if (year <= 1999) return '1988–99'
  if (year <= 2009) return '2000–09'
  if (year <= 2019) return '2010–19'
  return '2020–26'
}

function bucketEvol(year: number): string {
  if (year <= 1994) return '88–94'
  if (year <= 2001) return '95–01'
  if (year <= 2008) return '02–08'
  if (year <= 2015) return '09–15'
  return '16–26'
}

// ── 1. Temporal ──

export function aggregateTemporal(decisoes: Decisao[]): TemporalData {
  const byYear = countBy(decisoes, d => {
    const y = yearFromDate(d.data_julgamento)
    return y ? String(y) : null
  })

  const yearly = Object.entries(byYear)
    .map(([y, c]) => ({ year: parseInt(y), count: c }))
    .filter(d => d.year >= 1988 && d.year <= 2026)
    .sort((a, b) => a.year - b.year)

  const decMap: Record<string, number> = {}
  for (const { year, count } of yearly) {
    const b = bucketDecade(year)
    decMap[b] = (decMap[b] || 0) + count
  }
  const decadeOrder = ['1988–99', '2000–09', '2010–19', '2020–26']
  const decades = decadeOrder.map(label => ({ label, count: decMap[label] || 0 }))

  return { yearly, decades }
}

// ── 2. Classes ──

export function aggregateClasses(decisoes: Decisao[]): ClassesData {
  const dist = countBy(decisoes, d => d.classe)
  const distribution = topN(dist, 15)

  const periods = ['88–94', '95–01', '02–08', '09–15', '16–26']
  const topClasses = distribution.slice(0, 4).map(c => c[0])
  const evolution: ClassesData['evolution'] = periods.map(p => ({ period: p, data: {} as Record<string, number> }))

  for (const d of decisoes) {
    const y = yearFromDate(d.data_julgamento)
    if (!y || !topClasses.includes(d.classe)) continue
    const b = bucketEvol(y)
    const ev = evolution.find(e => e.period === b)
    if (ev) ev.data[d.classe] = (ev.data[d.classe] || 0) + 1
  }

  return { distribution, evolution }
}

// ── 3. Relatores ──

export function aggregateRelatores(decisoes: Decisao[]): RelatoresData {
  const dist = countBy(decisoes, d => d.relator)
  const top20 = topN(dist, 20)
  const cumulative: number[] = []
  let sum = 0
  for (const [, v] of top20) {
    sum += v
    cumulative.push(sum)
  }
  return { top20, cumulative }
}

// ── 4. Artigos ──

export function aggregateArtigos(
  vinculos: Vinculo[],
  artigos: Artigo[],
  titulos: Titulo[],
): ArtigosData {
  const artigoMap = new Map(artigos.map(a => [a.id, a]))
  const tituloMap = new Map(titulos.map(t => [t.id, t]))

  const countPerArtigo = countBy(vinculos, v => String(v.artigo_id))
  const top20Entries = topN(countPerArtigo, 20)
  const top20: [string, number][] = top20Entries.map(([aid, count]) => {
    const a = artigoMap.get(parseInt(aid))
    const label = a ? `Art. ${a.numero_texto}` : `Art. ${aid}`
    return [label, count]
  })

  // Temas by titulo
  const temaCount: Record<string, number> = {}
  for (const v of vinculos) {
    const a = artigoMap.get(v.artigo_id)
    if (!a?.titulo_id) continue
    const t = tituloMap.get(a.titulo_id)
    if (t) temaCount[t.denominacao] = (temaCount[t.denominacao] || 0) + 1
  }
  const temas = topN(temaCount, 11)

  return { top20, temas }
}

// ── 5. Calor (heatmap) ──

export function aggregateCalor(decisoes: Decisao[]): CalorData {
  const relatorCount = countBy(decisoes, d => d.relator)
  const topRelatores = topN(relatorCount, 15).map(r => r[0])
  const buckets = ['88–92', '93–97', '98–02', '03–07', '08–12', '13–17', '18–22', '23–26']

  const matrix: number[][] = topRelatores.map(() => buckets.map(() => 0))

  for (const d of decisoes) {
    if (!d.relator || !d.data_julgamento) continue
    const ri = topRelatores.indexOf(d.relator)
    if (ri === -1) continue
    const y = yearFromDate(d.data_julgamento)
    if (!y) continue
    const bi = buckets.indexOf(bucket5(y))
    if (bi !== -1) matrix[ri][bi]++
  }

  return { relatores: topRelatores, buckets, matrix }
}

// ── 6. Mudanças ──

export function aggregateMudancas(
  decisoes: Decisao[],
  vinculos: Vinculo[],
  artigos: Artigo[],
): MudancasData {
  const artigoMap = new Map(artigos.map(a => [a.id, a]))
  const decisaoYear = new Map<number, number>()
  for (const d of decisoes) {
    const y = yearFromDate(d.data_julgamento)
    if (y) decisaoYear.set(d.id, y)
  }

  // Per article: min/max year, count
  const artigoStats: Record<number, { min: number; max: number; count: number }> = {}
  for (const v of vinculos) {
    const y = decisaoYear.get(v.decisao_id)
    if (!y) continue
    const s = artigoStats[v.artigo_id] || { min: 9999, max: 0, count: 0 }
    s.min = Math.min(s.min, y)
    s.max = Math.max(s.max, y)
    s.count++
    artigoStats[v.artigo_id] = s
  }

  const artigosArr = Object.entries(artigoStats)
    .map(([aid, s]) => ({
      aid: parseInt(aid),
      span: s.max - s.min,
      min: s.min,
      max: s.max,
      count: s.count,
    }))
    .filter(a => a.span > 0 && a.count >= 20)
    .sort((a, b) => b.span - a.span || b.count - a.count)
    .slice(0, 10)

  const artigosList = artigosArr.map(a => {
    const art = artigoMap.get(a.aid)
    return {
      art: art ? `Art. ${art.numero_texto}` : `Art. ${a.aid}`,
      span: `${a.min}–${a.max}`,
      anos: a.span,
      dec: a.count,
    }
  })

  // Marcos: years with most decisions that have reversao/oscilacao status
  // For now derive from volume peaks
  const byYear = countBy(decisoes, d => {
    const y = yearFromDate(d.data_julgamento)
    return y ? String(y) : null
  })
  const peakYears = topN(byYear, 10)
    .filter(([y]) => parseInt(y) >= 1990)
    .slice(0, 7)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([ano, count]) => ({
      ano,
      desc: `${count} decisões mapeadas neste ano.`,
    }))

  return { artigos: artigosList, marcos: peakYears }
}

// ── 7. Órgão ──

export function aggregateOrgao(decisoes: Decisao[]): OrgaoData {
  const orgaoLabels: Record<string, string> = {
    P: 'Plenário', '1T': '1ª Turma', '2T': '2ª Turma',
    mono: 'Monocrática', PV: 'Plenário Virtual',
    '1TV': '1ª Turma Virtual', '2TV': '2ª Turma Virtual',
  }

  const dist = countBy(decisoes, d => d.orgao_julgador ? (orgaoLabels[d.orgao_julgador] || d.orgao_julgador) : 'Não ident.')
  const distribution = topN(dist, 8)

  // Cross with classe (top 6 classes)
  const topClasses = topN(countBy(decisoes, d => d.classe), 6).map(c => c[0])
  const porClasse = topClasses.map(classe => {
    const filtered = decisoes.filter(d => d.classe === classe)
    return {
      classe,
      P: filtered.filter(d => d.orgao_julgador === 'P' || d.orgao_julgador === 'PV').length,
      T1: filtered.filter(d => d.orgao_julgador === '1T' || d.orgao_julgador === '1TV').length,
      T2: filtered.filter(d => d.orgao_julgador === '2T' || d.orgao_julgador === '2TV').length,
    }
  })

  return { distribution, porClasse }
}

// ── 8. Temas ──

export function aggregateTemas(
  vinculos: Vinculo[],
  artigos: Artigo[],
  titulos: Titulo[],
): TemasData {
  const artigoMap = new Map(artigos.map(a => [a.id, a]))
  const tituloMap = new Map(titulos.map(t => [t.id, t]))

  const temaCount: Record<string, number> = {}
  for (const v of vinculos) {
    const a = artigoMap.get(v.artigo_id)
    if (!a?.titulo_id) continue
    const t = tituloMap.get(a.titulo_id)
    if (t) temaCount[t.denominacao] = (temaCount[t.denominacao] || 0) + 1
  }
  const blocos = topN(temaCount, 11)

  // Clusters from co-citation (simplified: group top articles by titulo)
  const tituloColors: Record<number, string> = {}
  for (const t of titulos) tituloColors[t.id] = t.cor_hex

  const artCountPerTitulo: Record<number, { arts: string[]; count: number }> = {}
  const vinculoCountPerArt = countBy(vinculos, v => String(v.artigo_id))
  const topArtigos = topN(vinculoCountPerArt, 40)

  for (const [aid] of topArtigos) {
    const a = artigoMap.get(parseInt(aid))
    if (!a?.titulo_id) continue
    const entry = artCountPerTitulo[a.titulo_id] || { arts: [], count: 0 }
    entry.arts.push(`Art. ${a.numero_texto}`)
    entry.count++
    artCountPerTitulo[a.titulo_id] = entry
  }

  const clusters = Object.entries(artCountPerTitulo)
    .filter(([, v]) => v.arts.length >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([tid, v]) => {
      const t = tituloMap.get(parseInt(tid))
      return {
        tema: t?.denominacao || 'Outro',
        arts: v.arts.slice(0, 4),
        cor: tituloColors[parseInt(tid)] || '#1a2744',
      }
    })

  return { blocos, clusters }
}

// ── 9. Decidibilidade ──

export function aggregateDecidibilidade(
  decisoes: Decisao[],
  vinculos: Vinculo[],
): DecidibilidadeData {
  const classeCount = countBy(decisoes, d => d.classe)
  const topClasses = topN(classeCount, 8).map(c => c[0])

  const totalArtigos = new Set(vinculos.map(v => v.artigo_id)).size

  const bubble = topClasses.map(cls => {
    const clsDecisoes = decisoes.filter(d => d.classe === cls)
    const volume = clsDecisoes.length
    const relatores = new Set(clsDecisoes.map(d => d.relator).filter(Boolean)).size
    const decIds = new Set(clsDecisoes.map(d => d.id))
    const artigosSet = new Set(vinculos.filter(v => decIds.has(v.decisao_id)).map(v => v.artigo_id))
    const saturacao = Math.round((artigosSet.size / Math.max(totalArtigos, 1)) * 100)
    return { cls, volume, saturacao, dispersao: relatores }
  })

  const maxVol = Math.max(...bubble.map(b => b.volume), 1)
  const maxDisp = Math.max(...bubble.map(b => b.dispersao), 1)
  const porClasse: [string, number][] = bubble.map(b => {
    const idc = Math.round(
      (b.saturacao * 0.4) + ((b.volume / maxVol) * 100 * 0.4) + ((1 - b.dispersao / maxDisp) * 100 * 0.2)
    )
    return [b.cls, idc] as [string, number]
  }).sort((a, b) => b[1] - a[1])

  return { porClasse, bubble }
}

// ── 10. Tempo ──

export function aggregateTempo(
  decisoes: Decisao[],
  vinculos: Vinculo[],
  artigos: Artigo[],
): TempoData {
  const artigoMap = new Map(artigos.map(a => [a.id, a]))
  const decisaoYear = new Map<number, number>()
  for (const d of decisoes) {
    const y = yearFromDate(d.data_julgamento)
    if (y) decisaoYear.set(d.id, y)
  }

  // Group years per article
  const artigoYears: Record<number, number[]> = {}
  for (const v of vinculos) {
    const y = decisaoYear.get(v.decisao_id)
    if (!y) continue
    if (!artigoYears[v.artigo_id]) artigoYears[v.artigo_id] = []
    artigoYears[v.artigo_id].push(y)
  }

  // Average interval between consecutive decisions
  const intervals: [string, number][] = []
  for (const [aid, years] of Object.entries(artigoYears)) {
    if (years.length < 5) continue
    const sorted = [...years].sort((a, b) => a - b)
    let totalGap = 0
    for (let i = 1; i < sorted.length; i++) totalGap += sorted[i] - sorted[i - 1]
    const avg = totalGap / (sorted.length - 1)
    const a = artigoMap.get(parseInt(aid))
    if (a) intervals.push([`Art. ${a.numero_texto}`, parseFloat(avg.toFixed(1))])
  }

  intervals.sort((a, b) => a[1] - b[1])
  const intervalo = intervals.slice(0, 15)

  // Recorrencia = top articles by count
  const vinculoCount = countBy(vinculos, v => String(v.artigo_id))
  const recorrencia: [string, number][] = topN(vinculoCount, 10).map(([aid, count]) => {
    const a = artigoMap.get(parseInt(aid))
    return [a ? `Art. ${a.numero_texto}` : `Art. ${aid}`, count]
  })

  return { intervalo, recorrencia }
}

// ── 11. Rede ──

export function aggregateRede(
  vinculos: Vinculo[],
  artigos: Artigo[],
  titulos: Titulo[],
): RedeData {
  const artigoMap = new Map(artigos.map(a => [a.id, a]))
  const tituloMap = new Map(titulos.map(t => [t.id, t]))

  // Top 30 articles by vinculo count
  const vinculoCount = countBy(vinculos, v => String(v.artigo_id))
  const topArts = topN(vinculoCount, 30).map(([aid]) => parseInt(aid))
  const topSet = new Set(topArts)

  // Group vinculos by decisao_id (only top articles)
  const decisionArticles: Record<number, number[]> = {}
  for (const v of vinculos) {
    if (!topSet.has(v.artigo_id)) continue
    if (!decisionArticles[v.decisao_id]) decisionArticles[v.decisao_id] = []
    decisionArticles[v.decisao_id].push(v.artigo_id)
  }

  // Co-citation pairs
  const pairCount: Record<string, number> = {}
  const nodeWeight: Record<number, number> = {}
  for (const arts of Object.values(decisionArticles)) {
    const unique = [...new Set(arts)]
    for (const a of unique) nodeWeight[a] = (nodeWeight[a] || 0) + 1
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = [Math.min(unique[i], unique[j]), Math.max(unique[i], unique[j])].join('-')
        pairCount[key] = (pairCount[key] || 0) + 1
      }
    }
  }

  // Top edges
  const topEdges = topN(pairCount, 15)
  const nodesInEdges = new Set<number>()
  const edges: [string, string, number][] = topEdges.map(([key, w]) => {
    const [a, b] = key.split('-').map(Number)
    nodesInEdges.add(a)
    nodesInEdges.add(b)
    return [String(a), String(b), w]
  })

  const nodes = [...nodesInEdges].map(aid => {
    const a = artigoMap.get(aid)
    const t = a?.titulo_id ? tituloMap.get(a.titulo_id) : null
    return {
      id: String(aid),
      label: a ? `Art. ${a.numero_texto}` : String(aid),
      weight: nodeWeight[aid] || 0,
      cor: t?.cor_hex || '#1a2744',
    }
  }).sort((a, b) => b.weight - a.weight)

  // Bridge articles (in most edges)
  const bridgeCount: Record<string, number> = {}
  for (const [a, b] of edges) {
    const na = nodes.find(n => n.id === a)
    const nb = nodes.find(n => n.id === b)
    if (na) bridgeCount[na.label] = (bridgeCount[na.label] || 0) + 1
    if (nb) bridgeCount[nb.label] = (bridgeCount[nb.label] || 0) + 1
  }
  const pontes = topN(bridgeCount, 6)

  return { nodes: nodes.slice(0, 12), edges, pontes }
}

// ── 12. Perfil ──

export function aggregatePerfil(
  decisoes: Decisao[],
  vinculos: Vinculo[],
  artigos: Artigo[],
  titulos: Titulo[],
): PerfilData {
  const artigoMap = new Map(artigos.map(a => [a.id, a]))
  const tituloMap = new Map(titulos.map(t => [t.id, t]))
  const tituloOrder = titulos.slice(0, 6).map(t => t.denominacao)

  // Decisao -> titulo mapping via vinculos
  const decisaoTitulos: Record<number, Set<string>> = {}
  for (const v of vinculos) {
    const a = artigoMap.get(v.artigo_id)
    if (!a?.titulo_id) continue
    const t = tituloMap.get(a.titulo_id)
    if (!t) continue
    if (!decisaoTitulos[v.decisao_id]) decisaoTitulos[v.decisao_id] = new Set()
    decisaoTitulos[v.decisao_id].add(t.denominacao)
  }

  // Top 10 relatores
  const relatorCount = countBy(decisoes, d => d.relator)
  const topRelatores = topN(relatorCount, 10).map(r => r[0])

  const relatores: Record<string, number[]> = {}
  const relatorThemeCounts: Record<string, Record<string, number>> = {}

  for (const d of decisoes) {
    if (!d.relator || !topRelatores.includes(d.relator)) continue
    const temas = decisaoTitulos[d.id]
    if (!temas) continue
    if (!relatorThemeCounts[d.relator]) relatorThemeCounts[d.relator] = {}
    for (const tema of temas) {
      relatorThemeCounts[d.relator][tema] = (relatorThemeCounts[d.relator][tema] || 0) + 1
    }
  }

  // Normalize to 0-100
  for (const rel of topRelatores) {
    const counts = relatorThemeCounts[rel] || {}
    const maxC = Math.max(...Object.values(counts), 1)
    relatores[rel] = tituloOrder.map(t => Math.round(((counts[t] || 0) / maxC) * 100))
  }

  // IET: concentration index
  const iet: [string, number][] = topRelatores.map(rel => {
    const counts = relatorThemeCounts[rel] || {}
    const vals = Object.values(counts)
    const total = vals.reduce((s, v) => s + v, 0)
    const maxV = Math.max(...vals, 0)
    const score = total > 0 ? Math.round((maxV / total) * 100) : 0
    return [rel, score] as [string, number]
  }).sort((a, b) => b[1] - a[1])

  return { radarLabels: tituloOrder, relatores, iet }
}

// ── Metrics ──

export function aggregateMetrics(decisoes: Decisao[], vinculos: Vinculo[]): MetricsData {
  const classeCount = countBy(decisoes, d => d.classe)
  const topClasse = topN(classeCount, 1)
  const totalArtigos = new Set(vinculos.map(v => v.artigo_id)).size
  const totalRelatores = new Set(decisoes.map(d => d.relator).filter(Boolean)).size

  return {
    totalDecisoes: decisoes.length,
    totalArtigos,
    totalClasses: Object.keys(classeCount).length,
    classeTop: topClasse[0] ? `${topClasse[0][0]} lidera ${((topClasse[0][1] / decisoes.length) * 100).toFixed(1)}%` : '',
    totalRelatores,
  }
}

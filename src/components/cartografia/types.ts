export interface TemporalData {
  yearly: { year: number; count: number }[]
  decades: { label: string; count: number }[]
}

export interface ClassesData {
  distribution: [string, number][]
  evolution: { period: string; data: Record<string, number> }[]
}

export interface RelatoresData {
  top20: [string, number][]
  cumulative: number[]
}

export interface ArtigosData {
  top20: [string, number][]
  temas: [string, number][]
}

export interface CalorData {
  relatores: string[]
  buckets: string[]
  matrix: number[][]
}

export interface MudancasData {
  artigos: { art: string; span: string; anos: number; dec: number }[]
  marcos: { ano: string; desc: string }[]
}

export interface OrgaoData {
  distribution: [string, number][]
  porClasse: { classe: string; P: number; T1: number; T2: number }[]
}

export interface TemasData {
  blocos: [string, number][]
  clusters: { tema: string; arts: string[]; cor: string }[]
}

export interface DecidibilidadeData {
  porClasse: [string, number][]
  bubble: { cls: string; volume: number; saturacao: number; dispersao: number }[]
}

export interface TempoData {
  intervalo: [string, number][]
  recorrencia: [string, number][]
}

export interface RedeData {
  nodes: { id: string; label: string; weight: number; cor: string }[]
  edges: [string, string, number][]
  pontes: [string, number][]
}

export interface PerfilData {
  radarLabels: string[]
  relatores: Record<string, number[]>
  iet: [string, number][]
}

export interface MetricsData {
  totalDecisoes: number
  totalArtigos: number
  totalClasses: number
  classeTop: string
  totalRelatores: number
}

export interface CartografiaData {
  temporal: TemporalData
  classes: ClassesData
  relatores: RelatoresData
  artigos: ArtigosData
  calor: CalorData
  mudancas: MudancasData
  orgao: OrgaoData
  temas: TemasData
  decidibilidade: DecidibilidadeData
  tempo: TempoData
  rede: RedeData
  perfil: PerfilData
  metrics: MetricsData
}

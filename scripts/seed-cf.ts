import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// DADOS REAIS DA CONSTITUIÇÃO FEDERAL DE 1988
// ============================================================================

// 9 Títulos — Cores definidas no CLAUDE.md (placas tectônicas)
const titulos = [
  { numero_romano: 'I',    numero_int: 1, denominacao: 'Dos Princípios Fundamentais',                    cor_hex: '#8B0000', ordem: 1  },
  { numero_romano: 'II',   numero_int: 2, denominacao: 'Dos Direitos e Garantias Fundamentais',          cor_hex: '#1a3a5c', ordem: 2  },
  { numero_romano: 'III',  numero_int: 3, denominacao: 'Da Organização do Estado',                       cor_hex: '#2d5a27', ordem: 3  },
  { numero_romano: 'IV',   numero_int: 4, denominacao: 'Da Organização dos Poderes',                     cor_hex: '#4a3728', ordem: 4  },
  { numero_romano: 'V',    numero_int: 5, denominacao: 'Da Defesa do Estado e Das Instituições Democráticas', cor_hex: '#5a4a00', ordem: 5  },
  { numero_romano: 'VI',   numero_int: 6, denominacao: 'Da Tributação e do Orçamento',                   cor_hex: '#3d1a5c', ordem: 6  },
  { numero_romano: 'VII',  numero_int: 7, denominacao: 'Da Ordem Econômica e Financeira',                cor_hex: '#1a4a4a', ordem: 7  },
  { numero_romano: 'VIII', numero_int: 8, denominacao: 'Da Ordem Social',                                cor_hex: '#5c3a00', ordem: 8  },
  { numero_romano: 'IX',   numero_int: 9, denominacao: 'Das Disposições Constitucionais Gerais',         cor_hex: '#3a3a3a', ordem: 9  },
]

// 33 Capítulos — organizados por titulo_int
// titulo_int → capítulos (numero_romano, numero_int, denominacao)
const capitulos: Record<number, { numero_romano: string; numero_int: number; denominacao: string }[]> = {
  // Título I — Dos Princípios Fundamentais — SEM capítulos
  1: [],

  // Título II — Dos Direitos e Garantias Fundamentais — 5 capítulos
  2: [
    { numero_romano: 'I',   numero_int: 1, denominacao: 'Dos Direitos e Deveres Individuais e Coletivos' },
    { numero_romano: 'II',  numero_int: 2, denominacao: 'Dos Direitos Sociais' },
    { numero_romano: 'III', numero_int: 3, denominacao: 'Da Nacionalidade' },
    { numero_romano: 'IV',  numero_int: 4, denominacao: 'Dos Direitos Políticos' },
    { numero_romano: 'V',   numero_int: 5, denominacao: 'Dos Partidos Políticos' },
  ],

  // Título III — Da Organização do Estado — 7 capítulos
  3: [
    { numero_romano: 'I',   numero_int: 1, denominacao: 'Da Organização Político-Administrativa' },
    { numero_romano: 'II',  numero_int: 2, denominacao: 'Da União' },
    { numero_romano: 'III', numero_int: 3, denominacao: 'Dos Estados Federados' },
    { numero_romano: 'IV',  numero_int: 4, denominacao: 'Dos Municípios' },
    { numero_romano: 'V',   numero_int: 5, denominacao: 'Do Distrito Federal e dos Territórios' },
    { numero_romano: 'VI',  numero_int: 6, denominacao: 'Da Intervenção' },
    { numero_romano: 'VII', numero_int: 7, denominacao: 'Da Administração Pública' },
  ],

  // Título IV — Da Organização dos Poderes — 4 capítulos
  4: [
    { numero_romano: 'I',   numero_int: 1, denominacao: 'Do Poder Legislativo' },
    { numero_romano: 'II',  numero_int: 2, denominacao: 'Do Poder Executivo' },
    { numero_romano: 'III', numero_int: 3, denominacao: 'Do Poder Judiciário' },
    { numero_romano: 'IV',  numero_int: 4, denominacao: 'Das Funções Essenciais à Justiça' },
  ],

  // Título V — Da Defesa do Estado e Das Instituições Democráticas — 3 capítulos
  5: [
    { numero_romano: 'I',   numero_int: 1, denominacao: 'Do Estado de Defesa e do Estado de Sítio' },
    { numero_romano: 'II',  numero_int: 2, denominacao: 'Das Forças Armadas' },
    { numero_romano: 'III', numero_int: 3, denominacao: 'Da Segurança Pública' },
  ],

  // Título VI — Da Tributação e do Orçamento — 2 capítulos
  6: [
    { numero_romano: 'I',  numero_int: 1, denominacao: 'Do Sistema Tributário Nacional' },
    { numero_romano: 'II', numero_int: 2, denominacao: 'Das Finanças Públicas' },
  ],

  // Título VII — Da Ordem Econômica e Financeira — 4 capítulos
  7: [
    { numero_romano: 'I',   numero_int: 1, denominacao: 'Dos Princípios Gerais da Atividade Econômica' },
    { numero_romano: 'II',  numero_int: 2, denominacao: 'Da Política Urbana' },
    { numero_romano: 'III', numero_int: 3, denominacao: 'Da Política Agrícola e Fundiária e da Reforma Agrária' },
    { numero_romano: 'IV',  numero_int: 4, denominacao: 'Do Sistema Financeiro Nacional' },
  ],

  // Título VIII — Da Ordem Social — 8 capítulos
  8: [
    { numero_romano: 'I',    numero_int: 1, denominacao: 'Disposição Geral' },
    { numero_romano: 'II',   numero_int: 2, denominacao: 'Da Seguridade Social' },
    { numero_romano: 'III',  numero_int: 3, denominacao: 'Da Educação, da Cultura e do Desporto' },
    { numero_romano: 'IV',   numero_int: 4, denominacao: 'Da Ciência, Tecnologia e Inovação' },
    { numero_romano: 'V',    numero_int: 5, denominacao: 'Da Comunicação Social' },
    { numero_romano: 'VI',   numero_int: 6, denominacao: 'Do Meio Ambiente' },
    { numero_romano: 'VII',  numero_int: 7, denominacao: 'Da Família, da Criança, do Adolescente, do Jovem e do Idoso' },
    { numero_romano: 'VIII', numero_int: 8, denominacao: 'Dos Índios' },
  ],

  // Título IX — Das Disposições Constitucionais Gerais — SEM capítulos
  9: [],
}

async function seed() {
  console.log('Iniciando seed da topografia constitucional...\n')

  // 1. Limpar dados existentes (ordem inversa por FK)
  console.log('Limpando dados existentes...')
  await supabase.from('cf_capitulos').delete().neq('id', 0)
  await supabase.from('cf_titulos').delete().neq('id', 0)

  // 2. Inserir títulos
  console.log('Inserindo 9 títulos...')
  const { data: titulosInseridos, error: errTitulos } = await supabase
    .from('cf_titulos')
    .insert(titulos)
    .select()

  if (errTitulos) {
    console.error('Erro ao inserir títulos:', errTitulos)
    process.exit(1)
  }

  console.log(`  ✓ ${titulosInseridos.length} títulos inseridos`)

  // 3. Mapear titulo_int → id do banco
  const tituloIdMap = new Map<number, number>()
  for (const t of titulosInseridos) {
    tituloIdMap.set(t.numero_int, t.id)
  }

  // 4. Inserir capítulos
  let ordemGlobal = 1
  let totalCapitulos = 0

  for (const [tituloInt, caps] of Object.entries(capitulos)) {
    const tituloId = tituloIdMap.get(Number(tituloInt))
    if (!tituloId || caps.length === 0) continue

    const capsComTitulo = caps.map((c) => ({
      ...c,
      titulo_id: tituloId,
      ordem: ordemGlobal++,
    }))

    const { data: capsInseridos, error: errCaps } = await supabase
      .from('cf_capitulos')
      .insert(capsComTitulo)
      .select()

    if (errCaps) {
      console.error(`Erro ao inserir capítulos do Título ${tituloInt}:`, errCaps)
      process.exit(1)
    }

    totalCapitulos += capsInseridos.length
    console.log(`  ✓ Título ${tituloInt}: ${capsInseridos.length} capítulos`)
  }

  console.log(`\n=== SEED CONCLUÍDO ===`)
  console.log(`Títulos:   ${titulosInseridos.length}`)
  console.log(`Capítulos: ${totalCapitulos}`)
}

seed().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})

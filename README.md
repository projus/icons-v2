# PROJUS — Projeto Justiça Aberta

**Instituto Constituição Aberta – ICONS**  
Coord. Dra. Damares Medina Coelho · [Lattes](http://lattes.cnpq.br/1721292294070477)

> *"O Supremo, porém, que admiro e exalto (...) concebido como o idearam os fundadores do regime federativo, como cúpula e constituinte permanente."*  
> — Min. Aliomar Baleeiro, 1968

---

## Sobre o projeto

O PROJUS é uma iniciativa de pesquisa interdisciplinar do Instituto Constituição Aberta (ICONS), organização da sociedade civil de interesse público dedicada à transparência do Poder Judiciário. O projeto extrai, estrutura e visualiza as decisões do Supremo Tribunal Federal desde a promulgação da Constituição Federal de 1988, tornando o contencioso constitucional acessível ao cidadão, ao pesquisador e ao operador do direito.

O projeto foi originalmente proposto em 2016 no âmbito do Edital Chamada Universal nº 01/2016, com o objetivo de produzir um **Mapeamento Jurisprudencial** do STF a partir de mecanismos de extração e mineração de dados, estatística e legal design.

---

## Ferramentas

### [Cartografia do Contencioso Constitucional](cartografia_stf.html)
Visão panorâmica do contencioso constitucional em **12 eixos analíticos**:

| Eixo | Descrição |
|------|-----------|
| ① Evolução temporal | 9.014 decisões por ano (1988–2026), fases do contencioso |
| ② Classes processuais | Distribuição entre ADI, RE, HC, ADPF e demais classes |
| ③ Relatores | Ranking dos 20 ministros por volume e especialização |
| ④ Artigos litigados | Os 30 artigos da CF/88 com maior contencioso |
| ⑤ Mapa de calor | Intensidade decisória: relator × período de 5 anos |
| ⑥ Mudanças de entendimento | Artigos com maior amplitude temporal e viradas |
| ⑦ Órgão julgador | Plenário vs. Turmas, distribuição por classe |
| ⑧ Blocos temáticos | Clusters jurisprudenciais por título constitucional |
| ⑨ Decidibilidade | Índice composto de estabilidade por classe processual |
| ⑩ Tempo entre decisões | Contencioso crônico vs. pontual por artigo |
| ⑪ Rede de co-citação | Artigos que se citam mutuamente, formando clusters |
| ⑫ Perfil decisório | Radar de especialização temática por ministro |

### [Oscilação Jurisprudencial](linhas_decisorias_stf.html)
Análise longitudinal de cada artigo constitucional com foco em **instabilidade decisória**:

- **Índice de instabilidade (0–100)** por artigo, composto por 5 dimensões ponderadas
- **Detecção de reversões A→B→A** — quando o STF retorna a posição anterior após desvio
- **Fragmentação decisória** — períodos sem relator dominante, contencioso disputado
- **Conteúdo doutrinário real** por período — os próprios fragmentos dos acórdãos
- **Painel "antes e depois"** de cada virada jurisprudencial
- **40 artigos** mais litigados com linha temporal completa

---

## Dados

| Campo | Valor |
|-------|-------|
| Fonte | Constituição Federal Comentada pelas Decisões do STF |
| Decisões mapeadas | **9.014** |
| Fragmentos doutrinários | **8.677** |
| Artigos da CF/88 | **354** com ao menos 1 decisão |
| Amplitude temporal | **1988–2026** (37 anos) |
| Relatores identificados | **80+** ministros e ex-ministros |
| Classes processuais | **15** (ADI lidera com 31,9%) |

### Dimensões do índice de instabilidade

```
IDI = (quebras_relator × 0,30) + (reversões × 0,25) +
      (fragmentação × 0,20) + (oscil_classe × 0,10) +
      (volatilidade_volume × 0,15)
```

| Dimensão | Peso | O que detecta |
|----------|------|---------------|
| Quebras de relator | 30% | Mudanças no relator dominante por período |
| Reversões A→B→A | 25% | Retorno à posição após desvio — o padrão mais grave |
| Fragmentação | 20% | Períodos sem voz dominante (top share < 35%) |
| Oscilação de classe | 10% | Mudanças na classe processual dominante |
| Volatilidade de volume | 15% | Coeficiente de variação do volume entre períodos |

---

## Metodologia

```
Documento fonte (33.823 parágrafos)
        ↓
Extração automatizada de citações
(regex + parsing: classe, número, relator, data, artigo)
        ↓
Estruturação por artigo e janela temporal (5 anos)
        ↓
Extração de contexto doutrinário por decisão
        ↓
Cálculo de métricas de instabilidade
        ↓
Visualização interativa (HTML/CSS/JS + Chart.js)
```

**Stack técnica:**
- Extração: Python 3 · `python-docx` · `re`
- Análise: `collections` · métricas estatísticas customizadas
- Visualização: HTML5 · CSS3 · JavaScript (vanilla) · Chart.js 4.4

---

## Estrutura do repositório

```
projus/
├── index.html                  # Página institucional (entrada do site)
├── cartografia_stf.html        # Ferramenta 1: 12 eixos analíticos
├── linhas_decisorias_stf.html  # Ferramenta 2: oscilação jurisprudencial
└── README.md                   # Este arquivo
```

Todos os dados estão embutidos nos arquivos HTML — nenhum servidor ou banco de dados necessário. O site funciona como arquivos estáticos.

---

## Como publicar

O repositório está configurado para **GitHub Pages**. Após ativar em `Settings → Pages → Deploy from branch (main)`, o site ficará disponível em:

```
https://icons.github.io/projus
```

Para domínio próprio, adicionar em `Settings → Pages → Custom domain` e configurar o CNAME no DNS.

---

## Equipe

**Damares Medina**

---

## Citação

```
ICONS – Instituto Constituição Aberta. PROJUS: Projeto Justiça Aberta.
Cartografia do Contencioso Constitucional Brasileiro (1988–2026).
Coord. Damares Medina Coelho. Brasília: ICONS, 2016–2026.
Disponível em: https://icons.github.io/projus
```

---

## Licença

Este projeto é de interesse público. Os dados são derivados de documentos públicos do Supremo Tribunal Federal. O código de visualização é de livre uso com atribuição ao ICONS.

---

*Instituto Constituição Aberta – ICONS · Brasília, DF*  
*Assim como a Constituição é um projeto aberto, o STF está em constante realização constitucional.*

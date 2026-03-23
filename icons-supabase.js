/**
 * ICONS — carregamento agregado via Supabase REST (HTML estático).
 */
(function (global) {
  'use strict';

  var SB_URL = 'https://hetuhkhhppxjliiaerlu.supabase.co';
  var SB_KEY = 'sb_publishable_o-czLjy2cewbXs29vTyzHQ_unH3p1wK';

  function sbHeaders(extra) {
    var h = {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
      }
    }
    return h;
  }

  function fetchTable(name, select) {
    select = select || '*';
    var url =
      SB_URL +
      '/rest/v1/' +
      name +
      '?select=' +
      encodeURIComponent(select) +
      '&limit=10000';
    return fetch(url, {
      headers: sbHeaders({ Prefer: 'count=exact' }),
    }).then(function (res) {
      if (res.status === 404) {
        return { rows: [], contentRange: null };
      }
      if (!res.ok) throw new Error(name + ': ' + res.status + ' ' + res.statusText);
      return res.json().then(function (rows) {
        return { rows: rows, contentRange: res.headers.get('content-range') };
      });
    });
  }

  function parseTotalCount(contentRange) {
    if (!contentRange) return null;
    var p = contentRange.split('/');
    return p.length > 1 ? parseInt(p[1], 10) : null;
  }

  function fetchBundle() {
    return Promise.all([
      fetchTable('stf_decisoes'),
      fetchTable('cf_vinculos'),
      fetchTable('cf_artigos'),
      fetchTable('cf_titulos'),
      fetchTable('cf_incisos'),
      fetchTable('cf_paragrafos'),
    ]).then(function (parts) {
      return {
        decisoes: parts[0].rows,
        decisoesTotal: parseTotalCount(parts[0].contentRange) || parts[0].rows.length,
        vinculos: parts[1].rows,
        vinculosTotal: parseTotalCount(parts[1].contentRange) || parts[1].rows.length,
        artigos: parts[2].rows,
        titulos: parts[3].rows,
        incisos: parts[4].rows,
        paragrafos: parts[5].rows,
      };
    });
  }

  function topNEntries(map, n) {
    return Array.from(map.entries())
      .sort(function (a, b) {
        return b[1] - a[1];
      })
      .slice(0, n);
  }

  function yearFromDate(d) {
    if (!d) return null;
    var y = new Date(d).getFullYear();
    return isNaN(y) ? null : y;
  }

  var BUCKETS5 = ['88–92', '93–97', '98–02', '03–07', '08–12', '13–17', '18–22', '23–26'];

  function yearToBucket5y(y) {
    if (y == null || y < 1988) return 0;
    if (y >= 2023) return 7;
    var idx = Math.floor((y - 1988) / 5);
    return idx < 0 ? 0 : idx > 7 ? 7 : idx;
  }

  var WIN_LINHAS = [
    '1985–1989',
    '1990–1994',
    '1995–1999',
    '2000–2004',
    '2005–2009',
    '2010–2014',
    '2015–2019',
    '2020–2024',
    '2025–2029',
  ];

  var WIN_YEAR_RANGES = [
    [1985, 1989],
    [1990, 1994],
    [1995, 1999],
    [2000, 2004],
    [2005, 2009],
    [2010, 2014],
    [2015, 2019],
    [2020, 2024],
    [2025, 2029],
  ];

  function yearToLinhaWindow(y) {
    if (y == null) return WIN_LINHAS[0];
    for (var i = 0; i < WIN_YEAR_RANGES.length; i++) {
      if (y >= WIN_YEAR_RANGES[i][0] && y <= WIN_YEAR_RANGES[i][1]) return WIN_LINHAS[i];
    }
    if (y < 1985) return WIN_LINHAS[0];
    return WIN_LINHAS[WIN_LINHAS.length - 1];
  }

  function artigoLabel(art) {
    var cap = (art.caput || '').replace(/\s+/g, ' ').trim();
    var short = cap.length > 48 ? cap.slice(0, 45) + '…' : cap;
    return 'Art. ' + String(art.numero_texto || art.numero).trim() + ' – ' + short;
  }

  function artigoId(art) {
    return 'Art. ' + String(art.numero_texto || art.numero).trim();
  }

  /** Narrativa e clusters preservados do projeto original (painéis não tabulares). */
  var STATIC = {
    radarData: {
      'Marco Aurélio': [85, 72, 45, 60, 55, 40],
      'Gilmar Mendes': [70, 55, 80, 65, 75, 50],
      'Celso de Mello': [90, 65, 40, 55, 60, 35],
      'Edson Fachin': [80, 88, 35, 45, 40, 30],
      'Roberto Barroso': [88, 60, 50, 70, 65, 40],
      'Dias Toffoli': [60, 45, 85, 70, 80, 65],
      'Cármen Lúcia': [75, 50, 55, 80, 70, 45],
      'Alexandre de Moraes': [70, 80, 40, 65, 55, 35],
      'Luiz Fux': [65, 45, 75, 80, 60, 70],
    },
    clusters: [
      { tema: 'Controle concentrado', arts: ['Art. 102', 'Art. 103', 'Art. 97'], cor: '#1a2744' },
      { tema: 'Federalismo tributário', arts: ['Art. 150', 'Art. 155', 'Art. 145'], cor: '#b8860b' },
      { tema: 'Direitos processuais', arts: ['Art. 5º', 'Art. 93', 'Art. 109'], cor: '#0d5c5c' },
      { tema: 'MP e persecução penal', arts: ['Art. 127', 'Art. 129', 'Art. 144'], cor: '#8b3a1a' },
      { tema: 'Federalismo normativo', arts: ['Art. 22', 'Art. 24', 'Art. 25'], cor: '#4a3080' },
      { tema: 'Previdência e trabalho', arts: ['Art. 40', 'Art. 195', 'Art. 7º'], cor: '#2d6a2d' },
    ],
    marcos: [
      { ano: '1994', desc: 'ADI 939 — imunidade tributária e cláusulas pétreas. Primeira grande revisão de entendimento do STF pós-88.' },
      { ano: '2003', desc: 'ADI 3.105 — contribuição de inativos. Revisão do alcance da irredutibilidade e cláusulas pétreas previdenciárias.' },
      { ano: '2007', desc: 'Repercussão geral (EC 45/2004) entra em vigor. Filtro quantitativo do RE reconfigurado.' },
      { ano: '2008', desc: 'ADPF 153 — Lei de Anistia. ADI 3.510 — células-tronco. Expansão da pauta de direitos fundamentais.' },
      { ano: '2011', desc: 'ADPF 132 / ADI 4.277 — união homoafetiva. Interpretação conforme como técnica decisória central.' },
      { ano: '2018', desc: 'AP 937 QO — revisão do foro privilegiado. Virada processual penal de alto impacto político-institucional.' },
      { ano: '2023', desc: 'ADPF 779 — legítima defesa da honra. Expansão da pauta ambiental e democrática.' },
    ],
  };

  function buildCartografiaData(bundle) {
    var decisoes = bundle.decisoes;
    var vinculos = bundle.vinculos;
    var artigos = bundle.artigos;
    var titulos = bundle.titulos;
    var tituloById = new Map(titulos.map(function (t) {
      return [t.id, t];
    }));
    var artById = new Map(artigos.map(function (a) {
      return [a.id, a];
    }));
    var decById = new Map(decisoes.map(function (d) {
      return [d.id, d];
    }));

    var totalDecisoes = bundle.decisoesTotal || decisoes.length;

    var anos = {};
    var classMap = new Map();
    var relMap = new Map();
    var orgMap = { P: 0, '1T': 0, '2T': 0, _out: 0 };

    for (var di = 0; di < decisoes.length; di++) {
      var d = decisoes[di];
      var y = yearFromDate(d.data_julgamento);
      if (y != null) {
        anos[y] = (anos[y] || 0) + 1;
      }
      if (d.classe) classMap.set(d.classe, (classMap.get(d.classe) || 0) + 1);
      if (d.relator) relMap.set(d.relator, (relMap.get(d.relator) || 0) + 1);
      var og = d.orgao_julgador;
      if (og === 'P' || og === '1T' || og === '2T') orgMap[og]++;
      else orgMap._out++;
    }

    var classes = topNEntries(classMap, 15);
    if (!classes.length) {
      classes = [['—', 0]];
    }
    var relatores = topNEntries(relMap, 20);
    if (!relatores.length) {
      relatores = [['—', 0]];
    }

    var artCount = new Map();
    for (var vi = 0; vi < vinculos.length; vi++) {
      var vid = vinculos[vi].artigo_id;
      artCount.set(vid, (artCount.get(vid) || 0) + 1);
    }
    var artigosTop = topNEntries(artCount, 20).map(function (e) {
      var a = artById.get(e[0]);
      return a ? [artigoLabel(a), e[1]] : ['Art. #' + e[0], e[1]];
    });
    if (!artigosTop.length) {
      artigosTop = [['—', 0]];
    }
    var maxArt = artigosTop.length ? artigosTop[0][1] : 1;

    var temaMap = new Map();
    for (var vj = 0; vj < vinculos.length; vj++) {
      var ar = artById.get(vinculos[vj].artigo_id);
      if (!ar || !ar.titulo_id) continue;
      var tit = tituloById.get(ar.titulo_id);
      var lab = tit ? tit.denominacao : 'Outros';
      temaMap.set(lab, (temaMap.get(lab) || 0) + 1);
    }
    var temas = topNEntries(temaMap, 11);
    if (!temas.length) {
      temas = [['—', 0]];
    }
    if (!temas.some(function (t) {
      return t[0] === 'Outros';
    }) && temaMap.size > temas.length) {
      var s = 0;
      temaMap.forEach(function (v, k) {
        if (!temas.some(function (t) {
          return t[0] === k;
        })) s += v;
      });
      if (s > 0) temas.push(['Outros', s]);
    }

    var topRelNames = topNEntries(relMap, 15).map(function (e) {
      return e[0];
    });
    if (!topRelNames.length) {
      topRelNames = ['—'];
    }
    var heatRaw = topRelNames.map(function () {
      return BUCKETS5.map(function () {
        return 0;
      });
    });
    for (var dk = 0; dk < decisoes.length; dk++) {
      var dd = decisoes[dk];
      var yi = yearFromDate(dd.data_julgamento);
      if (yi == null || !dd.relator) continue;
      var ri = topRelNames.indexOf(dd.relator);
      if (ri < 0) continue;
      var bi = yearToBucket5y(yi);
      heatRaw[ri][bi]++;
    }

    var maxCls = classes.length ? classes[0][1] : 1;
    var classIds = classes.map(function (c) {
      return c[0];
    });
    var relCountsByClass = {};
    for (var ci = 0; ci < classIds.length; ci++) {
      relCountsByClass[classIds[ci]] = new Map();
    }
    for (var dx = 0; dx < decisoes.length; dx++) {
      var row = decisoes[dx];
      if (!row.classe || !relCountsByClass[row.classe]) continue;
      if (!row.relator) continue;
      var rm = relCountsByClass[row.classe];
      rm.set(row.relator, (rm.get(row.relator) || 0) + 1);
    }
    var decidib = classIds.slice(0, 8).map(function (cls) {
      var m = relCountsByClass[cls];
      var tot = classes.find(function (x) {
        return x[0] === cls;
      })[1];
      var uniq = m.size;
      var saturation = Math.min(100, Math.round((uniq / Math.max(1, tot)) * 200));
      var volNorm = Math.min(100, Math.round((tot / maxCls) * 100));
      var idc = Math.round(saturation * 0.45 + volNorm * 0.45 + 10);
      idc = Math.min(95, Math.max(35, idc));
      return [cls, idc];
    });
    var maxDecidib = decidib.length
      ? Math.max.apply(
          null,
          decidib.map(function (d) {
            return d[1];
          })
        )
      : 92;
    if (!decidib.length) {
      decidib = [['—', 0]];
    }

    var tempoPairs = [];
    artCount.forEach(function (cnt, aid) {
      if (cnt < 3) return;
      var yearsSet = new Set();
      for (var vk = 0; vk < vinculos.length; vk++) {
        if (vinculos[vk].artigo_id !== aid) continue;
        var dj = decById.get(vinculos[vk].decisao_id);
        if (!dj || !dj.data_julgamento) continue;
        yearsSet.add(yearFromDate(dj.data_julgamento));
      }
      var ys = Array.from(yearsSet).filter(function (x) {
        return x != null;
      }).sort(function (a, b) {
        return a - b;
      });
      if (ys.length < 2) return;
      var gaps = [];
      for (var g = 1; g < ys.length; g++) {
        gaps.push(ys[g] - ys[g - 1]);
      }
      var meanGap = gaps.reduce(function (a, b) {
        return a + b;
      }, 0) / gaps.length;
      var aa = artById.get(aid);
      tempoPairs.push({ id: aa ? artigoId(aa) : '#' + aid, mean: meanGap, cnt: cnt });
    });
    tempoPairs.sort(function (a, b) {
      return b.cnt - a.cnt;
    });
    var tempo = tempoPairs.slice(0, 15).map(function (p) {
      return [p.id, Math.round(p.mean * 10) / 10];
    });
    if (!tempo.length) {
      tempo = [['—', 0]];
    }

    var mudPairs = [];
    artCount.forEach(function (cnt, aid) {
      var ys2 = new Set();
      for (var vm = 0; vm < vinculos.length; vm++) {
        if (vinculos[vm].artigo_id !== aid) continue;
        var dm = decById.get(vinculos[vm].decisao_id);
        if (!dm || !dm.data_julgamento) continue;
        ys2.add(yearFromDate(dm.data_julgamento));
      }
      var yarr = Array.from(ys2).filter(function (x) {
        return x != null;
      }).sort();
      if (yarr.length < 2) return;
      var span = yarr[yarr.length - 1] - yarr[0];
      var aa2 = artById.get(aid);
      mudPairs.push({
        art: aa2 ? artigoLabel(aa2) : 'Art. #' + aid,
        span: yarr[0] + '–' + yarr[yarr.length - 1],
        anos: span,
        dec: cnt,
        nota:
          'Amplitude ' +
          span +
          ' anos · ' +
          cnt +
          ' vínculos decisórios no acervo sincronizado.',
      });
    });
    mudPairs.sort(function (a, b) {
      return b.anos * b.dec - a.anos * a.dec;
    });
    var mudancas = mudPairs.slice(0, 7);
    if (!mudancas.length) {
      mudancas = [
        {
          art: '—',
          span: '—',
          anos: 0,
          dec: 0,
          nota: 'Sem dados agregados para o período.',
        },
      ];
    }

    var oTotal = orgMap.P + orgMap['1T'] + orgMap['2T'] + orgMap._out;
    var orgChart = [orgMap.P, orgMap['1T'], orgMap['2T'], orgMap._out];

    return {
      totalDecisoes: totalDecisoes,
      anos: anos,
      classes: classes,
      relatores: relatores,
      artigos: artigosTop,
      maxArt: maxArt,
      maxCls: maxCls,
      heatRelatores: topRelNames.map(function (n) {
        var p = n.split(/\s+/);
        return p.length > 2 ? p[0] + ' ' + p[p.length - 1] : n;
      }),
      buckets: BUCKETS5,
      heatRaw: heatRaw,
      temas: temas,
      decidib: decidib,
      tempo: tempo,
      mudancas: mudancas,
      marcos: STATIC.marcos,
      clusters: STATIC.clusters,
      radarData: STATIC.radarData,
      orgChart: orgChart,
      orgTotal: oTotal,
      orgNarrative: {
        plenario: { n: orgMap.P, pct: oTotal ? ((orgMap.P / oTotal) * 100).toFixed(1) : '0' },
        t1: { n: orgMap['1T'], pct: oTotal ? ((orgMap['1T'] / oTotal) * 100).toFixed(1) : '0' },
        t2: { n: orgMap['2T'], pct: oTotal ? ((orgMap['2T'] / oTotal) * 100).toFixed(1) : '0' },
        out: { n: orgMap._out, pct: oTotal ? ((orgMap._out / oTotal) * 100).toFixed(1) : '0' },
      },
      maxDecidib: maxDecidib,
    };
  }

  function modeArr(arr) {
    var m = new Map();
    for (var i = 0; i < arr.length; i++) {
      var x = arr[i];
      if (!x) continue;
      m.set(x, (m.get(x) || 0) + 1);
    }
    var best = null,
      bc = 0;
    m.forEach(function (v, k) {
      if (v > bc) {
        bc = v;
        best = k;
      }
    });
    return { mode: best, count: bc, uniq: m.size, total: arr.length };
  }

  function tierFromScore(s) {
    if (s >= 55) return 'high';
    if (s >= 38) return 'moderate';
    return 'stable';
  }

  function buildLinhasArticles(bundle, BL) {
    var decisoes = bundle.decisoes;
    var vinculos = bundle.vinculos;
    var artigos = bundle.artigos;
    var titulos = bundle.titulos;
    var decById = new Map(decisoes.map(function (d) {
      return [d.id, d];
    }));
    var artById = new Map(artigos.map(function (a) {
      return [a.id, a];
    }));
    var tituloById = new Map(titulos.map(function (t) {
      return [t.id, t];
    }));

    function blockForNum(n) {
      for (var b = 0; b < BL.length; b++) {
        var blk = BL[b];
        if (n >= blk.start && n <= blk.end) return blk;
      }
      return BL[BL.length - 1];
    }

    var byArt = new Map();
    for (var i = 0; i < vinculos.length; i++) {
      var v = vinculos[i];
      if (!byArt.has(v.artigo_id)) byArt.set(v.artigo_id, []);
      byArt.get(v.artigo_id).push(v);
    }

    var A = [];
    byArt.forEach(function (vines, artigo_id) {
      var art = artById.get(artigo_id);
      if (!art) return;

      var byWin = {};
      for (var w = 0; w < WIN_LINHAS.length; w++) {
        byWin[WIN_LINHAS[w]] = { decisoes: [], rels: [], clss: [], texts: [] };
      }

      var decIdsSeen = new Set();
      for (var j = 0; j < vines.length; j++) {
        var vin = vines[j];
        var dec = decById.get(vin.decisao_id);
        if (!dec) continue;
        decIdsSeen.add(dec.id);
        var yr = yearFromDate(dec.data_julgamento);
        if (yr == null) continue;
        var win = yearToLinhaWindow(yr);
        var slot = byWin[win];
        slot.decisoes.push(dec.id);
        if (dec.relator) slot.rels.push(dec.relator);
        if (dec.classe) slot.clss.push(dec.classe);
        if (vin.texto_contexto && String(vin.texto_contexto).trim()) {
          slot.texts.push({ t: String(vin.texto_contexto).trim(), y: yr, rel: dec.relator });
        }
      }

      var years = [];
      decIdsSeen.forEach(function () {});
      for (var dj = 0; dj < vines.length; dj++) {
        var dcc = decById.get(vines[dj].decisao_id);
        if (dcc && dcc.data_julgamento) years.push(yearFromDate(dcc.data_julgamento));
      }
      years = years.filter(function (x) {
        return x != null;
      });
      if (!years.length) return;
      var ymin = Math.min.apply(null, years);
      var ymax = Math.max.apply(null, years);
      var span = ymax - ymin;

      var line = [];
      var prevRel = null;
      var prevCls = null;
      var breaks = 0;
      var clsChanges = 0;

      for (var wi = 0; wi < WIN_LINHAS.length; wi++) {
        var wlab = WIN_LINHAS[wi];
        var sl = byWin[wlab];
        var uniqDec = Array.from(new Set(sl.decisoes));
        var cnt = uniqDec.length;
        var mr = modeArr(sl.rels);
        var mc = modeArr(sl.clss);
        var topRel = mr.mode || '—';
        var topCls = mc.mode || '—';
        var br = null;
        if (wi > 0 && cnt > 0) {
          if (prevRel && topRel !== prevRel) {
            br = 'relator_shift';
            breaks++;
          } else if (prevCls && topCls !== prevCls) {
            br = 'class_shift';
            clsChanges++;
          }
        }
        var doc = null;
        var bestT = null;
        for (var tj = 0; tj < sl.texts.length; tj++) {
          if (!bestT || sl.texts[tj].t.length > bestT.t.length) bestT = sl.texts[tj];
        }
        if (bestT) {
          doc = bestT.t.length > 220 ? bestT.t.slice(0, 217) + '…' : bestT.t;
        }
        line.push({
          window: wlab,
          count: cnt,
          top_relator: topRel,
          top_class: topCls,
          break: br,
          doctrine: doc || '',
          doctrine_year: bestT ? bestT.y : null,
          doctrine_relator: bestT ? bestT.rel : null,
        });
        if (cnt > 0) {
          prevRel = topRel;
          prevCls = topCls;
        }
      }

      var reversals = [];
      for (var ri = 2; ri < line.length; ri++) {
        var wA = line[ri - 2];
        var wB = line[ri - 1];
        var wC = line[ri];
        if (!wA.count || !wB.count || !wC.count) continue;
        var ra = wA.top_relator;
        var rb = wB.top_relator;
        var rc = wC.top_relator;
        if (ra && ra === rc && rb && rb !== ra) {
          reversals.push({
            window: wA.window,
            window_b: wB.window,
            window_c: wC.window,
            relator_a: ra,
            relator_b: rb,
            pattern: ra + ' → ' + rb + ' → ' + rc,
          });
        }
      }

      var frag_windows = [];
      for (var fi = 0; fi < line.length; fi++) {
        var ln = line[fi];
        if (!ln.count) continue;
        var slot2 = byWin[ln.window];
        var mr2 = modeArr(slot2.rels);
        var share = mr2.count / slot2.rels.length;
        if (share < 0.36 && slot2.rels.length > 0) {
          frag_windows.push({
            window: ln.window,
            top_share: Math.round(share * 100) / 100,
            n_relatores: mr2.uniq,
            count: ln.count,
          });
        }
      }

      var counts = line.map(function (l) {
        return l.count;
      });
      var mean = counts.reduce(function (a, b) {
        return a + b;
      }, 0) / Math.max(1, counts.length);
      var varc = 0;
      for (var ci = 0; ci < counts.length; ci++) {
        varc += Math.pow(counts[ci] - mean, 2);
      }
      varc = Math.sqrt(varc / Math.max(1, counts.length));
      var volatility = mean > 0 ? Math.min(1, varc / mean) : 0;

      var qNorm = Math.min(1, breaks / 8);
      var revNorm = Math.min(1, reversals.length / 4);
      var fragNorm = Math.min(1, frag_windows.length / 6);
      var clsNorm = Math.min(1, clsChanges / 6);
      var volNorm = Math.min(1, volatility * 1.2);
      var score = Math.round(
        qNorm * 30 + revNorm * 25 + fragNorm * 20 + clsNorm * 10 + volNorm * 15
      );
      score = Math.max(18, Math.min(88, score));

      var total = decIdsSeen.size;
      var n_breaks = breaks;
      var raw = {
        breaks: breaks,
        breaks_n: Math.min(100, breaks * 12),
        reversals: reversals.length,
        reversals_n: Math.min(100, reversals.length * 20),
        frags: frag_windows.length,
        frags_n: Math.min(100, frag_windows.length * 14),
        cls_chg: clsChanges,
        cls_chg_n: Math.min(100, clsChanges * 15),
        vol: Math.round(volatility * 100) / 100,
        vol_n: Math.min(100, Math.round(volatility * 80)),
      };

      var cap = (art.caput || '').replace(/\s+/g, ' ').trim();
      var idStr = artigoId(art);
      var tier = tierFromScore(score);

      A.push({
        id: idStr,
        label: idStr,
        cf_text: cap,
        full: cap,
        total: total,
        span: span,
        year_min: ymin,
        year_max: ymax,
        n_breaks: n_breaks,
        top_rel: (function () {
          var ranked = line
            .filter(function (l) {
              return l.count;
            })
            .sort(function (a, b) {
              return b.count - a.count;
            });
          return ranked.length ? ranked[0].top_relator : '—';
        })(),
        top_cls: (function () {
          var ranked2 = line
            .filter(function (l) {
              return l.count;
            })
            .sort(function (a, b) {
              return b.count - a.count;
            });
          return ranked2.length ? ranked2[0].top_class : '—';
        })(),
        score: score,
        tier: tier,
        volatility: volatility,
        reversals: reversals,
        frag_windows: frag_windows,
        raw: raw,
        line: line,
      });
    });

    A.sort(function (a, b) {
      return (
        parseInt(String(a.id).replace(/\D/g, ''), 10) -
        parseInt(String(b.id).replace(/\D/g, ''), 10)
      );
    });

    var SP = A.slice()
      .sort(function (a, b) {
        return b.total - a.total;
      })
      .slice(0, 40)
      .map(function (row, idx) {
        var n = parseInt(String(row.id).replace(/\D/g, ''), 10) || idx;
        var blk = blockForNum(n);
        var tit = null;
        for (var si = 0; si < artigos.length; si++) {
          if (artigoId(artigos[si]) === row.id) {
            tit = artigos[si];
            break;
          }
        }
        var trow = tit && tit.titulo_id ? tituloById.get(tit.titulo_id) : null;
        var blockColor = trow && trow.cor_hex ? trow.cor_hex : blk.c;
        return {
          n: n,
          id: row.id,
          total: row.total,
          score: row.score,
          tier: row.tier,
          block: blk.id,
          blockLabel: blk.label,
          blockColor: blockColor,
          cf: (row.cf_text || '').substring(0, 60),
          reversals: row.reversals.length,
        };
      });

    return { A: A, SP: SP };
  }

  function fetchIndexStats(bundle) {
    var decisoes = bundle.decisoes;
    var vinculos = bundle.vinculos;
    var artigos = bundle.artigos;
    var total = bundle.decisoesTotal != null ? bundle.decisoesTotal : decisoes.length;
    var artsSet = new Set();
    for (var i = 0; i < vinculos.length; i++) {
      artsSet.add(vinculos[i].artigo_id);
    }
    var nArt = artsSet.size;
    var years = [];
    for (var j = 0; j < decisoes.length; j++) {
      var y = yearFromDate(decisoes[j].data_julgamento);
      if (y != null) years.push(y);
    }
    var spanYears = years.length ? Math.max.apply(null, years) - Math.min.apply(null, years) + 1 : 0;
    var rels = new Set();
    for (var k = 0; k < decisoes.length; k++) {
      if (decisoes[k].relator) rels.add(decisoes[k].relator);
    }
    return {
      decisoes: total,
      artigosCf: artigos.length,
      artigosComVinculo: nArt,
      anosAmplitude: spanYears,
      relatores: rels.size,
    };
  }

  global.ICONS_SB = {
    SB_URL: SB_URL,
    fetchBundle: fetchBundle,
    fetchTable: fetchTable,
    buildCartografiaData: buildCartografiaData,
    buildLinhasArticles: buildLinhasArticles,
    fetchIndexStats: fetchIndexStats,
    WIN_LINHAS: WIN_LINHAS,
  };
})(typeof window !== 'undefined' ? window : this);

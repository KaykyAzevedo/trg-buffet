/* TRG Buffet - site.js
   Dados editáveis do site: valores EMBUTIDOS (fallback) + carregador de data/site-data.json.
   O site funciona sem rede/sem o JSON usando DEFAULTS. Quando o JSON carrega, ele sobrescreve os
   campos conhecidos (objetos são mesclados; listas são substituídas). Ver docs/DADOS-PARA-TROCAR.md.
   Mantenha DEFAULTS e data/site-data.json equivalentes (o painel /admin/ edita o JSON). */
(function () {
  'use strict';

  var DEFAULTS = {
    "version": 1,
    "updatedAt": "2026-10-16",
    "whatsapp": "5521974318206",
    "phoneLabel": "(21) 97431-8206",
    "email": "contato@trgbuffet.com.br",
    "instagram": "trgbuffet",
    "address": [
      "Rua Marechal Fontenele, 1200",
      "Realengo, Rio de Janeiro - RJ",
      "CEP 21730-000"
    ],
    "hours": "Atendimento: seg. a sáb., das 8h às 19h",
    "quote": {
      "basePerPerson": 90,
      "baseGuests": 100,
      "minGuests": 30,
      "maxGuests": 500,
      "defaultGuests": 100,
      "smallEvent": [
        {
          "upTo": 49,
          "add": 15
        },
        {
          "upTo": 99,
          "add": 5
        }
      ],
      "regions": [
        {
          "id": "realengo",
          "label": "Realengo e vizinhos (Bangu, Padre Miguel, Vila Militar, Sulacap…)",
          "short": "Realengo e vizinhos",
          "addMin": 0,
          "addMax": 0
        },
        {
          "id": "oeste",
          "label": "Zona Oeste próxima (Campo Grande, Santa Cruz, Jacarepaguá…)",
          "short": "Zona Oeste próxima",
          "addMin": 15,
          "addMax": 15
        },
        {
          "id": "rj",
          "label": "Demais regiões do Rio (Centro, Zonas Sul e Norte, Barra…)",
          "short": "Demais regiões do RJ",
          "addMin": 30,
          "addMax": 40
        }
      ],
      "drinksPerPerson": 12,
      "dishesPerPerson": 8,
      "dessertPerPerson": 9,
      "extras": [
        {
          "id": "garcom",
          "label": "Garçom",
          "price": 180,
          "unit": "cada",
          "max": 8
        },
        {
          "id": "churrasqueiro",
          "label": "Churrasqueiro",
          "price": 250,
          "unit": "cada",
          "max": 3
        }
      ],
      "variationPct": 5,
      "pixPercent": 50,
      "minLeadDays": 7,
      "maxMonthsAhead": 12,
      "closedWeekdays": []
    },
    "agenda": {
      "csvUrl": "",
      "cacheMinutes": 10,
      "busyDates": [
        {
          "data": "2026-10-24",
          "motivo": ""
        },
        {
          "data": "2026-10-31",
          "motivo": ""
        },
        {
          "data": "2026-11-07",
          "motivo": ""
        },
        {
          "data": "2026-11-14",
          "motivo": ""
        },
        {
          "data": "2026-11-15",
          "motivo": ""
        },
        {
          "data": "2026-11-21",
          "motivo": ""
        },
        {
          "data": "2026-11-28",
          "motivo": ""
        },
        {
          "data": "2026-12-05",
          "motivo": ""
        },
        {
          "data": "2026-12-12",
          "motivo": ""
        },
        {
          "data": "2026-12-19",
          "motivo": ""
        },
        {
          "data": "2026-12-20",
          "motivo": ""
        },
        {
          "data": "2026-12-26",
          "motivo": ""
        },
        {
          "data": "2027-01-01",
          "motivo": ""
        },
        {
          "data": "2027-01-09",
          "motivo": ""
        },
        {
          "data": "2027-01-16",
          "motivo": ""
        },
        {
          "data": "2027-01-23",
          "motivo": ""
        },
        {
          "data": "2027-02-06",
          "motivo": ""
        },
        {
          "data": "2027-02-13",
          "motivo": ""
        },
        {
          "data": "2027-02-20",
          "motivo": ""
        },
        {
          "data": "2027-03-06",
          "motivo": ""
        },
        {
          "data": "2027-03-20",
          "motivo": ""
        },
        {
          "data": "2027-04-03",
          "motivo": ""
        },
        {
          "data": "2027-04-17",
          "motivo": ""
        }
      ]
    },
    "cardapio": {
      "categorias": [
        {
          "id": "churrasco",
          "nome": "Churrasco",
          "nota": "",
          "grupos": [
            {
              "titulo": "Carne bovina",
              "itens": [
                "Alcatra ou Contra Filé",
                "Picanha",
                "Cupim",
                "Polpetone recheado com provolone"
              ]
            },
            {
              "titulo": "Suíno, frango e acompanhamentos",
              "itens": [
                "Linguiça de pernil e de frango",
                "Drumete",
                "Meio da asa",
                "Copa lombo suíno",
                "Coração de frango",
                "Salsichão",
                "Queijo coalho",
                "Pão de alho",
                "Sanduíche e pão de alho com queijo e linguiça",
                "Peito de frango à parmegiana"
              ]
            }
          ]
        },
        {
          "id": "guarnicoes",
          "nome": "Guarnições",
          "nota": "Alteráveis ao gosto do cliente.",
          "grupos": [
            {
              "titulo": "",
              "itens": [
                "Arroz",
                "Farofa",
                "Molho à campanha",
                "Salpicão",
                "Salada de macarrão",
                "Salada caprese",
                "Batata frita"
              ]
            }
          ]
        },
        {
          "id": "petiscos",
          "nome": "Petiscos",
          "nota": "",
          "grupos": [
            {
              "titulo": "",
              "itens": [
                "Nuggets",
                "Salgadinhos diversos",
                "Um caldo à escolha: sopa de ervilha, caldo verde ou feijão amigo"
              ]
            }
          ]
        },
        {
          "id": "bebidas",
          "nome": "Bebidas",
          "nota": "",
          "grupos": [
            {
              "titulo": "",
              "itens": [
                "Água",
                "Suco",
                "Refrigerante (linha Coca-Cola)"
              ]
            }
          ]
        },
        {
          "id": "sobremesas",
          "nome": "Sobremesas",
          "nota": "Opcional · adicional sob consulta",
          "grupos": [
            {
              "titulo": "",
              "itens": [
                "Pudim de leite",
                "Mousse de maracujá",
                "Mousse de chocolate",
                "Brigadeiro e beijinho",
                "Pavê",
                "Salada de frutas",
                "Torta de limão"
              ]
            }
          ]
        }
      ],
      "condicoes": [
        "6 horas de evento + 30 minutos de tolerância",
        "Reserva da data com PIX de 50% do valor total",
        "Antes do PIX, confirmamos a disponibilidade da data",
        "O valor varia conforme frete, bebida e louça ou descartável"
      ]
    },
    "menu": {
      "sidesMax": 5,
      "soups": [
        {
          "id": "ervilha",
          "label": "Sopa de ervilha"
        },
        {
          "id": "verde",
          "label": "Caldo verde"
        },
        {
          "id": "feijao",
          "label": "Feijão amigo"
        }
      ],
      "extraMeats": [
        {
          "id": "picanha",
          "label": "Picanha",
          "perPerson": 14
        },
        {
          "id": "cupim",
          "label": "Cupim",
          "perPerson": 10
        },
        {
          "id": "copa",
          "label": "Copa lombo suíno",
          "perPerson": 6
        },
        {
          "id": "polpetone",
          "label": "Polpetone recheado com provolone",
          "perPerson": 5
        },
        {
          "id": "coalho",
          "label": "Queijo coalho",
          "perPerson": 4
        }
      ]
    },
    "packages": [
      {
        "id": "essencial",
        "name": "Essencial",
        "tagline": "O buffet completo, sem enfeite",
        "sides": [
          "arroz",
          "farofa",
          "molho-a-campanha"
        ],
        "soup": "",
        "drinks": false,
        "dishes": false,
        "dessert": false,
        "meats": [],
        "extras": {}
      },
      {
        "id": "completo",
        "name": "Completo",
        "tagline": "O que a maioria das festas pede",
        "recommended": true,
        "sides": [
          "arroz",
          "farofa",
          "molho-a-campanha",
          "salpicao",
          "batata-frita"
        ],
        "soup": "",
        "drinks": true,
        "dishes": false,
        "dessert": false,
        "meats": [
          "picanha"
        ],
        "extras": {}
      },
      {
        "id": "premium",
        "name": "Premium",
        "tagline": "Para você só curtir a festa",
        "sides": [
          "arroz",
          "farofa",
          "molho-a-campanha",
          "salpicao",
          "salada-caprese"
        ],
        "soup": "",
        "drinks": true,
        "dishes": true,
        "dessert": true,
        "meats": [
          "picanha",
          "cupim"
        ],
        "extras": {
          "garcom": 2,
          "churrasqueiro": 1
        }
      }
    ],
    "reviews": {
      "googleUrl": "",
      "itens": [
        {
          "nome": "Rogério Tavares",
          "data": "2026-09-12",
          "texto": "Fiz os 40 anos da minha esposa com 110 convidados. A picanha saiu no ponto e a farofa acabou primeiro. Ninguém quis ir embora.",
          "fonte": "WhatsApp",
          "estrelas": 5,
          "local": "Aniversário de 40 anos · Realengo",
          "real": false
        },
        {
          "nome": "Patrícia Lemos",
          "data": "2026-08-30",
          "texto": "Contratamos para a confraternização da firma, 80 pessoas. Chegaram no horário, montaram tudo e eu não precisei me preocupar com nada.",
          "fonte": "Google",
          "estrelas": 5,
          "local": "Confraternização de empresa · Bangu",
          "real": false
        },
        {
          "nome": "Marcelo Andrade",
          "data": "2026-08-15",
          "texto": "O orçamento veio em minutos pelo WhatsApp, sem enrolação. Fechamos com PIX de 50% e na festa foi tudo como combinado.",
          "fonte": "WhatsApp",
          "estrelas": 5,
          "local": "Formatura · Campo Grande",
          "real": false
        },
        {
          "nome": "Juliana Prates",
          "data": "2026-07-26",
          "texto": "Casamos num sítio em Sulacap e o buffet deu conta do recado. Meus sogros, que são exigentes, elogiaram o cupim.",
          "fonte": "Google",
          "estrelas": 4,
          "local": "Casamento · Sulacap",
          "real": false
        }
      ]
    }
  };

  // chaves que o JSON pode alterar (analytics, vídeo etc. ficam só no main.js)
  var ALLOWED = ['version', 'updatedAt', 'whatsapp', 'phoneLabel', 'email', 'instagram', 'address', 'hours',
    'quote', 'agenda', 'cardapio', 'menu', 'packages', 'reviews'];

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // mescla over em base: objetos recursivamente; listas e valores simples substituem; tipo diferente é ignorado
  function merge(base, over) {
    Object.keys(over || {}).forEach(function (k) {
      var b = base[k], o = over[k];
      if (isObj(b) && isObj(o)) merge(b, o);
      else if (b === undefined || (Array.isArray(b) === Array.isArray(o) && typeof b === typeof o)) base[k] = clone(o);
    });
    return base;
  }

  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // valida o essencial; devolve lista de problemas (vazia = ok)
  function validate(d) {
    var p = [];
    var q = d.quote || {};
    ['basePerPerson', 'baseGuests', 'minGuests', 'maxGuests', 'defaultGuests', 'drinksPerPerson', 'dishesPerPerson', 'dessertPerPerson',
      'variationPct', 'pixPercent', 'minLeadDays', 'maxMonthsAhead'].forEach(function (k) {
      if (typeof q[k] !== 'number' || !isFinite(q[k]) || q[k] < 0) p.push('quote.' + k + ' inválido');
    });
    if (!Array.isArray(q.regions) || !q.regions.length) p.push('quote.regions vazio');
    else q.regions.forEach(function (r, i) {
      if (!r.id || typeof r.addMin !== 'number' || typeof r.addMax !== 'number' || r.addMax < r.addMin) p.push('quote.regions[' + i + '] inválida');
    });
    if (!/^\d{10,15}$/.test(String(d.whatsapp || ''))) p.push('whatsapp inválido');
    var cats = d.cardapio && d.cardapio.categorias;
    if (!Array.isArray(cats) || !cats.length) p.push('cardapio.categorias vazio');
    return p;
  }

  /* carrega o JSON (timeout curto); sempre resolve: {data, source: 'json' | 'embutido', problems} */
  function load(opts) {
    opts = opts || {};
    var url = opts.url || 'data/site-data.json';
    var base = clone(DEFAULTS);
    var done = function (source, problems) { return { data: base, source: source, problems: problems || [] }; };
    if (!window.fetch || !/^https?:$/.test(location.protocol)) return Promise.resolve(done('embutido'));
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, opts.timeout || 2500);
    return fetch(url, { cache: 'no-cache', signal: ctl ? ctl.signal : undefined })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (json) {
        clearTimeout(timer);
        var pick = {};
        ALLOWED.forEach(function (k) { if (json && json[k] !== undefined) pick[k] = json[k]; });
        var merged = merge(clone(DEFAULTS), pick);
        var problems = validate(merged);
        if (problems.length) { if (window.console) console.warn('[TRG] site-data.json com problemas, usando dados embutidos:', problems); return done('embutido', problems); }
        base = merged;
        return done('json');
      })
      .catch(function (err) { clearTimeout(timer); return done('embutido', [String(err && err.message || err)]); });
  }


  /* ---------- Agenda: planilha publicada como CSV (opcional) ---------- */

  // "2026-11-07" ou "07/11/2026" (dia/mês/ano) -> "2026-11-07"; inválido -> ''
  function parseDate(s) {
    s = String(s || '').trim().replace(/^["']|["']$/g, '');
    var y, m, d, t;
    if ((t = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s))) { y = +t[1]; m = +t[2]; d = +t[3]; }
    else if ((t = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(s))) { d = +t[1]; m = +t[2]; y = +t[3]; if (y < 100) y += 2000; }
    else return '';
    var dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  // CSV simples (aspas, vírgula ou ponto e vírgula). Coluna 1 = data, coluna 2 (opcional) = motivo.
  function parseCsv(text) {
    text = String(text || '').replace(/^\uFEFF/, '');
    var firstLine = text.split(/\r?\n/, 1)[0] || '';
    var delim = (firstLine.indexOf(';') !== -1 && firstLine.indexOf(',') === -1) ? ';' : ',';
    var rows = [], row = [], cell = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    var out = [], seen = {};
    rows.forEach(function (r) {
      var d = parseDate(r[0]);
      if (!d || seen[d]) return;           // linha de cabeçalho/vazia/inválida ou repetida
      seen[d] = true;
      out.push({ data: d, motivo: String(r[1] || '').trim() });
    });
    out.sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    return out;
  }

  var AGENDA_CACHE_KEY = 'trg-agenda-v1';

  function cacheGet(url, minutes) {
    try {
      var c = JSON.parse(localStorage.getItem(AGENDA_CACHE_KEY) || 'null');
      if (c && c.url === url && Date.now() - c.t < minutes * 60000) return c;
    } catch (e) { /* sem storage */ }
    return null;
  }
  function cacheSet(url, dates) {
    try { localStorage.setItem(AGENDA_CACHE_KEY, JSON.stringify({ url: url, t: Date.now(), dates: dates })); } catch (e) { /* ignora */ }
  }

  /* Resolve sempre: { dates:[{data,motivo}], source:'json'|'planilha'|'cache', error? }.
     Sem csvUrl -> datas do JSON. Planilha com erro/indisponível -> volta para as datas do JSON. */
  function loadAgenda(agenda, opts) {
    opts = opts || {};
    var fallback = (agenda.busyDates || []).map(function (b) { return typeof b === 'string' ? { data: b, motivo: '' } : b; });
    var url = (agenda.csvUrl || '').trim();
    if (!url || !window.fetch) return Promise.resolve({ dates: fallback, source: 'json' });
    var minutes = typeof agenda.cacheMinutes === 'number' ? agenda.cacheMinutes : 10;
    var hit = opts.noCache ? null : cacheGet(url, minutes);
    if (hit) return Promise.resolve({ dates: hit.dates, source: 'cache', at: hit.t });
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, opts.timeout || 4000);
    return fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
      .then(function (text) {
        clearTimeout(timer);
        if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('a planilha não está publicada como CSV (veio uma página HTML)');
        var dates = parseCsv(text);
        cacheSet(url, dates);
        return { dates: dates, source: 'planilha', at: Date.now() };
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (window.console) console.warn('[TRG] agenda: planilha indisponível, usando datas do site-data.json:', err && err.message || err);
        return { dates: fallback, source: 'json', error: String(err && err.message || err) };
      });
  }

  window.TRG = { defaults: DEFAULTS, allowed: ALLOWED, clone: clone, merge: merge, slug: slug, validate: validate, load: load,
    parseCsv: parseCsv, parseDate: parseDate, loadAgenda: loadAgenda };
})();

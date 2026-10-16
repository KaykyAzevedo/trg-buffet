/* Painel do TRG Buffet - admin.js
   Edita data/site-data.json e publica via API do GitHub (token digitado pelo usuário, só em sessionStorage).
   NÃO é autenticação: a proteção é o token. Ver docs/PAINEL-ADMIN.md. */
(function () {
  'use strict';

  var TRG = window.TRG;
  var DATA_URL = '../data/site-data.json';
  var TOKEN_KEY = 'trg-admin-token';
  var CFG_KEY = 'trg-admin-cfg';
  var CFG = { owner: 'KaykyAzevedo', repo: 'trg-buffet', branch: 'main', path: 'data/site-data.json', message: 'Atualiza dados do site pelo painel' };
  var MAP_REGIONS = ['realengo', 'oeste', 'rj'];   // faixas ligadas às áreas do mapa do site
  var SOURCES = ['Google', 'WhatsApp', 'Instagram', 'Outro'];
  var DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  var data = TRG.clone(TRG.defaults);
  var loadedSnapshot = '';       // JSON canônico do que foi carregado (para detectar conflito)
  var source = 'embutido';
  var dirty = false;
  var calView = new Date();
  calView = new Date(calView.getFullYear(), calView.getMonth(), 1);
  var uidN = 0;

  /* ---------- utilitários ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function uid(p) { uidN += 1; return (p || 'f') + uidN; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function brl(v) { return 'R$ ' + (Math.round(v * 100) / 100).toLocaleString('pt-BR'); }

  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === false || v === null || v === undefined) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid === null || kid === undefined || kid === false) continue;
      if (Array.isArray(kid)) kid.forEach(function (k) { if (k) el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
      else el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return el;
  }

  function getp(path) {
    return String(path).split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, data);
  }
  function setp(path, val) {
    var parts = String(path).split('.');
    var o = data;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }

  function sortKeys(x) {
    if (Array.isArray(x)) return x.map(sortKeys);
    if (x && typeof x === 'object') { var o = {}; Object.keys(x).sort().forEach(function (k) { o[k] = sortKeys(x[k]); }); return o; }
    return x;
  }
  function canon(text) { try { return JSON.stringify(sortKeys(JSON.parse(text))); } catch (e) { return ''; } }

  /* ---------- estado, validação e mensagens ---------- */
  var statusEl = $('#status');
  var errorsEl = $('#errors');

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = 'bar__status' + (cls ? ' ' + cls : '');
  }
  function refreshStatus() {
    if (dirty) setStatus('Há alterações que ainda NÃO foram publicadas.', 'is-dirty');
    else setStatus(source === 'json' ? 'Dados carregados de data/site-data.json. Sem alterações pendentes.' : 'Usando os dados embutidos (não consegui ler data/site-data.json). Sem alterações pendentes.', 'is-ok');
  }
  function markDirty() {
    dirty = true;
    refreshStatus();
    scheduleValidate();
  }
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  var vt = null;
  function scheduleValidate() {
    clearTimeout(vt);
    vt = setTimeout(function () { applyInline(validate()); }, 250);
  }

  function isHttps(u) { return /^https:\/\/[^\s]+$/i.test(u); }
  function num(x) { return typeof x === 'number' && isFinite(x); }

  function validate() {
    var e = [];
    function err(path, msg) { e.push({ path: path, msg: msg }); }
    var q = data.quote;
    [['basePerPerson', 'Preço-base por pessoa'], ['drinksPerPerson', 'Bebidas por pessoa'], ['dishesPerPerson', 'Louça por pessoa'], ['dessertPerPerson', 'Sobremesas por pessoa']].forEach(function (f) {
      if (!num(q[f[0]]) || q[f[0]] < 0) err('quote.' + f[0], f[1] + ': informe um valor de 0 para cima.');
    });
    [['baseGuests', 'Convidados da base', 1], ['minGuests', 'Mínimo de pessoas', 1], ['maxGuests', 'Máximo de pessoas', 1], ['defaultGuests', 'Pessoas iniciais', 1], ['minLeadDays', 'Antecedência (dias)', 0], ['maxMonthsAhead', 'Meses à frente', 1]].forEach(function (f) {
      if (!num(q[f[0]]) || q[f[0]] < f[2] || Math.floor(q[f[0]]) !== q[f[0]]) err('quote.' + f[0], f[1] + ': informe um número inteiro (mínimo ' + f[2] + ').');
    });
    if (num(q.minGuests) && num(q.maxGuests) && q.minGuests > q.maxGuests) err('quote.maxGuests', 'O máximo de pessoas não pode ser menor que o mínimo.');
    if (num(q.defaultGuests) && num(q.minGuests) && num(q.maxGuests) && (q.defaultGuests < q.minGuests || q.defaultGuests > q.maxGuests)) err('quote.defaultGuests', 'As pessoas iniciais precisam estar entre o mínimo e o máximo.');
    if (!num(q.variationPct) || q.variationPct < 0 || q.variationPct > 50) err('quote.variationPct', 'Margem da faixa: de 0 a 50%.');
    if (!num(q.pixPercent) || q.pixPercent < 0 || q.pixPercent > 100) err('quote.pixPercent', 'Entrada via PIX: de 0 a 100%.');
    var lastUp = -1;
    q.smallEvent.forEach(function (t, i) {
      if (!num(t.upTo) || t.upTo < 1) err('quote.smallEvent.' + i + '.upTo', 'Evento pequeno: informe até quantas pessoas.');
      else if (t.upTo <= lastUp) err('quote.smallEvent.' + i + '.upTo', 'As faixas de evento pequeno devem estar em ordem crescente.');
      else lastUp = t.upTo;
      if (!num(t.add) || t.add < 0) err('quote.smallEvent.' + i + '.add', 'Evento pequeno: informe o acréscimo por pessoa.');
    });
    if (!q.regions.length) err('quote.regions', 'Mantenha ao menos uma região.');
    q.regions.forEach(function (r, i) {
      if (!String(r.short || '').trim()) err('quote.regions.' + i + '.short', 'Região: informe o nome.');
      if (!num(r.addMin) || r.addMin < 0) err('quote.regions.' + i + '.addMin', 'Região: acréscimo mínimo inválido.');
      if (!num(r.addMax) || r.addMax < r.addMin) err('quote.regions.' + i + '.addMax', 'Região: o acréscimo máximo não pode ser menor que o mínimo.');
    });
    q.extras.forEach(function (x, i) {
      if (!String(x.label || '').trim()) err('quote.extras.' + i + '.label', 'Adicional: informe o nome.');
      if (!num(x.price) || x.price < 0) err('quote.extras.' + i + '.price', 'Adicional: informe o preço.');
      if (!num(x.max) || x.max < 1) err('quote.extras.' + i + '.max', 'Adicional: informe o máximo (1 ou mais).');
    });

    var cats = data.cardapio.categorias;
    if (!cats.length) err('cardapio.categorias', 'Mantenha ao menos uma categoria no cardápio.');
    if (!cats.some(function (c) { return c.id === 'guarnicoes'; })) err('cardapio.categorias', 'A categoria "Guarnições" é necessária (alimenta o cardápio montável).');
    cats.forEach(function (c, i) {
      if (!String(c.nome || '').trim()) err('cardapio.categorias.' + i + '.nome', 'Categoria: informe o nome.');
      var total = 0;
      c.grupos.forEach(function (g) { g.itens.forEach(function (t) { if (String(t).trim()) total += 1; }); });
      if (!total) err('cardapio.categorias.' + i + '.nome', 'A categoria "' + (c.nome || i + 1) + '" precisa de ao menos um item.');
    });
    if (!num(data.menu.sidesMax) || data.menu.sidesMax < 1) err('menu.sidesMax', 'Máximo de guarnições: 1 ou mais.');
    data.menu.soups.forEach(function (s, i) { if (!String(s.label || '').trim()) err('menu.soups.' + i + '.label', 'Caldo: informe o nome.'); });
    data.menu.extraMeats.forEach(function (m, i) {
      if (!String(m.label || '').trim()) err('menu.extraMeats.' + i + '.label', 'Carne extra: informe o nome.');
      if (!num(m.perPerson) || m.perPerson < 0) err('menu.extraMeats.' + i + '.perPerson', 'Carne extra: informe o valor por pessoa.');
    });

    var a = data.agenda;
    if (a.csvUrl && !isHttps(a.csvUrl)) err('agenda.csvUrl', 'O link da planilha deve começar com https://');
    if (!num(a.cacheMinutes) || a.cacheMinutes < 0 || a.cacheMinutes > 1440) err('agenda.cacheMinutes', 'Cache da planilha: de 0 a 1440 minutos.');

    data.reviews.itens.forEach(function (r, i) {
      if (!String(r.nome || '').trim()) err('reviews.itens.' + i + '.nome', 'Avaliação: informe o nome.');
      if (String(r.texto || '').trim().length < 10) err('reviews.itens.' + i + '.texto', 'Avaliação: escreva o texto (mínimo 10 letras).');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.data || '')) err('reviews.itens.' + i + '.data', 'Avaliação: informe a data.');
      if (!num(r.estrelas) || r.estrelas < 1 || r.estrelas > 5) err('reviews.itens.' + i + '.estrelas', 'Avaliação: de 1 a 5 estrelas.');
    });
    if (data.reviews.googleUrl && !isHttps(data.reviews.googleUrl)) err('reviews.googleUrl', 'O link do Google deve começar com https://');

    if (!/^\d{10,15}$/.test(String(data.whatsapp || ''))) err('whatsapp', 'WhatsApp: só números, com DDI e DDD (ex.: 5521999998888).');
    else if (!/^55\d{10,11}$/.test(data.whatsapp)) err('whatsapp', 'WhatsApp: números do Brasil começam com 55 e têm DDD (ex.: 5521999998888).');
    if (!String(data.phoneLabel || '').trim()) err('phoneLabel', 'Informe o telefone como aparece no site.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) err('email', 'E-mail inválido.');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(data.instagram || '')) err('instagram', 'Instagram: só o nome do perfil, sem @ e sem espaços.');
    if (!data.address.filter(function (l) { return String(l).trim(); }).length) err('address', 'Informe o endereço.');
    if (!String(data.hours || '').trim()) err('hours', 'Informe o horário de atendimento.');
    return e;
  }

  function applyInline(errs) {
    $all('[data-path]').forEach(function (el) {
      var p = el.getAttribute('data-path');
      var mine = errs.filter(function (x) { return x.path === p; })[0];
      var box = el.closest('.field');
      var msg = box && box.querySelector('.field__err');
      if (mine) {
        el.setAttribute('aria-invalid', 'true');
        if (box) {
          if (!msg) { msg = h('p', { class: 'field__err', id: uid('err') }); box.appendChild(msg); }
          msg.textContent = mine.msg;
          el.setAttribute('aria-describedby', msg.id);
        }
      } else {
        el.removeAttribute('aria-invalid');
        if (msg) msg.remove();
        el.removeAttribute('aria-describedby');
      }
    });
  }

  function tabOf(path) {
    var r = String(path).split('.')[0];
    if (r === 'quote') return 'precos';
    if (r === 'cardapio' || r === 'menu') return 'cardapio';
    if (r === 'agenda') return 'agenda';
    if (r === 'reviews') return 'avaliacoes';
    return 'contato';
  }

  function showErrors(errs) {
    errorsEl.innerHTML = '';
    if (!errs.length) { errorsEl.hidden = true; return; }
    errorsEl.hidden = false;
    var ul = h('ul');
    errs.forEach(function (x) {
      var a = h('a', { href: '#', text: x.msg, on: { click: function (ev) { ev.preventDefault(); goTo(x.path); } } });
      ul.appendChild(h('li', {}, a));
    });
    errorsEl.appendChild(h('h2', { text: 'Corrija antes de continuar (' + errs.length + ')' }));
    errorsEl.appendChild(ul);
    applyInline(errs);
  }

  function goTo(path) {
    selectTab(tabOf(path), false);
    var el = $('[data-path="' + path + '"]');
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }); }
  }

  /* ---------- campos ---------- */
  function field(label, input, help, extraClass) {
    var id = input.id || (input.id = uid('in'));
    var box = h('div', { class: 'field' + (extraClass ? ' ' + extraClass : '') },
      h('label', { for: id, text: label }), input);
    if (help) {
      var hp = h('p', { class: 'field__help', id: id + '-h', text: help });
      box.appendChild(hp);
      input.setAttribute('aria-describedby', id + '-h');
    }
    return box;
  }

  function numField(label, path, o) {
    o = o || {};
    var v = getp(path);
    var input = h('input', { class: 'input', type: 'number', inputmode: o.decimal ? 'decimal' : 'numeric', step: o.step || 1, min: o.min === undefined ? 0 : o.min, 'data-path': path, value: num(v) ? String(v) : '' });
    input.addEventListener('input', function () {
      setp(path, input.value === '' ? null : Number(input.value));
      markDirty();
      if (o.onchange) o.onchange();
    });
    var box = field(label, input, o.help);
    if (o.prefix) {
      var wrap = h('div', { class: 'prefix' }, h('span', { 'aria-hidden': 'true', text: o.prefix }));
      box.insertBefore(wrap, input);
      wrap.appendChild(input);
    }
    return box;
  }

  function textField(label, path, o) {
    o = o || {};
    var v = getp(path);
    var input = o.area
      ? h('textarea', { class: 'input', rows: o.rows || 3, 'data-path': path })
      : h('input', { class: 'input', type: o.type || 'text', 'data-path': path, inputmode: o.inputmode, placeholder: o.placeholder, autocomplete: 'off', maxlength: o.max });
    input.value = o.toText ? o.toText(v) : (v === undefined || v === null ? '' : v);
    input.addEventListener('input', function () {
      setp(path, o.fromText ? o.fromText(input.value) : input.value);
      markDirty();
      if (o.onchange) o.onchange();
    });
    return field(label, input, o.help);
  }

  function btn(text, cls, fn, label) {
    return h('button', { class: 'btn ' + cls, type: 'button', text: text, 'aria-label': label, on: { click: fn } });
  }
  function iconBtn(sym, label, fn, disabled, danger) {
    return h('button', { class: 'icon-btn' + (danger ? ' icon-btn--danger' : ''), type: 'button', text: sym, 'aria-label': label, disabled: disabled ? true : null, on: { click: fn } });
  }
  function move(list, i, d) {
    var j = i + d;
    if (j < 0 || j >= list.length) return false;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    return true;
  }

  /* ---------- seções ---------- */
  var panels = {};
  ['precos', 'cardapio', 'agenda', 'avaliacoes', 'contato', 'publicar'].forEach(function (k) { panels[k] = $('#sec-' + k); });

  function rerender(name, focusSel) {
    renderers[name]();
    applyInline(validate());
    if (focusSel) { var el = $(focusSel); if (el) el.focus(); }
  }

  // recalcula o simulador quando qualquer valor de preço muda (listener único)
  panels.precos.addEventListener('input', function (ev) {
    if (panels.precos._calc && !ev.target.closest('#sim-card')) setTimeout(panels.precos._calc, 0);
  });

  /* --- Preços e regiões --- */
  function renderPrecos() {
    var p = panels.precos;
    p.innerHTML = '';
    var q = data.quote;

    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Valores base' }),
      h('p', { class: 'card__help', text: 'Usados na calculadora de orçamento do site. O preço-base vale para a quantidade de "convidados da base".' }),
      h('div', { class: 'grid' },
        numField('Preço-base por pessoa', 'quote.basePerPerson', { prefix: 'R$', decimal: true, step: 0.5 }),
        numField('Convidados da base', 'quote.baseGuests'),
        numField('Mínimo de pessoas', 'quote.minGuests'),
        numField('Máximo de pessoas', 'quote.maxGuests'),
        numField('Pessoas iniciais na calculadora', 'quote.defaultGuests'),
        numField('Margem da faixa (±%)', 'quote.variationPct', { help: 'A calculadora mostra uma faixa mín–máx em torno do valor.', decimal: true, step: 0.5 }),
        numField('Entrada via PIX (%)', 'quote.pixPercent'),
        numField('Antecedência mínima (dias)', 'quote.minLeadDays'),
        numField('Consultar datas até (meses)', 'quote.maxMonthsAhead'))));

    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Acréscimos por pessoa' }),
      h('div', { class: 'grid' },
        numField('Bebidas incluídas', 'quote.drinksPerPerson', { prefix: 'R$', decimal: true, step: 0.5 }),
        numField('Louça (em vez de descartável)', 'quote.dishesPerPerson', { prefix: 'R$', decimal: true, step: 0.5 }),
        numField('Sobremesas', 'quote.dessertPerPerson', { prefix: 'R$', decimal: true, step: 0.5 }))));

    var days = h('div', { class: 'days', role: 'group', 'aria-labelledby': 'lbl-days' });
    DAYS.forEach(function (d, i) {
      var cb = h('input', { type: 'checkbox', checked: q.closedWeekdays.indexOf(i) !== -1 });
      cb.addEventListener('change', function () {
        var s = q.closedWeekdays.filter(function (x) { return x !== i; });
        if (cb.checked) s.push(i);
        q.closedWeekdays = s.sort();
        markDirty();
      });
      days.appendChild(h('label', { class: 'check' }, cb, d));
    });
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', id: 'lbl-days', text: 'Dias da semana sem atendimento' }),
      h('p', { class: 'card__help', text: 'Marque os dias em que NÃO atende: eles aparecem como ocupados no calendário do site.' }), days));

    // evento pequeno
    var st = h('div', { class: 'rows' });
    q.smallEvent.forEach(function (t, i) {
      st.appendChild(h('div', { class: 'row' },
        h('div', { class: 'row__fields' },
          numField('Até quantas pessoas', 'quote.smallEvent.' + i + '.upTo'),
          numField('Acréscimo por pessoa', 'quote.smallEvent.' + i + '.add', { prefix: 'R$', decimal: true, step: 0.5 })),
        h('div', { class: 'row__actions' }, iconBtn('✕', 'Remover faixa ' + (i + 1), function () { q.smallEvent.splice(i, 1); markDirty(); rerender('precos'); }, false, true))));
    });
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Eventos pequenos' }),
      h('p', { class: 'card__help', text: 'Acréscimo por pessoa quando o evento tem poucos convidados. Ordem crescente (ex.: até 49 → +R$ 15; até 99 → +R$ 5).' }),
      st, btn('Adicionar faixa', 'btn--ghost btn--sm', function () {
        var last = q.smallEvent.length ? q.smallEvent[q.smallEvent.length - 1].upTo : 0;
        q.smallEvent.push({ upTo: (last || 0) + 50, add: 0 }); markDirty(); rerender('precos');
      })));

    // regiões
    var rg = h('div', { class: 'rows' });
    q.regions.forEach(function (r, i) {
      var locked = MAP_REGIONS.indexOf(r.id) !== -1;
      rg.appendChild(h('div', { class: 'row' },
        h('div', { class: 'row__fields' },
          textField('Nome curto', 'quote.regions.' + i + '.short'),
          textField('Descrição (aparece no formulário)', 'quote.regions.' + i + '.label'),
          numField('Frete mínimo por pessoa', 'quote.regions.' + i + '.addMin', { prefix: 'R$', decimal: true, step: 0.5 }),
          numField('Frete máximo por pessoa', 'quote.regions.' + i + '.addMax', { prefix: 'R$', decimal: true, step: 0.5 }),
          h('div', { class: 'field' }, h('span', { class: 'label', text: 'Código' }), h('span', { class: 'tag', text: r.id || '(novo)' }),
            locked ? h('p', { class: 'field__help', text: 'Usada pelo mapa do site: não pode ser removida.' }) : null)),
        h('div', { class: 'row__actions' },
          iconBtn('↑', 'Mover região ' + (i + 1) + ' para cima', function () { if (move(q.regions, i, -1)) { markDirty(); rerender('precos'); } }, i === 0),
          iconBtn('↓', 'Mover região ' + (i + 1) + ' para baixo', function () { if (move(q.regions, i, 1)) { markDirty(); rerender('precos'); } }, i === q.regions.length - 1),
          iconBtn('✕', 'Remover região ' + (i + 1), function () { q.regions.splice(i, 1); markDirty(); rerender('precos'); }, locked || q.regions.length < 2, true))));
    });
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Regiões e frete' }),
      h('p', { class: 'card__help', text: 'Acréscimo de frete por pessoa. Se o valor varia, preencha mínimo e máximo; se é fixo, use o mesmo número.' }),
      rg, btn('Adicionar região', 'btn--ghost btn--sm', function () {
        q.regions.push({ id: '', label: '', short: '', addMin: 0, addMax: 0 }); markDirty(); rerender('precos', '[data-path="quote.regions.' + (q.regions.length - 1) + '.short"]');
      })));

    // adicionais
    var ex = h('div', { class: 'rows' });
    q.extras.forEach(function (x, i) {
      ex.appendChild(h('div', { class: 'row' },
        h('div', { class: 'row__fields' },
          textField('Nome', 'quote.extras.' + i + '.label'),
          numField('Preço', 'quote.extras.' + i + '.price', { prefix: 'R$', decimal: true, step: 1 }),
          textField('Unidade', 'quote.extras.' + i + '.unit', { help: 'Ex.: cada, por evento' }),
          numField('Quantidade máxima', 'quote.extras.' + i + '.max', { min: 1 })),
        h('div', { class: 'row__actions' },
          iconBtn('↑', 'Mover adicional ' + (i + 1) + ' para cima', function () { if (move(q.extras, i, -1)) { markDirty(); rerender('precos'); } }, i === 0),
          iconBtn('↓', 'Mover adicional ' + (i + 1) + ' para baixo', function () { if (move(q.extras, i, 1)) { markDirty(); rerender('precos'); } }, i === q.extras.length - 1),
          iconBtn('✕', 'Remover adicional ' + (i + 1), function () { q.extras.splice(i, 1); markDirty(); rerender('precos'); }, false, true))));
    });
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Adicionais (garçom, churrasqueiro…)' }),
      h('p', { class: 'card__help', text: 'Serviços com valor fixo, somados ao total. O pacote Premium usa "garcom" e "churrasqueiro": mantenha esses dois.' }),
      ex, btn('Adicionar serviço', 'btn--ghost btn--sm', function () {
        q.extras.push({ id: '', label: '', price: 0, unit: 'cada', max: 2 }); markDirty(); rerender('precos', '[data-path="quote.extras.' + (q.extras.length - 1) + '.label"]');
      })));

    p.appendChild(simulator());
  }

  function simulator() {
    var q = data.quote;
    var region = h('select', { class: 'input', id: 'sim-region' });
    q.regions.forEach(function (r, i) { region.appendChild(h('option', { value: String(i), text: r.short || '(sem nome)' })); });
    var guests = h('input', { class: 'input', id: 'sim-guests', type: 'number', min: 1, inputmode: 'numeric', value: String(q.defaultGuests || 100) });
    var cbD = h('input', { type: 'checkbox', checked: true }), cbL = h('input', { type: 'checkbox' }), cbS = h('input', { type: 'checkbox' });
    var out = h('div', { class: 'log log--info', role: 'status', 'aria-live': 'polite' });
    function calc() {
      var g = Math.max(1, parseInt(guests.value, 10) || 1);
      var r = q.regions[parseInt(region.value, 10)] || { addMin: 0, addMax: 0 };
      var small = 0;
      for (var i = 0; i < q.smallEvent.length; i++) { if (g <= q.smallEvent[i].upTo) { small = q.smallEvent[i].add; break; } }
      var opts = (cbD.checked ? q.drinksPerPerson : 0) + (cbL.checked ? q.dishesPerPerson : 0) + (cbS.checked ? q.dessertPerPerson : 0);
      var v = q.variationPct / 100;
      var mn = Math.floor((q.basePerPerson + small + r.addMin + opts) * (1 - v)), mx = Math.ceil((q.basePerPerson + small + r.addMax + opts) * (1 + v));
      out.textContent = 'Por pessoa: ' + brl(mn) + ' a ' + brl(mx) + ' · Total (sem adicionais): ' + brl(mn * g) + ' a ' + brl(mx * g) + ' · Entrada PIX ' + q.pixPercent + '%: ' + brl(mn * g * q.pixPercent / 100) + ' a ' + brl(mx * g * q.pixPercent / 100);
    }
    [region, guests, cbD, cbL, cbS].forEach(function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
    var card = h('div', { class: 'card', id: 'sim-card' },
      h('h2', { class: 'card__title', text: 'Simulador (confira os números)' }),
      h('p', { class: 'card__help', text: 'Mostra como a calculadora do site vai responder com os valores acima.' }),
      h('div', { class: 'grid' }, field('Região', region), field('Pessoas', guests)),
      h('div', { class: 'days' }, h('label', { class: 'check' }, cbD, 'Bebidas'), h('label', { class: 'check' }, cbL, 'Louça'), h('label', { class: 'check' }, cbS, 'Sobremesas')),
      out);
    panels.precos._calc = calc;
    calc();
    return card;
  }

  /* --- Cardápio --- */
  function renderCardapio() {
    var p = panels.cardapio;
    p.innerHTML = '';
    var cats = data.cardapio.categorias;

    p.appendChild(h('div', { class: 'card card--warn' },
      h('h2', { class: 'card__title', text: 'Como funciona' }),
      h('p', { class: 'card__help', text: 'Cada categoria vira uma aba no cardápio do site (e na página para imprimir). Dentro dela há grupos (com título opcional) e itens. Use as setas para reordenar. Os itens da categoria "Guarnições" são as opções do cardápio montável.' })));

    cats.forEach(function (c, ci) {
      var base = 'cardapio.categorias.' + ci;
      var card = h('div', { class: 'card card--sub' },
        h('div', { class: 'row__fields' },
          textField('Nome da categoria', base + '.nome'),
          textField('Aviso (opcional)', base + '.nota', { help: 'Ex.: "Alteráveis ao gosto do cliente."' })),
        h('div', { class: 'row__actions' },
          h('span', { class: 'tag', text: 'código: ' + (c.id || '(novo)') }),
          iconBtn('↑', 'Mover categoria ' + (c.nome || ci + 1) + ' para cima', function () { if (move(cats, ci, -1)) { markDirty(); rerender('cardapio'); } }, ci === 0),
          iconBtn('↓', 'Mover categoria ' + (c.nome || ci + 1) + ' para baixo', function () { if (move(cats, ci, 1)) { markDirty(); rerender('cardapio'); } }, ci === cats.length - 1),
          iconBtn('✕', 'Remover categoria ' + (c.nome || ci + 1), function () { if (confirm('Remover a categoria "' + (c.nome || '') + '" e todos os itens?')) { cats.splice(ci, 1); markDirty(); rerender('cardapio'); } }, c.id === 'guarnicoes' || cats.length < 2, true)));
      c.grupos.forEach(function (g, gi) {
        var gb = base + '.grupos.' + gi;
        var items = h('div', { class: 'rows' });
        g.itens.forEach(function (t, ii) {
          var input = h('input', { class: 'input', type: 'text', 'aria-label': 'Item ' + (ii + 1) + (g.titulo ? ' de ' + g.titulo : '') + ' em ' + (c.nome || 'categoria'), value: t, 'data-path': gb + '.itens.' + ii, autocomplete: 'off' });
          input.addEventListener('input', function () { g.itens[ii] = input.value; markDirty(); });
          items.appendChild(h('div', { class: 'item-row' }, input,
            h('div', { class: 'item-row__btns' },
              iconBtn('↑', 'Mover item ' + (ii + 1) + ' (' + (g.titulo || c.nome) + ') para cima', function () { if (move(g.itens, ii, -1)) { markDirty(); rerender('cardapio', '[data-path="' + gb + '.itens.' + (ii - 1) + '"]'); } }, ii === 0),
              iconBtn('↓', 'Mover item ' + (ii + 1) + ' (' + (g.titulo || c.nome) + ') para baixo', function () { if (move(g.itens, ii, 1)) { markDirty(); rerender('cardapio', '[data-path="' + gb + '.itens.' + (ii + 1) + '"]'); } }, ii === g.itens.length - 1),
              iconBtn('✕', 'Remover item ' + (ii + 1) + ' (' + (g.titulo || c.nome) + ')', function () { g.itens.splice(ii, 1); markDirty(); rerender('cardapio'); }, false, true))));
        });
        card.appendChild(h('div', { class: 'card' },
          textField('Título do grupo (opcional)', gb + '.titulo', { help: 'Ex.: "Carne bovina". Deixe vazio se não precisar de subtítulo.' }),
          items,
          h('div', { class: 'row__actions' },
            btn('Adicionar item', 'btn--ghost btn--sm', function () { g.itens.push(''); markDirty(); rerender('cardapio', '[data-path="' + gb + '.itens.' + (g.itens.length - 1) + '"]'); }),
            c.grupos.length > 1 ? btn('Remover grupo', 'btn--danger btn--sm', function () { if (confirm('Remover este grupo?')) { c.grupos.splice(gi, 1); markDirty(); rerender('cardapio'); } }) : null)));
      });
      card.appendChild(btn('Adicionar grupo', 'btn--ghost btn--sm', function () { c.grupos.push({ titulo: '', itens: [''] }); markDirty(); rerender('cardapio'); }));
      p.appendChild(card);
    });
    p.appendChild(btn('Adicionar categoria', 'btn--primary', function () {
      cats.push({ id: '', nome: 'Nova categoria', nota: '', grupos: [{ titulo: '', itens: [''] }] }); markDirty(); rerender('cardapio', '[data-path="cardapio.categorias.' + (cats.length - 1) + '.nome"]');
    }));

    // condições (página para imprimir)
    var cond = h('div', { class: 'rows' });
    data.cardapio.condicoes.forEach(function (t, i) {
      var input = h('input', { class: 'input', type: 'text', value: t, 'aria-label': 'Condição ' + (i + 1), autocomplete: 'off' });
      input.addEventListener('input', function () { data.cardapio.condicoes[i] = input.value; markDirty(); });
      cond.appendChild(h('div', { class: 'item-row' }, input, h('div', { class: 'item-row__btns' },
        iconBtn('↑', 'Mover condição ' + (i + 1) + ' para cima', function () { if (move(data.cardapio.condicoes, i, -1)) { markDirty(); rerender('cardapio'); } }, i === 0),
        iconBtn('↓', 'Mover condição ' + (i + 1) + ' para baixo', function () { if (move(data.cardapio.condicoes, i, 1)) { markDirty(); rerender('cardapio'); } }, i === data.cardapio.condicoes.length - 1),
        iconBtn('✕', 'Remover condição ' + (i + 1), function () { data.cardapio.condicoes.splice(i, 1); markDirty(); rerender('cardapio'); }, false, true))));
    });
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Condições do serviço' }),
      h('p', { class: 'card__help', text: 'Aparecem no cardápio para imprimir/PDF (ex.: duração, reserva, PIX).' }),
      cond, btn('Adicionar condição', 'btn--ghost btn--sm', function () { data.cardapio.condicoes.push(''); markDirty(); rerender('cardapio'); })));

    // cardápio montável
    var soups = h('div', { class: 'rows' });
    data.menu.soups.forEach(function (s, i) {
      soups.appendChild(h('div', { class: 'row' }, h('div', { class: 'row__fields' }, textField('Caldo', 'menu.soups.' + i + '.label')),
        h('div', { class: 'row__actions' }, iconBtn('✕', 'Remover caldo ' + (s.label || i + 1), function () { data.menu.soups.splice(i, 1); markDirty(); rerender('cardapio'); }, false, true))));
    });
    var meats = h('div', { class: 'rows' });
    data.menu.extraMeats.forEach(function (m, i) {
      meats.appendChild(h('div', { class: 'row' },
        h('div', { class: 'row__fields' }, textField('Carne extra', 'menu.extraMeats.' + i + '.label'),
          numField('Acréscimo por pessoa', 'menu.extraMeats.' + i + '.perPerson', { prefix: 'R$', decimal: true, step: 0.5 })),
        h('div', { class: 'row__actions' }, iconBtn('✕', 'Remover carne extra ' + (m.label || i + 1), function () { data.menu.extraMeats.splice(i, 1); markDirty(); rerender('cardapio'); }, false, true))));
    });
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Cardápio montável (calculadora)' }),
      h('div', { class: 'grid' }, numField('Máximo de guarnições', 'menu.sidesMax', { min: 1 })),
      h('h3', { class: 'card__title', text: 'Caldos' }), soups,
      btn('Adicionar caldo', 'btn--ghost btn--sm', function () { data.menu.soups.push({ id: '', label: '' }); markDirty(); rerender('cardapio', '[data-path="menu.soups.' + (data.menu.soups.length - 1) + '.label"]'); }),
      h('h3', { class: 'card__title', text: 'Carnes extras' }), meats,
      btn('Adicionar carne extra', 'btn--ghost btn--sm', function () { data.menu.extraMeats.push({ id: '', label: '', perPerson: 0 }); markDirty(); rerender('cardapio', '[data-path="menu.extraMeats.' + (data.menu.extraMeats.length - 1) + '.label"]'); })));
  }

  /* --- Agenda --- */
  function sortedBusy() { data.agenda.busyDates.sort(function (a, b) { return a.data < b.data ? -1 : a.data > b.data ? 1 : 0; }); }
  function fmtBR(s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  function renderAgenda() {
    var p = panels.agenda;
    p.innerHTML = '';
    var a = data.agenda;
    var testLog = h('div', { class: 'log', role: 'status', 'aria-live': 'polite' });

    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Planilha do Google (opcional)' }),
      h('p', { class: 'card__help', text: 'Se você preencher o link da planilha publicada como CSV, as datas dela substituem as datas abaixo (que ficam como reserva se a planilha falhar). Veja o passo a passo em docs/DADOS-PARA-TROCAR.md, seção "Agenda".' }),
      h('div', { class: 'grid' },
        textField('Link da planilha (CSV)', 'agenda.csvUrl', { type: 'url', placeholder: 'https://docs.google.com/spreadsheets/d/e/…/pub?output=csv', help: 'Vazio = usa só as datas desta tela.' }),
        numField('Guardar a leitura por (minutos)', 'agenda.cacheMinutes')),
      btn('Testar planilha', 'btn--ghost btn--sm', function () {
        if (!a.csvUrl) { testLog.className = 'log log--info'; testLog.textContent = 'Preencha o link da planilha primeiro.'; return; }
        testLog.className = 'log log--info'; testLog.textContent = 'Lendo a planilha…';
        TRG.loadAgenda({ csvUrl: a.csvUrl, cacheMinutes: 0, busyDates: [] }, { noCache: true }).then(function (r) {
          if (r.source === 'planilha') { testLog.className = 'log log--ok'; testLog.textContent = 'Deu certo: ' + r.dates.length + ' data(s) encontrada(s)' + (r.dates.length ? ' (de ' + fmtBR(r.dates[0].data) + ' a ' + fmtBR(r.dates[r.dates.length - 1].data) + ').' : '.'); }
          else { testLog.className = 'log log--err'; testLog.textContent = 'Não consegui ler a planilha: ' + (r.error || 'erro desconhecido') + '. Confira se ela está publicada como CSV.'; }
        });
      }), testLog));

    // calendário
    var cal = h('div', { class: 'cal' });
    function drawCal() {
      cal.innerHTML = '';
      var y = calView.getFullYear(), m = calView.getMonth();
      var title = h('h3', { class: 'cal__title', id: 'ag-title', 'aria-live': 'polite', text: MONTHS[m] + ' de ' + y });
      cal.appendChild(h('div', { class: 'cal__head' },
        iconBtn('‹', 'Mês anterior', function () { calView = new Date(y, m - 1, 1); drawCal(); }),
        title,
        iconBtn('›', 'Próximo mês', function () { calView = new Date(y, m + 1, 1); drawCal(); })));
      var busy = {};
      a.busyDates.forEach(function (b) { busy[b.data] = true; });
      var tb = h('tbody');
      var first = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), t0 = iso(today());
      var cell = 0;
      for (var r = 0; r < 6 && cell - first < dim; r++) {
        var tr = h('tr');
        for (var c = 0; c < 7; c++, cell++) {
          var day = cell - first + 1;
          if (day < 1 || day > dim) { tr.appendChild(h('td')); continue; }
          var key = y + '-' + pad(m + 1) + '-' + pad(day);
          var b = h('button', { class: 'day' + (key < t0 ? ' is-past' : ''), type: 'button', text: String(day), 'data-iso': key, 'aria-pressed': busy[key] ? 'true' : 'false',
            'aria-label': day + ' de ' + MONTHS[m] + ' de ' + y + (busy[key] ? ', ocupada' : ', livre') + (key < t0 ? ', data passada' : ''), tabindex: day === 1 ? '0' : '-1' });
          tr.appendChild(h('td', {}, b));
        }
        tb.appendChild(tr);
      }
      var th = h('tr'); DAYS.forEach(function (d) { th.appendChild(h('th', { scope: 'col', abbr: d, text: d.slice(0, 3) })); });
      cal.appendChild(h('table', { role: 'grid', 'aria-labelledby': 'ag-title' }, h('thead', {}, th), tb));
      cal.appendChild(h('p', { class: 'muted', text: 'Toque num dia para marcar como ocupado (vermelho) ou livre. Setas do teclado movem entre os dias.' }));
    }
    cal.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-iso]');
      if (!b) return;
      var k = b.getAttribute('data-iso');
      var idx = a.busyDates.map(function (x) { return x.data; }).indexOf(k);
      if (idx === -1) a.busyDates.push({ data: k, motivo: '' }); else a.busyDates.splice(idx, 1);
      sortedBusy(); markDirty();
      drawCal(); drawList();
      var nb = $('[data-iso="' + k + '"]', cal); if (nb) nb.focus();
    });
    cal.addEventListener('keydown', function (ev) {
      var b = ev.target.closest('[data-iso]');
      if (!b) return;
      var parts = b.getAttribute('data-iso').split('-').map(Number);
      var d = new Date(parts[0], parts[1] - 1, parts[2]), n = null;
      if (ev.key === 'ArrowLeft') n = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
      else if (ev.key === 'ArrowRight') n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      else if (ev.key === 'ArrowUp') n = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
      else if (ev.key === 'ArrowDown') n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
      else if (ev.key === 'PageUp') n = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
      else if (ev.key === 'PageDown') n = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (!n) return;
      ev.preventDefault();
      calView = new Date(n.getFullYear(), n.getMonth(), 1);
      drawCal();
      var nb = $('[data-iso="' + iso(n) + '"]', cal);
      $all('.day', cal).forEach(function (x) { x.tabIndex = -1; });
      if (nb) { nb.tabIndex = 0; nb.focus(); }
    });

    var list = h('div', { class: 'dates' });
    var count = h('p', { class: 'muted', 'aria-live': 'polite' });
    function drawList() {
      list.innerHTML = '';
      count.textContent = a.busyDates.length + ' data(s) ocupada(s).';
      a.busyDates.forEach(function (b, i) {
        var input = h('input', { class: 'input', type: 'text', value: b.motivo || '', placeholder: 'Motivo (só para você)', 'aria-label': 'Motivo de ' + fmtBR(b.data), autocomplete: 'off', maxlength: 60 });
        input.addEventListener('input', function () { b.motivo = input.value; markDirty(); });
        list.appendChild(h('div', { class: 'item-row' },
          h('div', { class: 'item-row' }, h('strong', { text: fmtBR(b.data) }), input),
          iconBtn('✕', 'Liberar ' + fmtBR(b.data), function () { a.busyDates.splice(i, 1); markDirty(); drawCal(); drawList(); }, false, true)));
      });
    }
    drawCal(); drawList();
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Datas ocupadas' }),
      h('p', { class: 'card__help', text: 'O motivo é só uma anotação sua: nunca aparece no site. Não coloque dados de clientes aqui se for usar planilha pública.' }),
      cal, count, list,
      btn('Remover datas passadas', 'btn--ghost btn--sm', function () {
        var t0 = iso(today()), before = a.busyDates.length;
        a.busyDates = a.busyDates.filter(function (b) { return b.data >= t0; });
        if (a.busyDates.length !== before) markDirty();
        rerender('agenda');
      })));
  }

  /* --- Avaliações --- */
  function renderAvaliacoes() {
    var p = panels.avaliacoes;
    p.innerHTML = '';
    var r = data.reviews;
    var fake = r.itens.filter(function (x) { return !x.real; }).length;
    var avg = r.itens.length ? r.itens.reduce(function (s, x) { return s + (Number(x.estrelas) || 0); }, 0) / r.itens.length : 0;

    p.appendChild(h('div', { class: 'card card--warn' },
      h('h2', { class: 'card__title', text: 'Importante: depoimentos de exemplo' }),
      h('p', { text: 'Os depoimentos que vêm com o site são FICTÍCIOS (demonstração). Troque-os por avaliações reais de clientes, com autorização, e marque "Avaliação real". Enquanto houver avaliações não marcadas como reais, o site mostra o aviso "exemplos" e NÃO envia dados estruturados (nota e avaliações) ao Google: publicar avaliações inventadas viola as diretrizes do Google e pode gerar penalidade.' }),
      h('p', { class: 'tag' + (fake ? ' tag--warn' : ''), text: fake ? fake + ' de ' + r.itens.length + ' ainda são exemplo' : 'Todas marcadas como reais' }),
      h('p', { class: 'muted', text: 'Nota média exibida: ' + (r.itens.length ? avg.toFixed(1).replace('.', ',') : '—') + ' (' + r.itens.length + ' avaliação(ões)).' })));

    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Link do Google' }),
      h('div', { class: 'grid' }, textField('Link "Ver no Google"', 'reviews.googleUrl', { type: 'url', placeholder: 'https://g.page/r/…/review', help: 'Vazio = o link não aparece no site.' }))));

    var rows = h('div', { class: 'rows' });
    r.itens.forEach(function (x, i) {
      var b = 'reviews.itens.' + i;
      var src = h('select', { class: 'input', 'data-path': b + '.fonte' });
      SOURCES.forEach(function (s) { src.appendChild(h('option', { value: s, text: s, selected: x.fonte === s ? true : null })); });
      src.addEventListener('change', function () { x.fonte = src.value; markDirty(); });
      var stars = h('select', { class: 'input', 'data-path': b + '.estrelas' });
      [5, 4, 3, 2, 1].forEach(function (n) { stars.appendChild(h('option', { value: String(n), text: n + (n === 1 ? ' estrela' : ' estrelas'), selected: x.estrelas === n ? true : null })); });
      stars.addEventListener('change', function () { x.estrelas = Number(stars.value); markDirty(); rerender('avaliacoes'); });
      var real = h('input', { type: 'checkbox', checked: !!x.real });
      real.addEventListener('change', function () { x.real = real.checked; markDirty(); rerender('avaliacoes'); });
      rows.appendChild(h('div', { class: 'row' },
        h('div', { class: 'row__fields' },
          textField('Nome', b + '.nome'),
          textField('Evento e bairro', b + '.local', { help: 'Ex.: Aniversário · Bangu' }),
          textField('Data', b + '.data', { type: 'date' }),
          field('Onde foi publicada', src), field('Nota', stars),
          textField('Texto', b + '.texto', { area: true, rows: 3 }),
          h('label', { class: 'check' }, real, 'Avaliação real, com autorização do cliente'),
          x.real ? null : h('p', { class: 'tag tag--warn', text: 'Exemplo (fictícia)' })),
        h('div', { class: 'row__actions' },
          iconBtn('↑', 'Mover avaliação ' + (i + 1) + ' para cima', function () { if (move(r.itens, i, -1)) { markDirty(); rerender('avaliacoes'); } }, i === 0),
          iconBtn('↓', 'Mover avaliação ' + (i + 1) + ' para baixo', function () { if (move(r.itens, i, 1)) { markDirty(); rerender('avaliacoes'); } }, i === r.itens.length - 1),
          iconBtn('✕', 'Remover avaliação ' + (i + 1), function () { if (confirm('Remover esta avaliação?')) { r.itens.splice(i, 1); markDirty(); rerender('avaliacoes'); } }, false, true))));
    });
    p.appendChild(h('div', { class: 'card' }, h('h2', { class: 'card__title', text: 'Avaliações' }), rows,
      btn('Adicionar avaliação', 'btn--primary btn--sm', function () {
        r.itens.push({ nome: '', data: iso(today()), texto: '', fonte: 'Google', estrelas: 5, local: '', real: true }); markDirty(); rerender('avaliacoes', '[data-path="reviews.itens.' + (r.itens.length - 1) + '.nome"]');
      })));
  }

  /* --- Contato --- */
  function renderContato() {
    var p = panels.contato;
    p.innerHTML = '';
    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Contato e endereço' }),
      h('div', { class: 'grid' },
        textField('WhatsApp (só números)', 'whatsapp', { inputmode: 'numeric', help: 'Com 55 + DDD. Ex.: 5521999998888', max: 15 }),
        textField('Telefone como aparece no site', 'phoneLabel', { placeholder: '(21) 99999-8888' }),
        textField('E-mail', 'email', { type: 'email' }),
        textField('Instagram (sem @)', 'instagram'),
        textField('Endereço (uma linha por linha)', 'address', { area: true, rows: 3, toText: function (v) { return (v || []).join('\n'); }, fromText: function (t) { return t.split('\n'); }, help: 'Ex.: rua e número / bairro, cidade / CEP' }),
        textField('Horário de atendimento', 'hours', { help: 'Ex.: Atendimento: seg. a sáb., das 8h às 19h' }))));
    p.appendChild(h('div', { class: 'card card--warn' },
      h('p', { text: 'Estes dados aparecem no rodapé, nos links do WhatsApp e na mensagem do orçamento. O telefone e o endereço dentro dos dados de SEO (JSON-LD) e dos textos soltos do site ainda são editados no arquivo index.html.' })));
  }

  /* --- Publicar --- */
  function readCfg() {
    try { var c = JSON.parse(sessionStorage.getItem(CFG_KEY) || 'null'); if (c) Object.keys(c).forEach(function (k) { if (typeof c[k] === 'string') CFG[k] = c[k]; }); } catch (e) { /* sem storage */ }
  }
  function saveCfg() { try { sessionStorage.setItem(CFG_KEY, JSON.stringify(CFG)); } catch (e) { /* ignora */ } }
  function getToken() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignora */ } }

  var publishLog = null;
  function log(kind, html) {
    if (!publishLog) return;
    publishLog.className = 'log log--' + kind;
    publishLog.textContent = '';
    (Array.isArray(html) ? html : [html]).forEach(function (n) { publishLog.appendChild(typeof n === 'string' ? document.createTextNode(n) : n); });
  }

  function renderPublicar() {
    var p = panels.publicar;
    p.innerHTML = '';
    readCfg();
    publishLog = h('div', { class: 'log', role: 'status', 'aria-live': 'polite', id: 'publish-log' });

    var token = h('input', { class: 'input', type: 'password', id: 'gh-token', autocomplete: 'off', spellcheck: 'false', value: getToken(), 'aria-describedby': 'gh-token-h' });
    token.addEventListener('input', function () { setToken(token.value.trim()); });
    var tokenField = field('Token do GitHub', token, '');
    tokenField.querySelector('.field__help') && tokenField.querySelector('.field__help').remove();
    tokenField.appendChild(h('p', { class: 'field__help', id: 'gh-token-h', text: 'Fica só nesta aba (sessionStorage) e é enviado apenas ao GitHub. Nunca é salvo no site nem no repositório. Como criar: docs/PAINEL-ADMIN.md.' }));

    function cfgInput(label, key) {
      var i = h('input', { class: 'input', type: 'text', value: CFG[key], autocomplete: 'off' });
      i.addEventListener('input', function () { CFG[key] = i.value.trim(); saveCfg(); });
      return field(label, i);
    }
    var msg = h('input', { class: 'input', type: 'text', value: CFG.message, autocomplete: 'off', maxlength: 100 });
    msg.addEventListener('input', function () { CFG.message = msg.value; saveCfg(); });

    var force = h('input', { type: 'checkbox', id: 'force' });
    var forceRow = h('label', { class: 'check', hidden: true }, force, 'Publicar mesmo assim (sobrescreve o que está no GitHub)');

    var publishBtn = btn('Publicar no GitHub', 'btn--primary', function () { publish(force.checked, publishBtn, forceRow, force); });

    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Publicar no GitHub' }),
      h('p', { class: 'card__help', text: 'Grava data/site-data.json no repositório. O site (GitHub Pages) atualiza em 1 a 2 minutos. Cada publicação vira um commit, então dá para desfazer pelo histórico do GitHub.' }),
      tokenField,
      h('div', { class: 'row__actions' },
        btn('Esquecer token', 'btn--ghost btn--sm', function () { setToken(''); token.value = ''; log('info', 'Token removido desta aba.'); })),
      field('Mensagem da alteração', msg),
      h('details', {}, h('summary', { text: 'Avançado: repositório e arquivo' }),
        h('div', { class: 'grid' }, cfgInput('Dono', 'owner'), cfgInput('Repositório', 'repo'), cfgInput('Branch', 'branch'), cfgInput('Arquivo', 'path'))),
      forceRow, publishBtn, publishLog));

    p.appendChild(h('div', { class: 'card' },
      h('h2', { class: 'card__title', text: 'Alternativa: baixar o JSON' }),
      h('p', { class: 'card__help', text: 'Se preferir não usar token, baixe o arquivo e envie você mesmo para data/site-data.json (pelo GitHub, "Add file > Upload files"). Também dá para abrir um JSON salvo antes.' }),
      h('div', { class: 'row__actions' },
        btn('Baixar JSON', 'btn--ghost', downloadJson),
        h('label', { class: 'btn btn--ghost' }, 'Abrir arquivo JSON…', h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden', on: { change: openFile } })),
        btn('Recarregar do site (descartar alterações)', 'btn--danger', function () {
          if (dirty && !confirm('Descartar as alterações não publicadas e recarregar os dados?')) return;
          loadData().then(function () { renderAll(); });
        }))));
  }

  function b64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(bin);
  }
  function unb64(s) {
    var bin = atob(s.replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function slugUnique(list, base, key) {
    var s = TRG.slug(base) || 'item', n = s, k = 2;
    while (list.some(function (x) { return x[key] === n; })) n = s + '-' + k++;
    return n;
  }

  /* limpa e completa os dados antes de salvar */
  function buildOutput() {
    var d = TRG.clone(data);
    function trim(s) { return String(s === undefined || s === null ? '' : s).trim(); }
    d.address = d.address.map(trim).filter(Boolean);
    d.phoneLabel = trim(d.phoneLabel); d.hours = trim(d.hours); d.email = trim(d.email); d.instagram = trim(d.instagram).replace(/^@/, ''); d.whatsapp = trim(d.whatsapp);
    d.quote.regions.forEach(function (r, i) { r.short = trim(r.short); r.label = trim(r.label) || r.short; if (!r.id) r.id = slugUnique(d.quote.regions.slice(0, i), r.short, 'id'); });
    d.quote.extras.forEach(function (x, i) { x.label = trim(x.label); x.unit = trim(x.unit) || 'cada'; if (!x.id) x.id = slugUnique(d.quote.extras.slice(0, i), x.label, 'id'); });
    d.cardapio.categorias.forEach(function (c, i) {
      c.nome = trim(c.nome); c.nota = trim(c.nota);
      if (!c.id) c.id = slugUnique(d.cardapio.categorias.slice(0, i), c.nome, 'id');
      c.grupos.forEach(function (g) { g.titulo = trim(g.titulo); g.itens = g.itens.map(trim).filter(Boolean); });
      c.grupos = c.grupos.filter(function (g) { return g.itens.length; });
    });
    d.cardapio.condicoes = d.cardapio.condicoes.map(trim).filter(Boolean);
    d.menu.soups.forEach(function (s, i) { s.label = trim(s.label); if (!s.id) s.id = slugUnique(d.menu.soups.slice(0, i), s.label, 'id'); });
    d.menu.extraMeats.forEach(function (m, i) { m.label = trim(m.label); if (!m.id) m.id = slugUnique(d.menu.extraMeats.slice(0, i), m.label, 'id'); });
    d.agenda.csvUrl = trim(d.agenda.csvUrl);
    d.agenda.busyDates = d.agenda.busyDates.map(function (b) { return { data: b.data, motivo: trim(b.motivo) }; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    d.reviews.googleUrl = trim(d.reviews.googleUrl);
    d.reviews.itens.forEach(function (r) { r.nome = trim(r.nome); r.texto = trim(r.texto); r.local = trim(r.local); r.real = !!r.real; });
    d.updatedAt = iso(today());
    return JSON.stringify(d, null, 2) + '\n';
  }

  function ensureValid() {
    var errs = validate();
    showErrors(errs);
    if (errs.length) { goTo(errs[0].path); return false; }
    return true;
  }

  function downloadJson() {
    if (!ensureValid()) return;
    var text = buildOutput();
    var url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    var a = h('a', { href: url, download: 'site-data.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    setStatus('JSON baixado. Envie o arquivo para data/site-data.json no GitHub para publicar.', 'is-ok');
  }

  function openFile(ev) {
    var f = ev.target.files && ev.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { applyLoaded(String(rd.result), 'arquivo'); dirty = true; renderAll(); refreshStatus(); }
      catch (e) { log('err', 'Arquivo inválido: ' + e.message); }
    };
    rd.readAsText(f);
  }

  function explain(status, ctx) {
    if (status === 401) return 'O GitHub recusou o token (inválido, expirado ou digitado errado). Gere um novo token e cole de novo.';
    if (status === 403) return 'O token não tem permissão (ele precisa de "Contents: Read and write" neste repositório) ou o limite de requisições foi atingido. Revise o token e tente de novo.';
    if (status === 404) return 'Não encontrei o repositório ou o arquivo, ou o token não tem acesso a este repositório. Confira dono, repositório, branch e o acesso do token.';
    if (status === 409 || status === 422) return 'Conflito: o arquivo mudou no GitHub enquanto você editava. Nada foi sobrescrito. Use "Recarregar do site" e refaça a alteração, ou marque "Publicar mesmo assim".';
    return 'O GitHub respondeu com erro ' + status + (ctx ? ' (' + ctx + ')' : '') + '.';
  }

  async function publish(force, publishBtn, forceRow, forceBox) {
    if (!ensureValid()) return;
    var token = getToken();
    if (!token) { log('err', 'Cole o token do GitHub acima (ou use "Baixar JSON").'); $('#gh-token') && $('#gh-token').focus(); return; }
    var api = 'https://api.github.com/repos/' + encodeURIComponent(CFG.owner) + '/' + encodeURIComponent(CFG.repo) + '/contents/' + CFG.path.split('/').map(encodeURIComponent).join('/');
    var headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    publishBtn.disabled = true;
    try {
      log('info', 'Verificando o arquivo no GitHub…');
      var res = await fetch(api + '?ref=' + encodeURIComponent(CFG.branch), { headers: headers, cache: 'no-store' });
      var sha = null;
      if (res.status === 200) {
        var remote = await res.json();
        sha = remote.sha;
        var remoteCanon = canon(unb64(remote.content || ''));
        if (!force && remoteCanon !== loadedSnapshot) {
          forceRow.hidden = false;
          log('err', 'O arquivo no GitHub é diferente do que você abriu (alguém publicou antes, ou os dados não foram carregados do site). Nada foi sobrescrito. Use "Recarregar do site" para ver a versão atual e refazer suas mudanças, ou marque "Publicar mesmo assim".');
          return;
        }
      } else if (res.status !== 404) {
        log('err', explain(res.status, 'leitura'));
        return;
      }
      log('info', 'Publicando…');
      var text = buildOutput();
      var body = { message: CFG.message || 'Atualiza dados do site pelo painel', content: b64(text), branch: CFG.branch };
      if (sha) body.sha = sha;
      var put = await fetch(api, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) });
      if (put.status === 200 || put.status === 201) {
        var out = await put.json();
        loadedSnapshot = canon(text);
        dirty = false;
        data = TRG.merge(TRG.clone(TRG.defaults), JSON.parse(text));
        forceRow.hidden = true; forceBox.checked = false;
        refreshStatus();
        var link = out.commit && out.commit.html_url ? h('a', { href: out.commit.html_url, target: '_blank', rel: 'noopener', text: 'ver a alteração no GitHub' }) : '';
        log('ok', ['Publicado! O site atualiza em 1 a 2 minutos (', link, ').']);
      } else {
        log('err', explain(put.status, 'gravação'));
      }
    } catch (e) {
      log('err', 'Não consegui falar com o GitHub (' + (e && e.message || 'sem conexão') + '). Verifique sua internet e tente de novo. Seus dados continuam aqui.');
    } finally {
      publishBtn.disabled = false;
    }
  }

  /* ---------- pré-visualização ---------- */
  function preview() {
    if (!ensureValid()) return;
    var d = JSON.parse(buildOutput());
    var body = $('#preview-body');
    body.innerHTML = '';
    var q = d.quote;
    function est(r, g) {
      var small = 0;
      for (var i = 0; i < q.smallEvent.length; i++) { if (g <= q.smallEvent[i].upTo) { small = q.smallEvent[i].add; break; } }
      var v = q.variationPct / 100;
      return [Math.floor((q.basePerPerson + small + r.addMin) * (1 - v)), Math.ceil((q.basePerPerson + small + r.addMax) * (1 + v))];
    }
    var tb = h('tbody');
    d.quote.regions.forEach(function (r) {
      var e = est(r, q.baseGuests);
      tb.appendChild(h('tr', {}, h('td', { text: r.short }), h('td', { text: brl(e[0]) + ' a ' + brl(e[1]) }), h('td', { text: brl(e[0] * q.baseGuests) + ' a ' + brl(e[1] * q.baseGuests) })));
    });
    body.appendChild(h('div', { class: 'pv' }, h('h3', { text: 'Preços (' + q.baseGuests + ' convidados, sem opcionais)' }),
      h('table', {}, h('thead', {}, h('tr', {}, h('th', { text: 'Região' }), h('th', { text: 'Por pessoa' }), h('th', { text: 'Total' }))), tb)));
    var cm = h('div', { class: 'pv' }, h('h3', { text: 'Cardápio' }));
    d.cardapio.categorias.forEach(function (c) {
      cm.appendChild(h('p', {}, h('strong', { text: c.nome }), c.nota ? ' — ' + c.nota : ''));
      c.grupos.forEach(function (g) {
        if (g.titulo) cm.appendChild(h('p', { class: 'muted', text: g.titulo }));
        var ul = h('ul'); g.itens.forEach(function (t) { ul.appendChild(h('li', { text: t })); }); cm.appendChild(ul);
      });
    });
    body.appendChild(cm);
    var ag = h('div', { class: 'pv' }, h('h3', { text: 'Agenda' }),
      h('p', { text: d.agenda.busyDates.length + ' data(s) ocupada(s)' + (d.agenda.csvUrl ? ', com planilha ligada (as datas da planilha substituem estas).' : '.') }));
    var next = d.agenda.busyDates.filter(function (b) { return b.data >= iso(today()); }).slice(0, 8);
    if (next.length) ag.appendChild(h('p', { class: 'muted', text: 'Próximas: ' + next.map(function (b) { return fmtBR(b.data); }).join(', ') }));
    body.appendChild(ag);
    var rv = h('div', { class: 'pv' }, h('h3', { text: 'Avaliações' }));
    d.reviews.itens.forEach(function (r) {
      rv.appendChild(h('p', {}, h('strong', { text: r.nome }), ' · ' + '★'.repeat(r.estrelas) + ' · ' + r.fonte + (r.real ? '' : ' · EXEMPLO'), h('br'), r.texto));
    });
    body.appendChild(rv);
    body.appendChild(h('div', { class: 'pv' }, h('h3', { text: 'Contato' }), h('p', { text: d.phoneLabel + ' · ' + d.email + ' · @' + d.instagram }), h('p', { text: d.address.join(' / ') }), h('p', { text: d.hours })));
    var dlg = $('#preview');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  /* ---------- abas (WAI-ARIA) ---------- */
  var tabs = $all('[role="tab"]');
  function selectTab(name, focus) {
    tabs.forEach(function (t) {
      var on = t.id === 'tab-' + name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.id.replace('tab-', ''), false); });
    t.addEventListener('keydown', function (e) {
      var n = null, vertical = window.matchMedia('(min-width: 900px)').matches;
      var nextK = vertical ? 'ArrowDown' : 'ArrowRight', prevK = vertical ? 'ArrowUp' : 'ArrowLeft';
      if (e.key === nextK || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === prevK || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); selectTab(tabs[n].id.replace('tab-', ''), true); }
    });
  });

  /* ---------- carga ---------- */
  var renderers = { precos: renderPrecos, cardapio: renderCardapio, agenda: renderAgenda, avaliacoes: renderAvaliacoes, contato: renderContato, publicar: renderPublicar };
  function renderAll() { Object.keys(renderers).forEach(function (k) { renderers[k](); }); applyInline(validate()); }

  function applyLoaded(text, src) {
    var json = JSON.parse(text);                       // lança se inválido
    var pick = {};
    TRG.allowed.forEach(function (k) { if (json[k] !== undefined) pick[k] = json[k]; });
    var merged = TRG.merge(TRG.clone(TRG.defaults), pick);
    // agenda: aceita lista de strings antiga
    merged.agenda.busyDates = (merged.agenda.busyDates || []).map(function (b) { return typeof b === 'string' ? { data: b, motivo: '' } : { data: b.data, motivo: b.motivo || '' }; });
    data = merged;
    source = src === 'arquivo' ? 'json' : 'json';
    if (src !== 'arquivo') loadedSnapshot = canon(text);
  }

  function loadData() {
    return fetch(DATA_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (text) { applyLoaded(text, 'site'); dirty = false; refreshStatus(); })
      .catch(function () { data = TRG.clone(TRG.defaults); source = 'embutido'; loadedSnapshot = ''; dirty = false; refreshStatus(); });
  }

  $('#btn-preview').addEventListener('click', preview);
  $('#btn-download').addEventListener('click', downloadJson);
  $('#btn-goto-publish').addEventListener('click', function () { selectTab('publicar', true); });
  $('#preview-close').addEventListener('click', function () { $('#preview').close(); });

  loadData().then(function () {
    renderAll();
    window.__trgAdmin = { get data() { return data; }, get snapshot() { return loadedSnapshot; }, validate: validate, buildOutput: buildOutput, canon: canon };
  });
})();

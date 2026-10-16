/* TRG Buffet - cardapio.js: monta o cardápio imprimível a partir de data/site-data.json (com fallback embutido). */
(function () {
  'use strict';

  function $(s, c) { return (c || document).querySelector(s); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function brl(v) { return 'R$ ' + (Math.round(v * 100) / 100).toLocaleString('pt-BR'); }
  function fmtDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  TRG.load({ url: 'data/site-data.json' }).then(function (r) {
    var d = r.data;
    var q = d.quote;

    $('[data-sub]').textContent = 'Base para ' + q.baseGuests + ' pessoas, a partir de ' + brl(q.basePerPerson) + ' por pessoa. Guarnições alteráveis ao seu gosto.';

    // categorias
    var root = $('[data-categorias]');
    (d.cardapio.categorias || []).forEach(function (c) {
      var sec = el('section', 'cat');
      var h = el('h2', 'cat__title', c.nome);
      h.id = 'cat-' + TRG.slug(c.id || c.nome);
      sec.setAttribute('aria-labelledby', h.id);
      sec.appendChild(h);
      if (c.nota) sec.appendChild(el('p', 'cat__note', c.nota));
      (c.grupos || []).forEach(function (g) {
        if (g.titulo) sec.appendChild(el('h3', 'group__title', g.titulo));
        var ul = el('ul', 'items');
        (g.itens || []).forEach(function (t) { ul.appendChild(el('li', '', t)); });
        sec.appendChild(ul);
      });
      root.appendChild(sec);
    });

    // valores e frete
    var body = $('[data-valores-body]');
    var frete = el('div');
    frete.appendChild(el('h3', '', 'Frete por região (por pessoa)'));
    var kv = el('ul', 'kv');
    q.regions.forEach(function (rg) {
      var li = el('li');
      li.appendChild(el('span', '', rg.short || rg.label));
      li.appendChild(el('span', '', !rg.addMax ? 'sem acréscimo' : '+' + (rg.addMin === rg.addMax ? brl(rg.addMin) : brl(rg.addMin) + ' a ' + brl(rg.addMax))));
      kv.appendChild(li);
    });
    frete.appendChild(kv);
    body.appendChild(frete);

    var opc = el('div');
    opc.appendChild(el('h3', '', 'Opcionais'));
    var kv2 = el('ul', 'kv');
    function row(list, a, b) { var li = el('li'); li.appendChild(el('span', '', a)); li.appendChild(el('span', '', b)); list.appendChild(li); }
    row(kv2, 'Bebidas incluídas', '+' + brl(q.drinksPerPerson) + '/pessoa');
    row(kv2, 'Louça (em vez de descartável)', '+' + brl(q.dishesPerPerson) + '/pessoa');
    row(kv2, 'Sobremesas', '+' + brl(q.dessertPerPerson) + '/pessoa');
    (q.extras || []).forEach(function (x) { row(kv2, x.label, brl(x.price) + ' ' + x.unit); });
    opc.appendChild(kv2);
    body.appendChild(opc);
    $('[data-valores]').hidden = false;

    // condições
    var conds = (d.cardapio.condicoes || []).slice();
    if (!conds.some(function (t) { return /pix/i.test(t); })) conds.push('Reserva com entrada de ' + q.pixPercent + '% via PIX, após confirmarmos a data.');
    if (conds.length) {
      var ul = $('[data-cond-list]');
      conds.forEach(function (t) { ul.appendChild(el('li', '', t)); });
      $('[data-cond]').hidden = false;
    }

    // contato
    var c = $('[data-contato]');
    c.className = 'contact';
    c.appendChild(el('strong', '', 'TRG Buffet'));
    c.appendChild(el('span', '', 'WhatsApp: ' + d.phoneLabel));
    c.appendChild(el('span', '', d.email + ' · @' + d.instagram));
    c.appendChild(el('span', '', (d.address || []).join(' · ')));
    c.appendChild(el('span', '', d.hours));
    $('[data-fine]').textContent = 'Valores estimados, sujeitos a confirmação. O preço final depende de frete, cardápio e disponibilidade.' +
      (d.updatedAt ? ' Atualizado em ' + fmtDate(d.updatedAt) + '.' : '');

    document.documentElement.setAttribute('data-source', r.source);
  });

  /* ações */
  var hint = $('#hint');
  $('#btn-print').addEventListener('click', function () {
    hint.textContent = 'Na janela que abrir, escolha "Salvar como PDF" no lugar da impressora.';
    window.print();
  });

  $('#btn-share').addEventListener('click', function () {
    var data = { title: 'Cardápio do TRG Buffet', text: 'Cardápio do TRG Buffet: churrasco completo para o seu evento.', url: location.href.split('#')[0] };
    if (navigator.share) {
      navigator.share(data).catch(function (e) { if (e && e.name !== 'AbortError') copy(data.url); });
    } else copy(data.url);
  });

  function copy(url) {
    function ok() { hint.textContent = 'Link copiado! Cole onde quiser compartilhar.'; }
    function manual() { hint.textContent = 'Copie o endereço da barra do navegador para compartilhar: ' + url; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, manual);
    else {
      try {
        var t = document.createElement('textarea');
        t.value = url; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        var done = document.execCommand('copy');
        document.body.removeChild(t);
        if (done) ok(); else manual();
      } catch (e) { manual(); }
    }
  }
})();

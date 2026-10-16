/* TRG Buffet - main.js
   JS puro, sem dependências. Ver docs/ARQUITETURA.md.
   Hooks no HTML: [data-tabs], .header__toggle, #form-orcamento, [data-whatsapp], [data-year] */
(function () {
  'use strict';

  /* ==== CONFIGURAÇÃO ====
     Os DADOS do negócio (contato, preços, regiões, cardápio, pacotes, agenda, avaliações) vivem em
     js/site.js (valores embutidos, usados se a rede falhar) e em data/site-data.json (editável pelo painel /admin/).
     Aqui ficam só as opções técnicas que o JSON não altera. Ver docs/DADOS-PARA-TROCAR.md. */
  var TRG = window.TRG;
  var SITE = TRG.clone(TRG.defaults);

  /* ---- Vídeo do hero (opcional): ponha o arquivo em `src` e mude enabled para true ---- */
  SITE.heroVideo = {
    enabled: false,
    src: 'assets/video/hero.mp4'
  };

  /* ---- Analytics (opcional). Com provider vazio NADA é carregado nem enviado. ---- */
  SITE.analytics = {
    provider: '',                          // '' (desligado) | 'plausible' | 'ga4'
    plausibleDomain: '',                   // ex.: 'trgbuffet.com.br' (obrigatório p/ plausible)
    plausibleScript: 'https://plausible.io/js/script.js',   // ou a URL do seu servidor Plausible
    ga4Id: '',                             // ex.: 'G-XXXXXXXXXX' (obrigatório p/ ga4)
    respectDoNotTrack: true                // não carrega se o navegador enviar Do Not Track
  };

  var WHATSAPP_NUMBER = SITE.whatsapp;

  function boot() {
  WHATSAPP_NUMBER = SITE.whatsapp;

  // guarnições do cardápio montável = itens da categoria "guarnicoes" do cardápio
  (function () {
    var cat = (SITE.cardapio.categorias || []).filter(function (c) { return c.id === 'guarnicoes'; })[0];
    var items = [];
    if (cat) (cat.grupos || []).forEach(function (g) { (g.itens || []).forEach(function (n) { items.push(n); }); });
    SITE.menu.sides = items.map(function (n) { return { id: TRG.slug(n), label: n }; });
  })();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Analytics opcional (SITE.analytics) ---------- */
  var analytics = (function () {
    var A = SITE.analytics || {};
    var dnt = A.respectDoNotTrack && (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true);
    var ready = false;
    function load(src, attrs) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
      document.head.appendChild(s);
    }
    if (!dnt && A.provider === 'plausible' && A.plausibleDomain) {
      window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
      load(A.plausibleScript, { defer: '', 'data-domain': A.plausibleDomain });
      ready = true;
    } else if (!dnt && A.provider === 'ga4' && /^G-[A-Z0-9]+$/i.test(A.ga4Id || '')) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', A.ga4Id);
      load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.ga4Id));
      ready = true;
    }
    return { enabled: ready, provider: A.provider };
  })();

  // nunca enviar dados pessoais (bairro, data exata, mensagem): só categorias
  function track(name, props) {
    if (!analytics.enabled) return;
    try {
      if (analytics.provider === 'plausible') window.plausible(name, props ? { props: props } : undefined);
      else if (analytics.provider === 'ga4') window.gtag('event', name, props || {});
    } catch (e) { /* analytics nunca deve quebrar o site */ }
  }

  function placeOf(el) {
    if (el.closest('.dock')) return 'barra-inferior';
    if (el.closest('.whatsapp-float')) return 'flutuante';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.footer')) return 'rodape';
    if (el.closest('.header')) return 'menu';
    return 'pagina';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-whatsapp')) track('whatsapp_click', { local: placeOf(a) });
    else if (href === '#orcamento') track('orcamento_click', { local: placeOf(a) });
    else if (href === '#cardapio') track('cardapio_click', { local: placeOf(a) });
  });

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- PWA: service worker (só em http/https) ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sem SW: o site segue normal */ });
    });
  }

  /* ---------- Tema claro/escuro ---------- */
  (function () {
    var root = document.documentElement;
    var btn = $('[data-theme-toggle]');
    var meta = $('meta[name="theme-color"]');
    function saved() {
      try { var s = localStorage.getItem('trg-theme'); return (s === 'light' || s === 'dark') ? s : null; } catch (e) { return null; }
    }
    function apply(t, persist) {
      root.setAttribute('data-theme', t);
      if (meta) meta.setAttribute('content', t === 'light' ? '#F7F0DC' : '#1E2A2A');
      if (btn) {
        btn.setAttribute('aria-pressed', String(t === 'light'));
        $('[data-theme-label]', btn).textContent = t === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro';
      }
      if (persist) { try { localStorage.setItem('trg-theme', t); } catch (e) { /* sem storage: vale só nesta visita */ } }
    }
    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        apply(next, true);
        track('tema', { tema: next });
      });
    }
    // sem escolha salva, acompanha mudanças do sistema
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var onChange = function (e) { if (!saved()) apply(e.matches ? 'light' : 'dark', false); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }
  })();

  /* ---------- Ano no rodapé ---------- */
  $all('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Dados do negócio nos elementos [data-site] ---------- */
  $all('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (k === 'phone') el.textContent = SITE.phoneLabel;
    else if (k === 'email') { el.textContent = SITE.email; el.href = 'mailto:' + SITE.email; }
    else if (k === 'instagram') { el.textContent = '@' + SITE.instagram; el.href = 'https://www.instagram.com/' + SITE.instagram; }
    else if (k === 'hours') el.textContent = SITE.hours;
    else if (k === 'address') {
      el.textContent = '';
      SITE.address.forEach(function (l, i) {
        if (i) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(l));
      });
    }
  });

  /* ---------- Número do WhatsApp nos links ---------- */
  $all('a[data-whatsapp]').forEach(function (a) {
    a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + WHATSAPP_NUMBER);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Header: fundo ao rolar, esconde ao descer ---------- */
  var header = $('.header');
  var toggle = $('.header__toggle');
  var nav = $('#menu-principal');
  var menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.visually-hidden').textContent = open ? 'Fechar menu' : 'Abrir menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    header.classList.remove('is-hidden');
    // fundo da página inerte enquanto o drawer está aberto (foco não vaza)
    $all('main, .footer, .whatsapp-float').forEach(function (el) { el.inert = open; });
  }

  if (header && toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!menuOpen); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches && menuOpen) setMenu(false);
    });

    var lastY = window.scrollY;
    var ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      if (!menuOpen) {
        if (y > lastY + 6 && y > 200) header.classList.add('is-hidden');
        else if (y < lastY - 6 || y <= 200) header.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
    // mostra o header ao focar algo nele via teclado
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  /* ---------- Fallback das fotos: se o WebP falhar, cai no SVG ---------- */
  $all('picture img').forEach(function (img) {
    img.addEventListener('error', function () {
      var pic = img.parentNode;
      $all('source', pic).forEach(function (s) { pic.removeChild(s); });
    });
  });

  /* ---------- Vídeo do hero (opcional) ---------- */
  (function () {
    var wrap = $('[data-hero-video]');
    if (!wrap) return;
    var video = $('video', wrap);
    var btn = $('[data-hero-video-toggle]');
    var HV = SITE.heroVideo || {};
    var src = HV.enabled ? (HV.src || video.getAttribute('data-src')) : '';
    var userPaused = false;

    function connectionOk() {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!c) return true;
      if (c.saveData) return false;
      if (/(^|-)2g$|^3g$/.test(c.effectiveType || '')) return false;
      if (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 1.5) return false;
      return true;
    }

    if (reduceMotion || !src || !connectionOk() || !/^https?:$/.test(location.protocol)) return;

    function start() {
      if (window.innerWidth < 640) video.setAttribute('poster', 'assets/fotos/hero-bg-800.webp');
      video.addEventListener('playing', function () {
        wrap.classList.add('is-playing');
        btn.hidden = false;
      });
      video.addEventListener('error', function () { wrap.classList.remove('is-playing'); btn.hidden = true; });
      video.src = src;
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: segue a foto */ });

      // economiza bateria: pausa fora da tela e com a aba oculta
      var visible = true;
      function sync() {
        if (userPaused) return;
        if (visible && !document.hidden) { var q = video.play(); if (q && q.catch) q.catch(function () {}); }
        else video.pause();
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(wrap);
      }
      document.addEventListener('visibilitychange', sync);

      btn.addEventListener('click', function () {
        userPaused = !userPaused;
        btn.setAttribute('aria-pressed', String(userPaused));
        $('span', btn).textContent = userPaused ? 'Reproduzir vídeo' : 'Pausar vídeo';
        if (userPaused) video.pause(); else sync();
      });
    }

    // só inicia se o arquivo existir (HEAD) e depois do carregamento, para não competir com o LCP
    window.addEventListener('load', function () {
      setTimeout(function () {
        fetch(src, { method: 'HEAD' }).then(function (res) { if (res.ok) start(); }).catch(function () {});
      }, 400);
    });
  })();

  /* ---------- Brasas no hero ---------- */
  var hero = $('.hero');
  if (hero && !reduceMotion) {
    var colors = ['#D22E29', '#E0C27A', '#C8A855', '#D22E29'];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('span');
      s.className = 'hero__ember';
      s.setAttribute('aria-hidden', 'true');
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.setProperty('--s', (3 + Math.random() * 4).toFixed(1) + 'px');
      s.style.setProperty('--c', colors[i % colors.length]);
      s.style.setProperty('--d', (7 + Math.random() * 8).toFixed(1) + 's');
      s.style.setProperty('--delay', (-Math.random() * 12).toFixed(1) + 's');
      s.style.setProperty('--dx', (Math.random() * 80 - 40).toFixed(0) + 'px');
      hero.appendChild(s);
    }
  }

  /* ---------- Cardápio a partir dos dados (SITE.cardapio) ---------- */
  (function () {
    var root = $('[data-tabs]');
    var cats = SITE.cardapio && SITE.cardapio.categorias;
    if (!root || !cats || !cats.length) return;
    var list = $('[role="tablist"]', root);
    $all('.tabs__panel', root).forEach(function (p) { p.parentNode.removeChild(p); });
    list.innerHTML = '';
    cats.forEach(function (c, i) {
      var id = TRG.slug(c.id || c.nome) || ('cat' + i);
      var tab = document.createElement('button');
      tab.className = 'tabs__tab';
      tab.type = 'button';
      tab.id = 'tab-' + id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'painel-' + id);
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      if (i) tab.tabIndex = -1;
      tab.textContent = c.nome;
      list.appendChild(tab);

      var panel = document.createElement('div');
      panel.className = 'tabs__panel';
      panel.id = 'painel-' + id;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      panel.hidden = i !== 0;
      if (c.nota) {
        var n = document.createElement('p');
        n.className = 'menu__note';
        n.textContent = c.nota;
        panel.appendChild(n);
      }
      (c.grupos || []).forEach(function (g) {
        if (g.titulo) {
          var h = document.createElement('h3');
          h.className = 'menu__group-title';
          h.textContent = g.titulo;
          panel.appendChild(h);
        }
        var ul = document.createElement('ul');
        ul.className = 'menu__list';
        (g.itens || []).forEach(function (t) {
          var li = document.createElement('li');
          li.className = 'menu__item';
          li.textContent = t;
          ul.appendChild(li);
        });
        panel.appendChild(ul);
      });
      root.appendChild(panel);
    });
  })();

  /* ---------- Avaliações a partir dos dados (SITE.reviews) ---------- */
  (function () {
    var list = $('.testimonials__list');
    var R = SITE.reviews || {};
    var items = (R.itens || []).filter(function (r) { return r && r.nome && r.texto; });
    if (!list || !items.length) return;

    var MONTHS_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    function monthYear(s) {
      var m = /^(\d{4})-(\d{2})-\d{2}$/.exec(s || '');
      return m ? MONTHS_ABBR[+m[2] - 1] + '/' + m[1] : '';
    }
    function stars(n) { n = Math.max(0, Math.min(5, Math.round(n))); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
    function initials(name) {
      var p = String(name).trim().split(/\s+/);
      return ((p[0] || '').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
    }

    var real = items.filter(function (r) { return r.real === true; });
    var basis = real.length ? real : items;                 // sem avaliação real: a média é só dos exemplos
    var avg = basis.reduce(function (s, r) { return s + (Number(r.estrelas) || 0); }, 0) / basis.length;
    var avgText = avg.toFixed(1).replace('.', ',');
    var exampleMode = real.length === 0;

    list.innerHTML = '';
    items.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'testimonials__item';
      var fig = document.createElement('figure');
      fig.className = 'testimonial';
      var st = document.createElement('span');
      st.className = 'testimonial__stars';
      st.setAttribute('role', 'img');
      st.setAttribute('aria-label', r.estrelas + ' de 5 estrelas');
      st.textContent = stars(r.estrelas);
      var bq = document.createElement('blockquote');
      bq.className = 'testimonial__quote';
      var p = document.createElement('p');
      p.textContent = r.texto;
      bq.appendChild(p);
      var cap = document.createElement('figcaption');
      cap.className = 'testimonial__author';
      var av = document.createElement('span');
      av.className = 'testimonial__avatar';
      av.setAttribute('aria-hidden', 'true');
      av.textContent = initials(r.nome);
      var who = document.createElement('span');
      who.appendChild(document.createTextNode(r.nome));
      var meta = document.createElement('span');
      meta.className = 'testimonial__meta';
      meta.textContent = r.local || '';
      who.appendChild(meta);
      var src = document.createElement('span');
      src.className = 'testimonial__src';
      var when = monthYear(r.data);
      src.textContent = [r.fonte, when].filter(Boolean).join(' · ');
      who.appendChild(src);
      if (r.real !== true) {
        var ex = document.createElement('span');
        ex.className = 'testimonial__example';
        ex.textContent = 'Exemplo';
        who.appendChild(ex);
      }
      cap.appendChild(av);
      cap.appendChild(who);
      fig.appendChild(st);
      fig.appendChild(bq);
      fig.appendChild(cap);
      li.appendChild(fig);
      list.appendChild(li);
    });

    // resumo: nota média, quantidade, selo e link do Google
    var old = $('.reviews__summary');
    if (old) old.parentNode.removeChild(old);
    var sum = document.createElement('div');
    sum.className = 'reviews__summary';
    var score = document.createElement('p');
    score.className = 'reviews__score';
    var strong = document.createElement('strong');
    strong.textContent = avgText;
    var sc = document.createElement('span');
    sc.className = 'reviews__stars';
    sc.setAttribute('role', 'img');
    sc.setAttribute('aria-label', 'Nota média ' + avgText + ' de 5');
    sc.textContent = stars(avg);
    score.appendChild(strong);
    score.appendChild(sc);
    var count = document.createElement('p');
    count.className = 'reviews__count';
    count.textContent = (exampleMode ? 'Média dos depoimentos de exemplo' : 'Nota média') + ' · ' + basis.length + (basis.length === 1 ? ' avaliação' : ' avaliações');
    var seal = document.createElement('span');
    seal.className = 'reviews__seal' + (exampleMode ? ' reviews__seal--example' : '');
    seal.textContent = exampleMode ? 'Depoimentos de exemplo (demonstração)' : 'Avaliações reais de clientes';
    var left = document.createElement('div');
    left.appendChild(score);
    left.appendChild(count);
    sum.appendChild(left);
    sum.appendChild(seal);
    if (R.googleUrl && /^https:\/\//i.test(R.googleUrl)) {
      var g = document.createElement('a');
      g.className = 'btn btn--ghost reviews__google';
      g.href = R.googleUrl;
      g.target = '_blank';
      g.rel = 'noopener noreferrer';
      g.textContent = 'Ver no Google';
      sum.appendChild(g);
    }
    list.parentNode.insertBefore(sum, list);

    // Dados estruturados (JSON-LD): SÓ com avaliações reais (real: true). Exemplos nunca entram.
    var ld = $('script[type="application/ld+json"]');
    if (ld) {
      try {
        var obj = JSON.parse(ld.textContent);
        delete obj.aggregateRating;
        delete obj.review;
        if (real.length) {
          var ravg = real.reduce(function (s, r) { return s + (Number(r.estrelas) || 0); }, 0) / real.length;
          obj.aggregateRating = { '@type': 'AggregateRating', ratingValue: Math.round(ravg * 10) / 10, reviewCount: real.length, bestRating: 5, worstRating: 1 };
          obj.review = real.map(function (r) {
            var rv = { '@type': 'Review', author: { '@type': 'Person', name: r.nome }, reviewRating: { '@type': 'Rating', ratingValue: r.estrelas, bestRating: 5, worstRating: 1 }, reviewBody: r.texto };
            if (/^\d{4}-\d{2}-\d{2}$/.test(r.data || '')) rv.datePublished = r.data;
            return rv;
          });
        }
        ld.textContent = JSON.stringify(obj, null, 2);
      } catch (e) { /* JSON-LD intacto se não der para ler */ }
    }
  })();

  /* ---------- Abas do cardápio (WAI-ARIA tabs) ---------- */
  $all('[data-tabs]').forEach(function (root) {
    var list = $('[role="tablist"]', root);
    var tabs = $all('[role="tab"]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function moveIndicator() {
      var active = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
      if (!active) return;
      list.style.setProperty('--ind-x', active.offsetLeft + 'px');
      list.style.setProperty('--ind-w', active.offsetWidth + 'px');
    }

    function select(index, focus) {
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
      moveIndicator();
      var t = tabs[index];
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { list.classList.add('is-animated'); select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var n = tabs.length, next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % n;
        else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        if (next !== null) { e.preventDefault(); list.classList.add('is-animated'); select(next, true); }
      });
    });

    var initial = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    select(initial < 0 ? 0 : initial, false);
    window.addEventListener('resize', moveIndicator);
    window.addEventListener('load', moveIndicator);
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(moveIndicator);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', moveIndicator);
    }
    // a largura das abas muda quando a fonte troca: reposiciona o indicador
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(moveIndicator);
      tabs.forEach(function (t) { ro.observe(t); });
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealSel = [
    '.section__title', '.section__lead', '.about__grid > p', '.about__highlight', '.menu .tabs',
    '.menu__price-note', '.includes__item', '.steps__item', '.steps__note', '.gallery__item',
    '.testimonial', '.form', '.faq__item', '.numbers__item', '.areas__chip', '.areas__note', '.footer__brand', '.footer__col'
  ].join(',');
  var targets = $all(revealSel);

  if ('IntersectionObserver' in window && !reduceMotion) {
    // stagger de 80ms entre irmãos
    targets.forEach(function (el) {
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--reveal-delay', Math.min(idx, 6) * 80 + 'ms');
      el.classList.add('reveal');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
          // libera hover/transform próprios depois da entrada
          setTimeout(function (el) {
            el.classList.remove('reveal', 'is-visible');
            el.style.removeProperty('--reveal-delay');
          }.bind(null, en.target), 1600);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    // sem animação: apenas garante conteúdo visível
    targets.forEach(function (el) { el.classList.add('reveal', 'is-visible'); });
  }

  /* ---------- Contadores animados ---------- */
  var counters = $all('[data-count]');
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function runCounter(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion) { el.textContent = fmt(end, dec); return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(end * e, dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    counters.forEach(function (el) { el.textContent = fmt(0, parseInt(el.getAttribute('data-decimals') || '0', 10)); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Barra de progresso de leitura ---------- */
  var bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function updateBar() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
  }
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  /* ---------- Tilt suave na imagem do hero (ponteiro fino) ---------- */
  var media = $('.hero__media');
  if (media && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var heroEl = $('.hero');
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      media.style.setProperty('--tx', (x * -10).toFixed(2) + 'px');
      media.style.setProperty('--ty', (y * -8).toFixed(2) + 'px');
      media.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
      media.style.setProperty('--rx', (y * -4).toFixed(2) + 'deg');
    });
    heroEl.addEventListener('mouseleave', function () {
      ['--tx', '--ty', '--ry', '--rx'].forEach(function (k) { media.style.removeProperty(k); });
    });
  }

  /* ---------- Orçamento: calculadora + verificador de data -> WhatsApp ---------- */
  var form = $('#form-orcamento');
  if (form) {
    var Q = SITE.quote;
    var fPessoas = $('#orc-pessoas', form);
    var fRegiao = $('#orc-regiao', form);
    var fBairro = $('#orc-bairro', form);
    var fData = $('#orc-data', form);
    var submit = $('.form__submit', form);
    var submitLabel = submit.textContent;
    var statusBox = $('#orc-data-status', form);
    var previewBox = $('#orc-preview', form);
    var calRoot = $('[data-calendar]', form);
    var calGrid = $('[data-cal-grid]', calRoot);
    var calTitle = $('#cal-titulo', calRoot);

    var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    var WEEK = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    var WEEK_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    var brl = function (v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); };
    var range = function (a, b) { return a === b ? brl(a) : brl(a) + ' a ' + brl(b); };

    /* ---- datas ---- */
    function pad(n) { return String(n).padStart(2, '0'); }
    function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function fromISO(s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
      if (!m) return null;
      var d = new Date(+m[1], +m[2] - 1, +m[3]);
      return d.getMonth() === +m[2] - 1 ? d : null;
    }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    function fmtBR(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
    function fmtLong(d) { return WEEK[d.getDay()] + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear(); }

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var minDate = addDays(today, Q.minLeadDays);
    var maxDate = new Date(today.getFullYear(), today.getMonth() + Q.maxMonthsAhead, today.getDate());
    var busy = {};
    var calSource = null;
    function setBusy(list) {
      busy = {};
      list.forEach(function (b) { busy[typeof b === 'string' ? b : b.data] = true; });
    }
    setBusy((SITE.agenda && SITE.agenda.busyDates) || []);

    // 'free' | 'busy' | 'soon' | 'far'
    function dateState(d) {
      if (d < minDate) return 'soon';
      if (d > maxDate) return 'far';
      if (busy[toISO(d)] || Q.closedWeekdays.indexOf(d.getDay()) !== -1) return 'busy';
      return 'free';
    }
    function nextFree(from, count) {
      var out = [], d = addDays(from < minDate ? minDate : from, 0), guard = 0;
      while (out.length < count && guard++ < 400) {
        d = addDays(d, 1);
        if (d > maxDate) break;
        if (dateState(d) === 'free') out.push(d);
      }
      return out;
    }

    /* ---- opções configuráveis geradas a partir de SITE.quote ---- */
    fRegiao.appendChild(new Option('Selecione a região…', ''));
    Q.regions.forEach(function (r) { fRegiao.appendChild(new Option(r.label, r.id)); });
    fPessoas.min = Q.minGuests;
    fPessoas.max = Q.maxGuests;
    fPessoas.value = Q.defaultGuests;
    $('[data-guests-hint]', form).textContent = 'Mínimo de ' + Q.minGuests + ' pessoas. O preço-base considera ' + Q.baseGuests + ' convidados.';
    $('[data-date-hint]', form).textContent = 'Antecedência mínima de ' + Q.minLeadDays + ' dias (a partir de ' + fmtBR(minDate) + ').';
    $('[data-fee="drinks"]', form).textContent = '+' + brl(Q.drinksPerPerson) + '/pessoa';
    $('[data-fee="dishes"]', form).textContent = '+' + brl(Q.dishesPerPerson) + '/pessoa';
    $('[data-fee="dessert"]', form).textContent = '+' + brl(Q.dessertPerPerson) + '/pessoa';
    $all('[data-pix-percent]', form).forEach(function (e) { e.textContent = Q.pixPercent; });
    fData.min = toISO(minDate);
    fData.max = toISO(maxDate);

    var extrasBox = $('[data-extras]', form);
    Q.extras.forEach(function (x) {
      var row = document.createElement('div');
      row.className = 'extra';
      row.innerHTML =
        '<label class="check"><input type="checkbox" data-extra="' + x.id + '"><span class="check__box">' + x.label +
        ' <small class="choice__fee">' + brl(x.price) + ' ' + x.unit + '</small></span></label>' +
        '<label class="extra__qty" hidden><span class="visually-hidden">Quantidade: ' + x.label + '</span>' +
        '<input class="form__input" type="number" min="1" max="' + x.max + '" value="1" inputmode="numeric" data-extra-qty="' + x.id + '"></label>';
      extrasBox.appendChild(row);
    });
    extrasBox.className = 'extras';

    /* ---- cardápio montável ---- */
    var M = SITE.menu;
    var sidesBox = $('[data-sides]', form), soupsBox = $('[data-soups]', form), meatsBox = $('[data-meats]', form);
    M.sides.forEach(function (s) {
      var l = document.createElement('label');
      l.className = 'check';
      l.innerHTML = '<input type="checkbox" name="guarnicao" value="' + s.id + '"><span class="check__box"></span>';
      l.querySelector('.check__box').textContent = s.label;
      sidesBox.appendChild(l);
    });
    soupsBox.innerHTML = '<label class="choice"><input type="radio" name="caldo" value="" checked><span class="choice__box">Definir depois</span></label>';
    M.soups.forEach(function (s) {
      var l = document.createElement('label');
      l.className = 'choice';
      l.innerHTML = '<input type="radio" name="caldo" value="' + s.id + '"><span class="choice__box"></span>';
      l.querySelector('.choice__box').textContent = s.label;
      soupsBox.appendChild(l);
    });
    M.extraMeats.forEach(function (m) {
      var l = document.createElement('label');
      l.className = 'check';
      l.innerHTML = '<input type="checkbox" name="carne" value="' + m.id + '"><span class="check__box"><span></span> <small class="choice__fee">+' + brl(m.perPerson) + '/pessoa</small></span>';
      l.querySelector('.check__box > span').textContent = m.label;
      meatsBox.appendChild(l);
    });
    $('[data-sides-hint]', form).textContent = 'Escolha até ' + M.sidesMax + ' das ' + M.sides.length + ' opções. Dá para trocar depois, no atendimento.';

    function syncSides() {
      var boxes = $all('[name="guarnicao"]', form);
      var n = boxes.filter(function (b) { return b.checked; }).length;
      $('[data-sides-count]', form).textContent = '(' + n + ' de ' + M.sidesMax + ')';
      boxes.forEach(function (b) { b.disabled = !b.checked && n >= M.sidesMax; });
    }

    /* ---- cálculo ---- */
    function getState() {
      var g = parseInt(fPessoas.value, 10);
      var region = Q.regions.filter(function (r) { return r.id === fRegiao.value; })[0] || null;
      var extras = Q.extras.map(function (x) {
        var cb = $('[data-extra="' + x.id + '"]', form);
        var qty = Math.max(1, Math.min(x.max, parseInt($('[data-extra-qty="' + x.id + '"]', form).value, 10) || 1));
        return { def: x, on: cb.checked, qty: qty };
      }).filter(function (e) { return e.on; });
      return {
        guests: g,
        validGuests: g >= Q.minGuests && g <= Q.maxGuests,
        region: region,
        drinks: form.elements.bebidas.value === 'sim',
        dishes: form.elements.louca.value === 'louca',
        dessert: form.elements.sobremesa.checked,
        extras: extras,
        sides: $all('[name="guarnicao"]:checked', form).map(function (b) { return lookup(M.sides, b.value); }),
        soup: lookup(M.soups, form.elements.caldo.value),
        meats: $all('[name="carne"]:checked', form).map(function (b) { return lookup(M.extraMeats, b.value); })
      };
    }

    function lookup(list, id) {
      return list.filter(function (x) { return x.id === id; })[0] || null;
    }

    function estimate(st) {
      var g = st.validGuests ? st.guests : Math.max(Q.minGuests, st.guests || Q.minGuests);
      var small = 0;
      for (var i = 0; i < Q.smallEvent.length; i++) {
        if (g <= Q.smallEvent[i].upTo) { small = Q.smallEvent[i].add; break; }
      }
      var rMin = st.region ? st.region.addMin : 0, rMax = st.region ? st.region.addMax : 0;
      var opts = (st.drinks ? Q.drinksPerPerson : 0) + (st.dishes ? Q.dishesPerPerson : 0) + (st.dessert ? Q.dessertPerPerson : 0) +
        st.meats.reduce(function (s, m) { return s + m.perPerson; }, 0);
      var v = Q.variationPct / 100;
      var perMin = Math.floor((Q.basePerPerson + small + rMin + opts) * (1 - v));
      var perMax = Math.ceil((Q.basePerPerson + small + rMax + opts) * (1 + v));
      var extrasTotal = st.extras.reduce(function (s, e) { return s + e.def.price * e.qty; }, 0);
      return {
        guests: g, small: small, rMin: rMin, rMax: rMax, opts: opts, extrasTotal: extrasTotal,
        perMin: perMin, perMax: perMax,
        totMin: perMin * g + extrasTotal, totMax: perMax * g + extrasTotal
      };
    }

    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    function describe(st, est) {
      var lines = [];
      lines.push(['Preço-base', brl(Q.basePerPerson) + '/pessoa']);
      if (est.small) lines.push(['Evento pequeno', '+' + brl(est.small) + '/pessoa']);
      if (st.region) lines.push(['Frete e região', est.rMax ? '+' + range(est.rMin, est.rMax).replace('R$ ', 'R$ ') + '/pessoa' : 'sem acréscimo']);
      if (st.drinks) lines.push(['Bebidas', '+' + brl(Q.drinksPerPerson) + '/pessoa']);
      if (st.dishes) lines.push(['Louça', '+' + brl(Q.dishesPerPerson) + '/pessoa']);
      if (st.dessert) lines.push(['Sobremesas', '+' + brl(Q.dessertPerPerson) + '/pessoa']);
      st.meats.forEach(function (m) { lines.push([m.label + ' extra', '+' + brl(m.perPerson) + '/pessoa']); });
      st.extras.forEach(function (e) {
        lines.push([e.def.label + ' × ' + e.qty, brl(e.def.price * e.qty)]);
      });
      return lines;
    }

    function renderSummary() {
      var st = getState();
      var est = estimate(st);
      var per = $('[data-out="per"]', form), tot = $('[data-out="total"]', form);
      var pix = $('[data-out="pix"]', form), list = $('[data-out="breakdown"]', form);
      if (!st.region || !st.validGuests) {
        per.textContent = '—';
        tot.textContent = '—';
        pix.textContent = !st.validGuests ? 'Informe de ' + Q.minGuests + ' a ' + Q.maxGuests + ' pessoas.' : 'Escolha a região para ver a estimativa.';
        list.innerHTML = '';
      } else {
        per.textContent = range(est.perMin, est.perMax);
        tot.textContent = range(est.totMin, est.totMax);
        pix.textContent = 'Entrada de ' + Q.pixPercent + '%: ' + range(est.totMin * Q.pixPercent / 100, est.totMax * Q.pixPercent / 100) + ' via PIX.';
        list.innerHTML = '';
        describe(st, est).forEach(function (l) {
          var li = document.createElement('li');
          var a = document.createElement('span'); a.textContent = l[0];
          var b = document.createElement('span'); b.textContent = l[1];
          li.appendChild(a); li.appendChild(b); list.appendChild(li);
        });
      }
      return { st: st, est: est };
    }

    /* ---- mensagem ---- */
    function availabilityNote() {
      var d = fromISO(fData.value);
      if (!d) return '';
      var s = dateState(d);
      if (s === 'free') return ' (livre no calendário do site; aguardo confirmação)';
      if (s === 'busy') return ' (consta como ocupada no calendário do site; aceito sugestões)';
      return '';
    }

    function buildMessage() {
      var st = getState(), est = estimate(st);
      var d = fromISO(fData.value);
      var m = [
        'Olá! Gostaria de um orçamento de buffet de churrasco.',
        '',
        '• Pessoas: ' + (st.guests || '___'),
        '• Região: ' + (st.region ? st.region.short || st.region.label : '___'),
        '• Bairro: ' + (fBairro.value.trim() || '___'),
        '• Data: ' + (d ? fmtBR(d) + availabilityNote() : '___'),
        '• Guarnições (' + st.sides.length + '/' + M.sidesMax + '): ' + (st.sides.length ? st.sides.map(function (s) { return s.label; }).join(', ') : 'definir no atendimento'),
        '• Caldo: ' + (st.soup ? st.soup.label : 'definir no atendimento'),
        '• Carnes extras: ' + (st.meats.length ? st.meats.map(function (m) { return m.label; }).join(', ') : 'nenhuma'),
        '• Bebidas: ' + (st.drinks ? 'incluídas' : 'por minha conta'),
        '• Material: ' + (st.dishes ? 'louça' : 'descartável'),
        '• Sobremesas: ' + (st.dessert ? 'sim' : 'não'),
        '• Adicionais: ' + (st.extras.length ? st.extras.map(function (e) { return e.qty + 'x ' + e.def.label.toLowerCase(); }).join(', ') : 'nenhum')
      ];
      if (st.region && st.validGuests) {
        m.push('', 'Estimativa do site: ' + range(est.perMin, est.perMax) + ' por pessoa, total de ' + range(est.totMin, est.totMax) +
          ' (valor estimado, sujeito a confirmação). Entendo que a reserva exige entrada de ' + Q.pixPercent + '% via PIX após a confirmação da data.');
      }
      m.push('', 'Pode me confirmar valores e disponibilidade? Obrigado!');
      return m.join('\n');
    }

    function renderPreview() {
      previewBox.textContent = buildMessage();
    }

    /* ---- erros ---- */
    function setError(input, msg) {
      var err = document.getElementById(input.id + '-erro');
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        err.textContent = msg;
        err.hidden = false;
      } else {
        input.removeAttribute('aria-invalid');
        err.hidden = true;
        err.textContent = '';
      }
    }

    function validate() {
      var first = null;
      var n = parseInt(fPessoas.value, 10);
      var d = fromISO(fData.value);
      var dErr = '';
      if (!d) dErr = 'Faltou a data — sem ela não conseguimos checar a agenda.';
      else if (d < minDate) dErr = 'Escolha uma data a partir de ' + fmtBR(minDate) + ' (antecedência mínima de ' + Q.minLeadDays + ' dias).';
      else if (d > maxDate) dErr = 'Só consultamos datas até ' + fmtBR(maxDate) + '.';
      else if (dateState(d) === 'busy') dErr = 'Essa data está indisponível. Escolha uma das sugestões abaixo do calendário.';
      var checks = [
        [fPessoas, !(n >= Q.minGuests && n <= Q.maxGuests) ? 'Informe entre ' + Q.minGuests + ' e ' + Q.maxGuests + ' pessoas.' : ''],
        [fRegiao, !fRegiao.value ? 'Escolha a região do evento: ela define o frete.' : ''],
        [fBairro, fBairro.value.trim().length < 2 ? 'Faltou o bairro do evento.' : ''],
        [fData, dErr]
      ];
      checks.forEach(function (c) {
        setError(c[0], c[1]);
        if (c[1] && !first) first = c[0];
      });
      return first;
    }

    /* ---- verificador de data + calendário ---- */
    var view = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    var focusDate = minDate;

    function showStatus(kind, d) {
      statusBox.hidden = false;
      statusBox.className = 'avail avail--' + kind;
      statusBox.textContent = '';
      var strong = document.createElement('strong');
      var p = document.createElement('p');
      if (kind === 'free') {
        strong.textContent = 'Data disponível — confirme pelo WhatsApp';
        p.textContent = fmtLong(d) + ' consta como livre. Consulta preliminar: a data só fica reservada depois da nossa confirmação e do PIX de ' + Q.pixPercent + '%.';
        statusBox.appendChild(strong); statusBox.appendChild(p);
      } else if (kind === 'busy') {
        strong.textContent = 'Data indisponível';
        p.textContent = fmtLong(d) + ' já está reservada. Que tal uma destas?';
        statusBox.appendChild(strong); statusBox.appendChild(p);
        var ul = document.createElement('ul');
        ul.className = 'avail__list';
        nextFree(d, 3).forEach(function (s) {
          var li = document.createElement('li');
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'avail__pick';
          b.textContent = WEEK_SHORT[s.getDay()] + ', ' + fmtBR(s);
          b.addEventListener('click', function () { chooseDate(s, true); });
          li.appendChild(b); ul.appendChild(li);
        });
        if (!ul.children.length) {
          var none = document.createElement('p');
          none.textContent = 'Não encontramos datas livres no período. Chame no WhatsApp.';
          statusBox.appendChild(none);
        } else statusBox.appendChild(ul);
      } else if (kind === 'soon') {
        strong.textContent = 'Data fora do prazo';
        p.textContent = 'Precisamos de ' + Q.minLeadDays + ' dias de antecedência. A primeira data possível é ' + fmtBR(minDate) + '.';
        statusBox.appendChild(strong); statusBox.appendChild(p);
      } else {
        strong.textContent = 'Data fora do período de consulta';
        p.textContent = 'Consultamos datas até ' + fmtBR(maxDate) + '. Para depois disso, chame no WhatsApp.';
        statusBox.appendChild(strong); statusBox.appendChild(p);
      }
    }

    function chooseDate(d, moveFocus) {
      var s = dateState(d);
      if (s === 'soon' || s === 'far') {
        showStatus(s, d);
        return;
      }
      fData.value = toISO(d);
      setError(fData, '');
      focusDate = d;
      view = new Date(d.getFullYear(), d.getMonth(), 1);
      renderCalendar(moveFocus);
      showStatus(s, d);
      renderPreview();
      track('data_consultada', { resultado: s === 'free' ? 'livre' : 'ocupada' });
    }

    function renderCalendar(takeFocus) {
      calTitle.textContent = MONTHS[view.getMonth()] + ' de ' + view.getFullYear();
      var selected = fData.value;
      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var startOffset = first.getDay();
      var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      var html = '<table class="cal__table" role="grid" aria-labelledby="cal-titulo"><thead><tr>';
      WEEK.forEach(function (w, i) {
        html += '<th scope="col" abbr="' + w + '">' + WEEK_SHORT[i] + '</th>';
      });
      html += '</tr></thead><tbody>';
      var inView = focusDate.getFullYear() === view.getFullYear() && focusDate.getMonth() === view.getMonth();
      var tabDay = inView ? focusDate.getDate() : 1;
      var cell = 0;
      for (var row = 0; row < 6; row++) {
        if (cell - startOffset >= daysInMonth) break;
        html += '<tr>';
        for (var col = 0; col < 7; col++, cell++) {
          var day = cell - startOffset + 1;
          if (day < 1 || day > daysInMonth) { html += '<td></td>'; continue; }
          var d = new Date(view.getFullYear(), view.getMonth(), day);
          var s = dateState(d), iso = toISO(d);
          var label = fmtLong(d) + ', ' + ({ free: 'livre', busy: 'ocupada', soon: 'fora do prazo', far: 'fora do período' })[s];
          html += '<td role="gridcell"' + (iso === selected ? ' aria-selected="true"' : '') + '>' +
            '<button type="button" class="cal__day cal__day--' + s + (iso === selected ? ' is-selected' : '') + (iso === toISO(today) ? ' is-today' : '') + '"' +
            ' data-iso="' + iso + '" tabindex="' + (day === tabDay ? '0' : '-1') + '"' +
            (s === 'soon' || s === 'far' ? ' aria-disabled="true"' : '') +
            ' aria-label="' + label + '">' + day + '</button></td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      calGrid.innerHTML = html;
      if (takeFocus) {
        var b = $('[data-iso="' + toISO(focusDate) + '"]', calGrid);
        if (b) b.focus();
      }
    }

    function moveFocus(d) {
      focusDate = d;
      view = new Date(d.getFullYear(), d.getMonth(), 1);
      renderCalendar(true);
    }

    calGrid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-iso]');
      if (!b) return;
      chooseDate(fromISO(b.getAttribute('data-iso')), true);
    });

    calGrid.addEventListener('keydown', function (e) {
      var b = e.target.closest('[data-iso]');
      if (!b) return;
      var d = fromISO(b.getAttribute('data-iso'));
      var n = null;
      switch (e.key) {
        case 'ArrowLeft': n = addDays(d, -1); break;
        case 'ArrowRight': n = addDays(d, 1); break;
        case 'ArrowUp': n = addDays(d, -7); break;
        case 'ArrowDown': n = addDays(d, 7); break;
        case 'Home': n = addDays(d, -d.getDay()); break;
        case 'End': n = addDays(d, 6 - d.getDay()); break;
        case 'PageUp': n = new Date(d.getFullYear(), d.getMonth() - (e.shiftKey ? 12 : 1), d.getDate()); break;
        case 'PageDown': n = new Date(d.getFullYear(), d.getMonth() + (e.shiftKey ? 12 : 1), d.getDate()); break;
      }
      if (n) { e.preventDefault(); moveFocus(n); }
    });

    $all('[data-cal]', calRoot).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = btn.getAttribute('data-cal') === 'next' ? 1 : -1;
        view = new Date(view.getFullYear(), view.getMonth() + dir, 1);
        focusDate = new Date(view.getFullYear(), view.getMonth(), 1);
        renderCalendar(false);
      });
    });

    fData.addEventListener('change', function () {
      var d = fromISO(fData.value);
      if (!d) { statusBox.hidden = true; renderCalendar(false); renderPreview(); return; }
      var s = dateState(d);
      if (s === 'soon' || s === 'far') {
        setError(fData, s === 'soon'
          ? 'Escolha uma data a partir de ' + fmtBR(minDate) + ' (antecedência mínima de ' + Q.minLeadDays + ' dias).'
          : 'Só consultamos datas até ' + fmtBR(maxDate) + '.');
        showStatus(s, d);
        fData.value = '';
        renderCalendar(false);
        renderPreview();
        return;
      }
      chooseDate(d, false);
    });

    /* ---- stepper, extras, eventos gerais ---- */
    $all('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(fPessoas.value, 10) || Q.defaultGuests;
        v = Math.max(Q.minGuests, Math.min(Q.maxGuests, v + parseInt(b.getAttribute('data-step'), 10)));
        fPessoas.value = v;
        setError(fPessoas, '');
        update();
      });
    });

    $all('[data-extra]', form).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var q = cb.closest('.extra').querySelector('.extra__qty');
        q.hidden = !cb.checked;
      });
    });

    function update() {
      var n = parseInt(fPessoas.value, 10);
      if (fPessoas.getAttribute('aria-invalid') && n >= Q.minGuests && n <= Q.maxGuests) setError(fPessoas, '');
      renderSummary();
      renderPreview();
    }

    form.addEventListener('input', function (e) {
      if (e.target === fData) return;
      if (e.target.getAttribute('aria-invalid') && e.target.value) setError(e.target, '');
      update();
    });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'guarnicao') syncSides();
      if (e.target !== fData) update();
    });
    fPessoas.addEventListener('blur', function () {
      var n = parseInt(fPessoas.value, 10);
      if (fPessoas.value !== '' && (n < Q.minGuests || n > Q.maxGuests)) {
        setError(fPessoas, 'Informe entre ' + Q.minGuests + ' e ' + Q.maxGuests + ' pessoas.');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { bad.focus(); return; }
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage());
      var stNow = getState();
      track('orcamento_submit', {
        pessoas: stNow.guests < 50 ? 'ate-49' : stNow.guests < 100 ? '50-99' : stNow.guests < 200 ? '100-199' : '200+',
        regiao: stNow.region ? stNow.region.id : '',
        sobremesa: stNow.dessert ? 'sim' : 'nao',
        adicionais: String(stNow.extras.length)
      });
      submit.disabled = true;
      submit.textContent = 'Abrindo WhatsApp…';
      window.open(url, '_blank', 'noopener');
      setTimeout(function () {
        submit.disabled = false;
        submit.textContent = submitLabel;
      }, 2500);
    });


    /* ---- pacotes: cards + pré-seleção da calculadora ---- */
    var packsBox = $('[data-packs]');
    var packStatus = document.createElement('p');
    packStatus.className = 'form__help form__pack-status';
    packStatus.setAttribute('role', 'status');
    $('.form__main', form).insertBefore(packStatus, $('.form__main', form).firstChild);
    var presetApplying = false;

    function packState(p) {
      return {
        guests: Q.baseGuests, validGuests: true, region: Q.regions[0],
        drinks: p.drinks, dishes: p.dishes, dessert: p.dessert,
        meats: p.meats.map(function (id) { return lookup(M.extraMeats, id); }).filter(Boolean),
        extras: Object.keys(p.extras).map(function (id) { return { def: lookup(Q.extras, id), qty: p.extras[id] }; }).filter(function (e) { return e.def; })
      };
    }

    function packItems(p) {
      var it = [p.sides.length + ' guarnições à escolha (de ' + M.sides.length + ')', 'Carnes do buffet completo, petiscos e um caldo'];
      it.push(p.drinks ? 'Bebidas incluídas' : 'Bebidas por conta do cliente');
      it.push(p.dishes ? 'Louça (sem descartável)' : 'Material descartável');
      if (p.dessert) it.push('Sobremesas');
      packState(p).meats.forEach(function (m) { it.push('Porção extra de ' + m.label.toLowerCase()); });
      packState(p).extras.forEach(function (e) { it.push(e.qty + ' ' + (e.qty > 1 ? (e.def.label === 'Garçom' ? 'garçons' : e.def.label.toLowerCase() + 's') : e.def.label.toLowerCase())); });
      return it;
    }

    function packPrice(p) {
      var st = packState(p);
      var small = 0;
      var opts = (p.drinks ? Q.drinksPerPerson : 0) + (p.dishes ? Q.dishesPerPerson : 0) + (p.dessert ? Q.dessertPerPerson : 0) +
        st.meats.reduce(function (s, m) { return s + m.perPerson; }, 0);
      var extras = st.extras.reduce(function (s, e) { return s + e.def.price * e.qty; }, 0);
      return { per: Q.basePerPerson + small + opts, extras: extras };
    }

    function applyPreset(p) {
      presetApplying = true;
      $all('[name="guarnicao"]', form).forEach(function (b) { b.checked = false; b.disabled = false; });
      p.sides.forEach(function (id) {
        var b = $('[name="guarnicao"][value="' + id + '"]', form);
        if (b) b.checked = true;
      });
      syncSides();
      var soup = $('[name="caldo"][value="' + (p.soup || '') + '"]', form);
      if (soup) soup.checked = true;
      $('[name="bebidas"][value="' + (p.drinks ? 'sim' : 'nao') + '"]', form).checked = true;
      $('[name="louca"][value="' + (p.dishes ? 'louca' : 'descartavel') + '"]', form).checked = true;
      form.elements.sobremesa.checked = p.dessert;
      $all('[name="carne"]', form).forEach(function (b) { b.checked = p.meats.indexOf(b.value) !== -1; });
      Q.extras.forEach(function (x) {
        var cb = $('[data-extra="' + x.id + '"]', form);
        var qty = $('[data-extra-qty="' + x.id + '"]', form);
        var n = p.extras[x.id] || 0;
        cb.checked = n > 0;
        qty.value = n || 1;
        cb.closest('.extra').querySelector('.extra__qty').hidden = !cb.checked;
      });
      update();
      presetApplying = false;
      $all('[data-pack]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-pack') === p.id));
      });
      packStatus.textContent = 'Pacote ' + p.name + ' aplicado. Ajuste o que quiser abaixo e escolha a região e a data.';
      var target = document.getElementById('orcamento');
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { fPessoas.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
      track('package_select', { package: p.id });
    }

    if (packsBox) {
      SITE.packages.forEach(function (p) {
        var price = packPrice(p);
        var li = document.createElement('li');
        li.className = 'pack' + (p.recommended ? ' pack--rec' : '');
        li.innerHTML =
          (p.recommended ? '<span class="pack__badge">Recomendado</span>' : '') +
          '<h3 class="pack__name"></h3><p class="pack__tag"></p>' +
          '<p class="pack__price"><small>a partir de</small><strong></strong><small>por pessoa</small></p>' +
          '<ul class="pack__items"></ul>' +
          '<button class="btn ' + (p.recommended ? 'btn--primary' : 'btn--ghost') + ' pack__btn" type="button" data-pack="' + p.id + '" aria-pressed="false"></button>';
        li.querySelector('.pack__name').textContent = p.name;
        li.querySelector('.pack__tag').textContent = p.tagline;
        li.querySelector('.pack__price strong').textContent = brl(price.per);
        li.querySelector('.pack__btn').textContent = 'Escolher o ' + p.name;
        li.querySelector('.pack__btn').setAttribute('aria-label', 'Escolher o pacote ' + p.name + ' e pré-selecionar a calculadora');
        packItems(p).forEach(function (t) {
          var i = document.createElement('li');
          i.textContent = t;
          li.querySelector('.pack__items').appendChild(i);
        });
        if (price.extras) {
          var ex = document.createElement('li');
          ex.className = 'pack__extra';
          ex.textContent = '+ ' + brl(price.extras) + ' em serviços (valor fixo)';
          li.querySelector('.pack__items').appendChild(ex);
        }
        li.querySelector('.pack__btn').addEventListener('click', function () { applyPreset(p); });
        packsBox.appendChild(li);
      });
      $('[data-packs-note]').textContent = 'Preços por pessoa para ' + Q.baseGuests + ' convidados em ' + Q.regions[0].short +
        '. Estimativa sujeita a confirmação; frete e região podem alterar o valor.';
    }


    /* ---- mapa de bairros: áreas clicáveis ligadas às faixas de frete ---- */
    var mapRoot = $('.areamap');
    if (mapRoot) {
      var mapStatus = $('[data-map-status]', mapRoot);
      var zonesBox = $('[data-map-zones]', mapRoot);
      var areas = $all('.area', mapRoot);

      function feeText(r) {
        if (!r.addMax) return 'sem acréscimo de frete';
        return '+' + (r.addMin === r.addMax ? brl(r.addMin) : brl(r.addMin) + ' a ' + brl(r.addMax)) + '/pessoa de frete';
      }
      function regionOf(id) {
        return Q.regions.filter(function (r) { return r.id === id; })[0];
      }

      // cartões das faixas (também são a alternativa em lista ao mapa)
      Q.regions.forEach(function (r) {
        var names = areas.filter(function (a) { return a.getAttribute('data-region') === r.id; })
          .map(function (a) { return a.getAttribute('data-area'); });
        var li = document.createElement('li');
        li.className = 'zone zone--' + r.id;
        li.innerHTML = '<span class="zone__swatch" aria-hidden="true"></span><div class="zone__body"><strong class="zone__name"></strong>' +
          '<span class="zone__fee"></span><span class="zone__areas"></span></div>' +
          '<button class="zone__btn" type="button"></button>';
        li.querySelector('.zone__name').textContent = r.short || r.label;
        li.querySelector('.zone__fee').textContent = feeText(r);
        li.querySelector('.zone__areas').textContent = names.join(', ');
        var btn = li.querySelector('.zone__btn');
        btn.textContent = 'Usar esta faixa';
        btn.setAttribute('aria-label', 'Usar a faixa ' + (r.short || r.label) + ' no orçamento');
        btn.addEventListener('click', function () { chooseRegion(r.id, null); });
        zonesBox.appendChild(li);
      });

      areas.forEach(function (a) {
        var r = regionOf(a.getAttribute('data-region'));
        var name = a.getAttribute('data-area');
        a.setAttribute('aria-label', name + ': ' + (r.short || r.label) + ', ' + feeText(r) + '. Selecionar esta região no orçamento');
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        t.textContent = name + ' · ' + feeText(r);
        a.insertBefore(t, a.firstChild);
        function say() {
          mapStatus.textContent = name + ': ' + (r.short || r.label) + ' (' + feeText(r) + ').';
        }
        a.addEventListener('mouseenter', say);
        a.addEventListener('focus', say);
        a.addEventListener('click', function () { chooseRegion(r.id, name); });
        a.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseRegion(r.id, name); }
        });
      });

      function markSelected() {
        areas.forEach(function (a) {
          var on = !!fRegiao.value && a.getAttribute('data-region') === fRegiao.value;
          a.classList.toggle('is-selected', on);
          a.setAttribute('aria-pressed', String(on));
        });
        $all('.zone', zonesBox).forEach(function (z) {
          z.classList.toggle('is-selected', fRegiao.value !== '' && z.classList.contains('zone--' + fRegiao.value));
        });
      }

      function chooseRegion(id, bairro) {
        var r = regionOf(id);
        fRegiao.value = id;
        setError(fRegiao, '');
        if (bairro && !fBairro.value.trim()) fBairro.value = bairro;
        update();
        markSelected();
        mapStatus.textContent = '';
        var msg = document.createElement('span');
        msg.textContent = (bairro ? bairro + ' — ' : '') + 'região "' + (r.short || r.label) + '" escolhida no orçamento (' + feeText(r) + '). ';
        var go = document.createElement('a');
        go.href = '#orcamento';
        go.textContent = 'Ver estimativa';
        mapStatus.appendChild(msg);
        mapStatus.appendChild(go);
        track('mapa_regiao', { regiao: id });
      }

      fRegiao.addEventListener('change', markSelected);
      markSelected();
    }

    form.addEventListener('input', function () {
      if (!presetApplying) $all('[data-pack]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    });

    renderCalendar(false);
    syncSides();
    update();

    /* ---- agenda: planilha publicada (opcional) atualiza o calendário depois que a página abre ---- */
    calSource = document.createElement('p');
    calSource.className = 'cal__source';
    $('.cal__keys', calRoot).insertAdjacentElement('afterend', calSource);
    TRG.loadAgenda(SITE.agenda).then(function (r) {
      if (r.source === 'json') {
        calSource.textContent = r.error ? 'Agenda: planilha indisponível agora, mostrando as datas salvas no site.' : '';
        return;
      }
      setBusy(r.dates);
      renderCalendar(false);
      var cur = fromISO(fData.value);
      if (cur) {
        var st = dateState(cur);
        if (st === 'busy') { showStatus('busy', cur); setError(fData, 'Essa data acabou de ficar indisponível. Escolha uma das sugestões abaixo do calendário.'); }
        else if (st === 'free') showStatus('free', cur);
      }
      renderPreview();
      var when = r.at ? new Date(r.at) : new Date();
      calSource.textContent = 'Agenda atualizada pela planilha' + (r.source === 'cache' ? ' (cache de poucos minutos)' : '') + ' às ' + pad(when.getHours()) + ':' + pad(when.getMinutes()) + '.';
    });
  }

  /* ---------- Lightbox da galeria ---------- */
  var thumbs = $all('.gallery__img');
  if (thumbs.length) {
    var current = 0;
    var lastFocus = null;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Galeria de fotos');
    box.innerHTML =
      '<button class="lightbox__btn lightbox__btn--close" type="button" aria-label="Fechar">&times;</button>' +
      '<button class="lightbox__btn lightbox__btn--prev" type="button" aria-label="Anterior">&#8249;</button>' +
      '<figure class="lightbox__figure"><img class="lightbox__img" alt=""><figcaption class="lightbox__caption"></figcaption></figure>' +
      '<button class="lightbox__btn lightbox__btn--next" type="button" aria-label="Próxima">&#8250;</button>';
    document.body.appendChild(box);
    var lbImg = $('.lightbox__img', box);
    var lbCap = $('.lightbox__caption', box);
    var btnClose = $('.lightbox__btn--close', box);

    function show(i) {
      current = (i + thumbs.length) % thumbs.length;
      lbImg.src = (thumbs[current].currentSrc || thumbs[current].src).replace('-800.webp', '-1600.webp');
      lbImg.alt = thumbs[current].alt;
      lbCap.textContent = thumbs[current].alt;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.classList.add('is-locked');
      btnClose.focus();
    }
    function close() {
      box.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus();
    }

    thumbs.forEach(function (img, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery__btn';
      btn.setAttribute('aria-label', 'Ampliar: ' + img.alt);
      btn.setAttribute('data-caption', img.alt);
      var pic = img.closest('picture') || img;
      pic.parentNode.insertBefore(btn, pic);
      btn.appendChild(pic);
      btn.addEventListener('click', function () { open(i); });
    });

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lightbox__btn--close')) close();
      else if (e.target.closest('.lightbox__btn--prev')) show(current - 1);
      else if (e.target.closest('.lightbox__btn--next')) show(current + 1);
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        var f = $all('button', box);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // swipe
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
  }
  }

  /* carrega data/site-data.json (com fallback embutido) e só então monta a página */
  TRG.load({ url: 'data/site-data.json' }).then(function (r) {
    Object.keys(r.data).forEach(function (k) { SITE[k] = r.data[k]; });
    SITE.dataSource = r.source;
    document.documentElement.setAttribute('data-source', r.source);
    boot();
  });
})();

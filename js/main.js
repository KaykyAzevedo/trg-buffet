/* TRG Buffet - main.js
   JS puro, sem dependências. Ver docs/ARQUITETURA.md.
   Hooks no HTML: [data-tabs], .header__toggle, #form-orcamento, [data-whatsapp], [data-year] */
(function () {
  'use strict';

  /* ==== DADOS DO NEGÓCIO (fictícios) — único bloco para trocar. Ver docs/DADOS-PARA-TROCAR.md ==== */
  var SITE = {
    whatsapp: '5521974318206',               // DDI+DDD+número, só dígitos
    phoneLabel: '(21) 97431-8206',
    email: 'contato@trgbuffet.com.br',
    instagram: 'trgbuffet',                  // sem @
    address: ['Rua Marechal Fontenele, 1200', 'Realengo, Rio de Janeiro - RJ', 'CEP 21730-000'],
    hours: 'Atendimento: seg. a sáb., das 8h às 19h'
  };
  var WHATSAPP_NUMBER = SITE.whatsapp;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

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
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var n = tabs.length, next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % n;
        else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    var initial = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    select(initial < 0 ? 0 : initial, false);
    window.addEventListener('resize', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
    window.addEventListener('load', moveIndicator);
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

  /* ---------- Formulário de orçamento -> WhatsApp ---------- */
  var form = $('#form-orcamento');
  if (form) {
    var fPessoas = $('#orc-pessoas', form);
    var fBairro = $('#orc-bairro', form);
    var fData = $('#orc-data', form);
    var submit = $('.form__submit', form);
    var submitLabel = submit.textContent;

    // data mínima = hoje
    var now = new Date();
    var iso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    fData.min = iso;

    // pré-visualização ao vivo
    var preview = document.createElement('div');
    preview.className = 'form__preview';
    form.insertBefore(preview, submit);

    function fmtDate(v) {
      var p = v.split('-');
      return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : v;
    }

    function buildMessage() {
      var pessoas = fPessoas.value.trim();
      var bairro = fBairro.value.trim();
      var data = fData.value;
      return [
        'Olá! Gostaria de um orçamento de buffet de churrasco.',
        '',
        '• Pessoas: ' + (pessoas || '___'),
        '• Bairro: ' + (bairro || '___'),
        '• Data: ' + (data ? fmtDate(data) : '___'),
        '',
        'Pode me passar valores e disponibilidade? Obrigado!'
      ].join('\n');
    }

    function renderPreview() {
      preview.innerHTML = '';
      var title = document.createElement('strong');
      title.textContent = 'Prévia da mensagem';
      preview.appendChild(title);
      preview.appendChild(document.createTextNode(buildMessage()));
    }

    function setError(input, msg) {
      var err = document.getElementById(input.id + '-erro');
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', err.id);
        err.textContent = msg;
        err.hidden = false;
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        err.hidden = true;
        err.textContent = '';
      }
    }

    function validate() {
      var first = null;
      var n = parseInt(fPessoas.value, 10);
      var checks = [
        [fPessoas, !(n >= 1) ? 'Informe quantas pessoas vão ao evento.' : ''],
        [fBairro, fBairro.value.trim().length < 2 ? 'Faltou o bairro: ele define o frete.' : ''],
        [fData, !fData.value ? 'Faltou a data — sem ela não conseguimos checar a agenda.'
          : (fData.value < iso ? 'Essa data já passou. Escolha uma data futura.' : '')]
      ];
      checks.forEach(function (c) {
        setError(c[0], c[1]);
        if (c[1] && !first) first = c[0];
      });
      return first;
    }

    [fPessoas, fBairro, fData].forEach(function (inp) {
      inp.addEventListener('input', function () {
        if (inp.getAttribute('aria-invalid')) validate();
        renderPreview();
      });
    });
    renderPreview();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { bad.focus(); return; }
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage());
      submit.disabled = true;
      submit.textContent = 'Abrindo WhatsApp…';
      window.open(url, '_blank', 'noopener');
      setTimeout(function () {
        submit.disabled = false;
        submit.textContent = submitLabel;
      }, 2500);
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
})();

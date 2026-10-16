# Arquitetura - TRG Buffet

Site estático (HTML/CSS/JS puro), sem build, sem dependências. Deploy: copiar a pasta para qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## Estrutura

```
index.html          página única (landing)
css/style.css       todo o CSS (seções comentadas)
js/main.js          todo o JS
assets/
  logo-trg-buffet.pdf, ref-whatsapp.jpeg   originais
  img/              imagens otimizadas (logo SVG, hero, galeria, og-image, favicon)
docs/               briefing e esta documentação
```

Arquivos referenciados no HTML que ainda precisam ser criados em `assets/img/`: `logo-trg-buffet.svg`, `favicon.svg`, `og-image.jpg` (1200x630), `hero-placeholder.jpg`, `galeria-1..6.jpg`.

## Seções do index.html (ids de âncora)

`#topo` header · `#inicio` hero · `#sobre` · `#cardapio` (abas) · `#inclui` · `#como-funciona` · `#galeria` · `#depoimentos` · `#orcamento` (form) · `#faq` · footer · botão flutuante WhatsApp.

## Convenções CSS

- **BEM**: `bloco__elemento--modificador` (ex.: `.menu__item`, `.btn--primary`). Sem seletores por id nem aninhamento profundo; especificidade baixa.
- **Mobile-first**: estilos base para celular, `@media (min-width: ...)` para ampliar.
- **Variáveis CSS** em `:root` (seção 1 do style.css), nunca valores soltos:
  - cores: `--color-brand-*`, `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-whatsapp`
  - tipografia: `--font-body`, `--font-heading`, `--fs-*`, `--lh-*`
  - espaçamento: `--space-1..8`; raio: `--radius-*`; sombra: `--shadow-*`
  - layout: `--container-max`, `--header-height`; transição: `--transition`
- Cores extraídas do logo (assets/logo-trg-buffet.pdf) pelo UI Designer.
- Classes de estado: `is-open`, `is-active`; JS alterna classes/atributos ARIA, não estilos inline.
- Classes utilitárias permitidas: `.container`, `.visually-hidden`, `.skip-link`.

## Convenções JS

- JS puro (ES2015+), um único arquivo, `defer`, sem globais (IIFE ou módulo único).
- Ganchos por atributo: `data-tabs`, `data-whatsapp`, `data-year`; evitar acoplar a classes de estilo.
- Funcionalidades: abas do cardápio, menu mobile, formulário que monta a mensagem e abre `https://wa.me/55<DDD><numero>?text=<encodeURIComponent>`, ano no rodapé.
- Número do WhatsApp: placeholder `5521900000000` (trocar em um único lugar via `data-whatsapp`/constante).

## Acessibilidade (WCAG AA)

- HTML semântico: `header`, `nav`, `main`, `section[aria-labelledby]`, `footer`; um único `h1`, hierarquia de títulos sem saltos.
- `skip-link` para `#conteudo`; foco visível em todos os interativos (`:focus-visible`).
- Abas do cardápio: padrão WAI-ARIA tabs (`role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, setas esquerda/direita, Home/End, roving `tabindex`).
- Menu mobile: botão com `aria-expanded` + `aria-controls`.
- Formulário: `label` associado, erros em `role="alert"`, `inputmode`, não depender só de cor.
- FAQ com `details/summary` nativo.
- Imagens com `alt` descritivo (decorativas: `alt=""`), `width`/`height` definidos; contraste mínimo 4.5:1; alvos de toque >= 44px; respeitar `prefers-reduced-motion`.
- `lang="pt-BR"` no `html`.

## SEO

- `<title>` e `meta description` únicos; `canonical`; `theme-color`.
- **Open Graph / Twitter Card**: `og:type`, `og:locale=pt_BR`, `og:title`, `og:description`, `og:url`, `og:image` (1200x630), `twitter:card=summary_large_image`.
- **JSON-LD** `schema.org` tipo `FoodEstablishment` (+ `CateringService`) com nome, descrição, telefone, `address` (Realengo/RJ), `areaServed`, `priceRange`. Atualizar telefone, URL e imagem na publicação.
- Trocar `https://www.exemplo.com.br/` pelo domínio real (canonical, og:url, og:image, JSON-LD). Adicionar `robots.txt` e `sitemap.xml` ao publicar.

## Performance

- Sem frameworks; CSS/JS em um arquivo cada. Imagens em WebP/AVIF quando possível, `loading="lazy"` abaixo da dobra (hero sem lazy), logo em SVG.
- Fontes: no máximo 2 famílias, `font-display: swap`, preferir fontes do sistema ou self-host.

## Divisão de responsabilidades

- Tech Lead: estrutura HTML, conteúdo, convenções (este documento).
- UI Designer: tokens, paleta, tipografia, layout, assets visuais.
- Frontend Dev: `css/style.css` e `js/main.js`, sem alterar a semântica do HTML sem alinhar.

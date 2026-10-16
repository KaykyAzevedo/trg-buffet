# DESIGN — TRG Buffet (landing page)

Direção: **"Brasa & Ouro"** — churrasco premium, quente e confiável. Fundo carvão profundo, vermelho brasa como energia/CTA, dourado como acabamento nobre. Tipografia condensada forte (ecoa o "TRG" do logo) + serifa elegante para respiro editorial. Mobile-first (base 360px), PT-BR.

## 1. Logo
- `assets/logo.svg` (vetor, extraído do PDF) e `assets/logo.png` (200 dpi). Medalhão circular escuro com grelha vermelha, vapor (vermelho/dourado/vermelho), "SINCE 2009" e "BUFFET" em dourado.
- Uso: header 40px (mobile) / 48px (desktop); hero 120–180px com leve flutuação. Área de respiro mínima = 25% do diâmetro. Sobre fundo claro, manter o medalhão (já tem fundo próprio).
- Detalhe de marca reutilizável: **linha dourada fina com texto centralizado** ("SINCE 2009") como divisor de seção.

## 2. Paleta (extraída do logo)
| Token | Hex | Origem / uso |
|---|---|---|
| `--carvao-900` | `#141C1C` | fundo mais profundo, rodapé (derivado) |
| `--carvao-800` | `#1E2A2A` | **fundo do logo** — fundo principal |
| `--carvao-700` | `#2A3939` | cards/superfícies elevadas |
| `--carvao-600` | `#3B4D4D` | bordas, divisores |
| `--brasa-500` | `#D22E29` | **vermelho do grill** — CTA, destaques |
| `--brasa-600` | `#B02420` | hover/pressed do CTA |
| `--brasa-700` | `#9A2124` | **vermelho "TRG"** — ênfases, badges |
| `--vinho-800` | `#86292B` | gradientes escuros, sombras tintadas |
| `--vinho-900` | `#3B1B1B` | sombra do logo — overlay/gradiente quente |
| `--ouro-400` | `#E0C27A` | hover dourado, brilho (derivado) |
| `--ouro-500` | `#C8A855` | **dourado do logo** — títulos de acento, linhas, ícones |
| `--ouro-700` | `#9C8240` | dourado sobre fundo claro (derivado) |
| `--creme-50` | `#FBF6EA` | seções claras, texto sobre escuro |
| `--creme-100` | `#F3EAD4` | fundo alternativo claro |
| `--texto-claro` | `#F5EFE0` | texto principal no escuro |
| `--texto-suave` | `#B9B3A3` | texto secundário no escuro |
| `--texto-escuro` | `#1E2A2A` | texto no creme |
| `--whatsapp` | `#25D366` | **só** no botão flutuante de WhatsApp |

Regras: alternar seções **escuras (carvão)** e **claras (creme)** para ritmo; vermelho só em ação/ênfase (≤10% da tela); dourado em ornamento e números. Contraste: texto-claro/carvão-800 ≈ 12:1; ouro-500/carvão-800 ≈ 6:1 (AA); creme/brasa-500 ≈ 4.9:1 (AA para texto bold ≥16px).

Gradientes: `--grad-fogo: linear-gradient(135deg,#D22E29,#9A2124)`; `--grad-hero: radial-gradient(120% 80% at 50% 0%, #3B1B1B 0%, #1E2A2A 55%, #141C1C 100%)`; `--grad-ouro: linear-gradient(90deg,#9C8240,#E0C27A,#C8A855)`.

## 3. Tipografia (Google Fonts)
- **Display:** `Oswald` 500/600/700 — condensada, ecoa o logo. Títulos, números, botões. Tracking `0.02em`, uppercase em H1/H2 curtos.
- **Serifa de acento:** `Fraunces` 400/600 (+ itálico 400) — subtítulos, depoimentos, frases de apetite.
- **Texto:** `Inter` 400/500/600 — corpo, formulário, UI.
- Import: `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap`
- Escala fluida (mobile → desktop):
  - H1 `clamp(2.5rem, 8vw, 5rem)` / lh 1.02
  - H2 `clamp(1.875rem, 5vw, 3.25rem)` / lh 1.1
  - H3 `1.375rem → 1.625rem` / lh 1.2
  - Corpo `1rem` (`1.0625rem` desktop) / lh 1.65; pequeno `0.875rem`
  - Eyebrow: Oswald 500 `0.8125rem`, uppercase, tracking `0.18em`, ouro-500
- Largura de leitura: `max-width: 62ch`.

## 4. Espaçamento, grid e raios
- Base 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128` (`--sp-1…--sp-10`).
- Seções: padding vertical `64px` mobile / `112px` desktop. Gutter lateral `20px` / `32px`. Container `max-width: 1180px`.
- Grid: 1 coluna (<640) · 2 (≥640) · 3–4 (≥1024), gap `16/24px`.
- Raios: `--r-sm 8px` (inputs, chips) · `--r-md 14px` (cards) · `--r-lg 24px` (hero cards, imagens) · `--r-pill 999px` (botões, abas, tags).

## 5. Sombras e elevação
- `--sh-1: 0 2px 6px rgba(0,0,0,.25)` — cards em repouso
- `--sh-2: 0 10px 30px -8px rgba(0,0,0,.45)` — cards hover/modal
- `--sh-fogo: 0 10px 28px -6px rgba(210,46,41,.55)` — CTA primário
- `--sh-ouro: 0 0 0 1px rgba(200,168,85,.5), 0 8px 24px -10px rgba(200,168,85,.35)` — destaque premium
- Sobre creme: sombras suaves `0 8px 24px -12px rgba(30,42,42,.25)`.
- Textura opcional: grão/ruído 3–4% sobre carvão (SVG inline) para sensação de brasa.

## 6. Botões
- **Primário (CTA WhatsApp):** fundo `--grad-fogo`, texto creme-50, Oswald 600 uppercase, tracking .06em, altura 52px, padding 0 28px, pill, `--sh-fogo`. Ícone WhatsApp à esquerda. Hover: sobe 2px, +brilho, sombra intensifica. Active: `scale(.98)`.
- **Secundário:** transparente, borda 1.5px ouro-500, texto ouro-500; hover: preenchido ouro-500 com texto carvão-800.
- **Terciário/link:** texto ouro com sublinhado animado (linha cresce da esquerda).
- **WhatsApp flutuante:** círculo 60px `#25D366`, fixo no canto inferior direito (16px), pulso suave a cada 6s; tooltip "Peça seu orçamento".
- Foco visível: `outline: 3px solid ouro-400; outline-offset: 3px`. Alvo mínimo 48px.

## 7. Cards
- **Cardápio:** fundo carvão-700, borda 1px carvão-600, raio 14px, padding 20–24px; ícone-linha dourado, título Oswald, lista com marcador de **chama dourada**. Hover: borda ouro-500 + `--sh-2` + translateY(-4px).
- **Inclui:** fundo creme-50, ícone em círculo vinho com traço dourado, título Oswald escuro.
- **Passo:** número gigante Oswald (72px) em ouro com 25% opacidade ao fundo, conector pontilhado entre passos.
- **Depoimento:** fundo carvão-700, aspas Fraunces 64px ouro, texto Fraunces itálico, estrelas ouro, avatar com iniciais em círculo brasa.
- **Preço (destaque):** borda ouro, selo "a partir de" + `R$ 90` em Oswald 72px, nota "por pessoa · base 100 convidados".

## 8. Movimento e microinterações
Easing padrão `cubic-bezier(.22,1,.36,1)`; 200ms (UI) / 600–800ms (entradas). Respeitar `prefers-reduced-motion` (só fades).
- **Hero:** vapor do logo (3 ondas SVG) sobe e esmaece em loop 4s; brasas (12–16 partículas CSS vermelho/ouro) flutuando, baixa opacidade.
- **Scroll reveal:** `opacity 0→1` + `translateY(24px→0)` via IntersectionObserver, stagger 80ms em grids.
- **Header:** transparente no topo → carvão-800 com blur e sombra após 40px; esconde ao descer, mostra ao subir.
- **Abas do cardápio:** indicador dourado desliza sob a aba ativa; cross-fade 250ms; itens em cascata.
- **Cards:** hover lift + borda dourada; ícone gira −4°.
- **Contadores:** "anos de estrada", "100 pessoas" contam ao entrar na tela.
- **Galeria:** hover zoom 1.06 + véu vinho; clique abre lightbox com swipe.
- **FAQ:** accordion com altura animada, "+" gira 45°.
- **Formulário:** labels flutuantes; validação inline; pré-visualização da mensagem ao vivo; botão mostra "Abrindo WhatsApp…".
- **Divisor dourado:** linha desenha da esquerda p/ direita ao revelar.

## 9. Layout por seção (mobile-first)
1. **Header** — logo 40px à esq., botão "Orçamento" pill compacto à dir.; hambúrguer → drawer carvão full-height com links grandes Oswald. Desktop: links inline (Cardápio, Inclui, Como funciona, Galeria, FAQ) + CTA.
2. **Hero** — ~100svh, `--grad-hero` + foto de churrasco escurecida (overlay vinho 60%). Eyebrow "DESDE 2009 · REALENGO". H1: "O churrasco que faz o seu evento ser lembrado." Subtexto Fraunces. CTA primário full-width (mobile) + secundário "Ver cardápio". Faixa de confiança: "R$ 90/pessoa · 100 convidados · 6h de evento". Desktop: texto à esq., medalhão do logo grande à dir.
3. **Sobre** — fundo creme. Foto vertical (raio 24px) + texto curto; 3 números (anos, eventos, 100% brasa — placeholders). Selo "Since 2009".
4. **Cardápio** — fundo carvão. Abas pill com scroll horizontal (Churrasco · Guarnições · Petiscos · Bebidas). Churrasco em 2 grupos "Bovinas" / "Suínas & Aves" + extras; demais em cards. Nota: "Guarnições alteráveis ao seu gosto".
5. **O que inclui** — creme-100. Grid 2×N de ícones (descartáveis, rechaud, travessas de melamina, pegadores, toalhas, apoio). Chip dourado "Tudo incluso".
6. **Como funciona** — carvão-900. 3 passos verticais com linha conectora: ① Consulte a data ② Receba o orçamento ③ PIX de 50% garante a reserva. Rodapé: "6h de evento + 30 min de tolerância".
7. **Preço/Condições** (pode fundir com 6) — card destaque "a partir de R$ 90/pessoa"; lista do que faz variar (frete/distância, bebida, louça vs descartável; locais distantes ~R$ 120–130).
8. **Galeria** — 2 colunas (mobile) / masonry 3–4 col. (desktop), 6–8 placeholders (gradiente vinho + ícone chama) com legendas; lightbox.
9. **Depoimentos** — carrossel scroll-snap, 1 card + peek do próximo; 3 depoimentos inventados (aniversário, casamento, corporativo).
10. **Orçamento** — fundo `--grad-fogo` escuro com card creme centralizado. Campos: nº de pessoas (stepper), bairro, data, tipo de evento (opcional), bebidas/louça (toggles). Botão "Enviar pelo WhatsApp" monta `wa.me/?text=`. Aviso: "Confirmamos a disponibilidade antes do PIX".
11. **FAQ** — accordion: quanto custa? tem frete? posso trocar guarnições? como reservar? quanto tempo dura? bebida inclusa? atende fora de Realengo?
12. **Rodapé** — carvão-900; logo, bairro, WhatsApp, Instagram; linha dourada; "© TRG Buffet · Desde 2009". CTA final repetido.

## 10. Tom de voz
- Caloroso, direto e confiável — o vizinho que entende de churrasco, com capricho de profissional. Frases curtas, verbos de ação, "você".
- Apetite sem exagero: "picanha no ponto", "cupim macio", "farofa de verdade".
- Transparência: preço de partida claro + o que faz variar. Sem letras miúdas.
- Evitar jargão corporativo e excesso de exclamações (máx. 1 por bloco).
- Exemplos: CTA "Peça seu orçamento" · "Chama no Zap" · "Garanta sua data" · "Você cuida da festa, a gente cuida da brasa." · Erro: "Faltou a data — sem ela não conseguimos checar a agenda."

## 11. Acessibilidade e performance
- Contraste AA, foco visível, `lang="pt-BR"`, alt em imagens, abas com `role=tablist`, accordion com `aria-expanded`.
- Imagens WebP/AVIF com `loading="lazy"`; fontes com `display=swap` + preconnect; CSS + JS vanilla, sem libs pesadas.
- `meta theme-color` `#1E2A2A`.

# Dados fictícios para trocar

Todos os dados abaixo são **inventados** (placeholders realistas e consistentes). Troque antes de publicar.

| Dado | Valor atual | Onde trocar |
|---|---|---|
| WhatsApp | `5521974318206` / (21) 97431-8206 | **`js/main.js`** → bloco `SITE` (topo). Atualiza todos os links `[data-whatsapp]`, o formulário e o rodapé. Fallback sem JS: `href="https://wa.me/..."` no `index.html` (busque `5521974318206`) |
| E-mail | contato@trgbuffet.com.br | `SITE.email` (main.js) + `index.html` (rodapé, JSON-LD `email`) |
| Instagram | @trgbuffet | `SITE.instagram` (main.js) + `index.html` (rodapé, JSON-LD `sameAs`) |
| Endereço | Rua Marechal Fontenele, 1200 – Realengo/RJ, CEP 21730-000 | `SITE.address` (main.js) + `index.html` (rodapé `<address>`, JSON-LD `streetAddress`/`postalCode`) |
| Horário | Seg. a sáb., 8h às 19h | `SITE.hours` (main.js) + `index.html` (rodapé, JSON-LD `openingHours`) |
| Domínio | https://www.trgbuffet.com.br | `index.html`: `canonical`, `og:url`, `og:image`, JSON-LD `url`/`image` (busque `trgbuffet.com.br`) |
| Telefone (SEO) | +55-21-97431-8206 | `index.html` JSON-LD `telephone` |
| Faixa de preço | R$ 90 a R$ 130 por pessoa | `index.html` JSON-LD `priceRange` (e textos do hero, cardápio e FAQ) |
| Números (+500 eventos, 17 anos, 12 bairros, 4,9) | inventados | `index.html`, seção `.numbers` (`data-count`) |
| Depoimentos | 4 fictícios | `index.html`, seção `#depoimentos` |
| Bairros atendidos | 12 | `index.html`, seção `#bairros` |
| Imagens | SVGs ilustrados | `assets/img/hero.svg`, `galeria-1..8.svg`; trocar por fotos reais (WebP) |

## robots.txt e sitemap.xml

Já existem na raiz do projeto, com o domínio fictício. Ao trocar o domínio, atualize:

| Arquivo | Onde | Valor atual |
|---|---|---|
| `robots.txt` | linha `Sitemap:` | `https://www.trgbuffet.com.br/sitemap.xml` |
| `sitemap.xml` | `<loc>` | `https://www.trgbuffet.com.br/` |

Se criar novas páginas, adicione um `<url><loc>…</loc></url>` por página no `sitemap.xml`. O JSON-LD (`hasMenu.url`) também usa o domínio: busque `trgbuffet.com.br` no `index.html`.

## Sobremesas

Aba "Sobremesas" no cardápio, item opcional em "O que está incluso" e entrada no FAQ: todos marcados como opcional/adicional sob consulta. Itens inventados: pudim, mousse de maracujá/chocolate, brigadeiro e beijinho, pavê, salada de frutas, torta de limão (`index.html`, painel `#painel-sobremesas`).

## Fotos (placeholders de banco de imagens)

As fotos atuais são do Pexels, só para demonstração (créditos em `docs/CREDITOS-FOTOS.md`). Os SVGs ilustrados em `assets/img/` continuam como fallback.

Para trocar pelas fotos reais, **mantenha os mesmos nomes de arquivo** em `assets/fotos/` e gere duas versões WebP de cada (qualidade ~80):

| Arquivo | Lado maior | Observação |
|---|---|---|
| `hero-bg-1600.webp` / `hero-bg-800.webp` | 1600 / 800 px | fundo do hero (recebe overlay escuro; evite fotos claras) |
| `hero-card-1600.webp` / `hero-card-800.webp` | 1600 / 800 px | cartão do hero, proporção 3:2 |
| `galeria-N-1600.webp` / `galeria-N-800.webp` (N = 1 a 8) | 1600 / 800 px | exibidas em quadrado (`object-fit: cover`); mantenha o assunto centralizado |

Depois, ajuste os `alt` das 8 imagens da galeria e do hero no `index.html` (busque `gallery__img` e `hero__img`) e refaça `assets/img/og-image.png` (1200×630) com uma foto real. Exemplo de conversão com Python/Pillow: `Image.open(f).thumbnail((1600,1600)); im.save("x-1600.webp", quality=80)`.

## Calculadora de orçamento e verificador de data

Tudo fica em **`js/main.js` → `SITE.quote`** (bloco no topo). Os valores são inventados; troque pelos reais.

| Item | Chave em `SITE.quote` | Valor atual |
|---|---|---|
| Preço-base por pessoa | `basePerPerson` / `baseGuests` | R$ 90 (base de 100 convidados) |
| Mínimo / máximo / padrão de pessoas | `minGuests`, `maxGuests`, `defaultGuests` | 30 / 500 / 100 |
| Acréscimo para eventos pequenos | `smallEvent` (`upTo`, `add` por pessoa) | até 49: +R$ 15; até 99: +R$ 5 |
| Regiões e frete (por pessoa) | `regions` (`id`, `label`, `short`, `addMin`, `addMax`) | Realengo e vizinhos +0; Zona Oeste próxima +15; demais regiões do RJ +30 a 40 |
| Bebidas incluídas | `drinksPerPerson` | +R$ 12/pessoa |
| Louça (em vez de descartável) | `dishesPerPerson` | +R$ 8/pessoa |
| Sobremesas opcionais | `dessertPerPerson` | +R$ 9/pessoa |
| Adicionais (garçom, churrasqueiro) | `extras` (`price`, `max`) | R$ 180 e R$ 250 cada |
| Margem da faixa (mín–máx) | `variationPct` | ± 5% |
| Entrada via PIX | `pixPercent` | 50% |
| Antecedência mínima | `minLeadDays` | 7 dias |
| Janela de consulta | `maxMonthsAhead` | 12 meses |
| Dias sem atendimento | `closedWeekdays` | nenhum (0 = domingo … 6 = sábado) |
| Datas ocupadas | `busyDates` (`AAAA-MM-DD`) | lista inventada de out/2026 a abr/2027 |

Como funciona: a faixa por pessoa é `(base + evento pequeno + região + opções) ± variationPct`; o total soma os adicionais. A mensagem do WhatsApp usa os mesmos dados do formulário (pessoas, região, bairro, data, bebidas, material, sobremesas, adicionais e estimativa). O verificador de data é uma **consulta preliminar sem backend**: lê só `busyDates`. Para ficar útil, mantenha essa lista atualizada (ou, no futuro, troque por uma agenda real).

## Cardápio montável

Em **`js/main.js` → `SITE.menu`**:

| Item | Chave | Valor atual |
|---|---|---|
| Máximo de guarnições | `sidesMax` | 5 (das 7 do buffet completo) |
| Guarnições | `sides` (`id`, `label`) | arroz, farofa, molho à campanha, salpicão, salada de macarrão, salada caprese, batata frita |
| Caldos | `soups` | sopa de ervilha, caldo verde, feijão amigo |
| Carnes extras (porção a mais) | `extraMeats` (`perPerson`) | picanha +R$ 14, cupim +R$ 10, copa lombo +R$ 6, polpetone +R$ 5, queijo coalho +R$ 4 (por pessoa, inventados) |

A seleção entra na estimativa (carnes extras somam por pessoa) e na mensagem do WhatsApp.

## Pacotes

Em **`js/main.js` → `SITE.packages`** (3 pacotes inventados: Essencial, Completo recomendado, Premium). Cada item define: `sides` (ids das guarnições), `soup`, `drinks`, `dishes`, `dessert`, `meats` (ids de `SITE.menu.extraMeats`) e `extras` (`{ garcom: 2, churrasqueiro: 1 }`). O preço "a partir de" é calculado com `SITE.quote` (base + opções, Realengo, 100 convidados). Para destacar outro pacote, mova `recommended: true`. O botão pré-seleciona a calculadora e leva o cliente ao formulário.

## Barra fixa inferior (mobile)

`<nav class="dock">` no fim do `index.html` (3 atalhos: Orçamento, WhatsApp, Cardápio). Aparece só abaixo de 768px; o botão flutuante do WhatsApp sobe para ficar acima dela. O link do WhatsApp usa `data-whatsapp`, então o número vem de `SITE.whatsapp`. Para mudar a altura, ajuste `--dock-h` no CSS.

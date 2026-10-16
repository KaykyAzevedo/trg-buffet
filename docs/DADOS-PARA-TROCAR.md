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

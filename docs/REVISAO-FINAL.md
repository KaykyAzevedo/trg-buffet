# Revisão final (qualidade)

Medições locais (Edge headless, servidor estático local, sem compressão HTTP, sem throttling de rede). Servem de referência, não substituem Lighthouse/WebPageTest em produção.

## Arquitetura de dados

- Dados editáveis em `data/site-data.json` (contato, calculadora, agenda, cardápio, cardápio montável, pacotes, avaliações), carregados no início por `js/site.js` com **fallback embutido** (`DEFAULTS`). Testado: JSON válido alterado (aplica), sintaxe quebrada, valores inválidos e arquivo ausente (os três voltam para os dados embutidos sem erro).
- Configurações técnicas (`SITE.analytics`, `SITE.heroVideo`) ficam em `js/main.js` e não são alteráveis pelo JSON.
- Agenda: JSON e, opcionalmente, planilha Google publicada como CSV (`agenda.csvUrl`), com cache curto e fallback para o JSON. Testado: CSV válido (cabeçalho, aspas, datas ISO e DD/MM/AAAA, `;`), página HTML no lugar do CSV, URL 404.
- Painel `/admin/` publica via API do GitHub (token só em `sessionStorage`). Fluxos testados com a API simulada: sem token, sucesso, conflito de conteúdo (e "publicar mesmo assim"), criação do arquivo (404), 401, 403 na leitura e na gravação, 409/422, erro de rede e 500.
- Avaliações: `AggregateRating`/`Review` no JSON-LD **só** para itens `real: true` (hoje nenhum: todas as avaliações são exemplos).

## Acessibilidade (axe-core 4.10)

| Cenário | Violações |
|---|---|
| Site, tema escuro e tema claro, estado inicial | 0 |
| Site, ambos os temas, com pacote, mapa, data ocupada, aba "Sobremesas" e menu mobile abertos | 0 |
| Site com avaliações de exemplo (resumo, selo "Exemplo") | 0 |
| Painel `/admin/`: as 6 abas + janela de pré-visualização (500px e 1280px) | 0 |
| `cardapio.html` | 0 |

Teclado verificado: calendário do site e do painel (setas, Home/End, PageUp/PageDown, Enter), abas (site e painel), mapa de bairros, toggle de tema, pausa do vídeo, lightbox, reordenação de itens no painel (botões ↑ ↓).

## Desempenho (carga fria, desktop 1280, tema escuro)

| Métrica | Valor |
|---|---|
| LCP / FCP | ~0,3 s |
| CLS | 0 |
| DOMContentLoaded / load | ~0,13 s / ~0,22 s |
| Requisições | 23 |

Peso transferido na carga inicial do site (sem compressão; imagens abaixo da dobra são `loading="lazy"`):

| Tipo | Tamanho |
|---|---|
| HTML | ~50 KB (≈ 12 KB gzip) |
| CSS | ~80 KB (≈ 16 KB gzip) |
| JS (`site.js` + `main.js`) | ~87 KB (≈ 24 KB gzip) |
| `data/site-data.json` | ~10 KB |
| Fontes WOFF2 (4 arquivos, latin) | ~175 KB |
| Fotos WebP (hero + galeria) | ~0,6 MB |
| Total | ~1,07 MB sem compressão |

O painel (`admin.js` ≈ 64 KB, `admin.css` ≈ 12 KB) e a página do cardápio (`cardapio.js`/`cardapio.css` ≈ 13 KB) só carregam quando abertos. Em 360px nenhuma das três páginas (site, cardápio, painel) tem rolagem horizontal.

Observações:
- O boot do site espera o JSON (timeout de 2,5 s; local ~10 ms). Com rede lenta o conteúdo estático aparece antes e a interatividade chega quando o JSON responde ou estoura o tempo. O `<link rel="preload">` do JSON adianta o pedido.
- Ative gzip/brotli no host. O `service worker` guarda os arquivos principais (JSON pela rede primeiro) e não intercepta `/admin/`.

## Como repetir

1. Servir a pasta (`python -m http.server`) e abrir no Chrome/Edge.
2. DevTools > Lighthouse (mobile) para LCP/CLS/PWA; extensão axe DevTools para acessibilidade.
3. Testar os dois temas pelo botão do header e com `prefers-color-scheme` alterado nas ferramentas do navegador.
4. Para testar o JSON: edite `data/site-data.json` (ou quebre a sintaxe) e recarregue; o atributo `data-source` do `<html>` mostra `json` ou `embutido`.

## Pendências conhecidas

- Fotos, textos, preços, datas e avaliações são de demonstração (ver `docs/CREDITOS-FOTOS.md` e `docs/DADOS-PARA-TROCAR.md`). **Troque as avaliações de exemplo por reais antes de divulgar.**
- Vídeo do hero: suporte pronto, mas sem arquivo (`SITE.heroVideo.enabled = false`).
- `noindex`: `index.html`, `cardapio.html` e `/admin/` estão com `noindex` (modo demo). Remova nas duas primeiras ao publicar de verdade; mantenha no painel.
- O painel não tem login: a proteção é o token do GitHub (ver `docs/PAINEL-ADMIN.md`).
- Textos soltos no HTML (preço "R$ 90" no hero, FAQ, JSON-LD de SEO, telefone no JSON-LD) não vêm do JSON: se os dados mudarem, atualize-os também.
- A cada release, aumente `VERSION` em `sw.js` (hoje `trg-buffet-v12`).

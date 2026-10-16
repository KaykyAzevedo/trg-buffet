# Revisão final (qualidade)

Medições locais (Edge headless, servidor estático local, sem compressão HTTP, sem throttling de rede). Servem de referência, não substituem Lighthouse/WebPageTest em produção.

## Acessibilidade (axe-core 4.10)

| Cenário | Violações |
|---|---|
| Tema escuro, estado inicial | 0 |
| Tema claro, estado inicial | 0 |
| Ambos os temas com pacote selecionado, região via mapa, data ocupada consultada e aba "Sobremesas" aberta | 0 |
| Menu mobile aberto no tema claro | 0 |

Teclado verificado: calendário (setas, Home/End, PageUp/PageDown, Enter), abas do cardápio, mapa de bairros (Enter/Espaço), toggle de tema, botão de pausa do vídeo, lightbox (Esc, setas, foco preso).

## Desempenho (carga fria, desktop 1280, tema escuro)

| Métrica | Valor |
|---|---|
| LCP | ~0,4 s |
| FCP | ~0,4 s |
| CLS | 0 |
| DOMContentLoaded / load | ~0,25 s / ~0,3 s |
| Requisições | 22 |

Peso transferido na carga inicial (sem compressão; imagens abaixo da dobra são `loading="lazy"`):

| Tipo | Tamanho |
|---|---|
| HTML | ~49 KB (≈ 11 KB gzip) |
| CSS | ~78 KB (≈ 15 KB gzip) |
| JS | ~62 KB (≈ 17 KB gzip) |
| Fontes WOFF2 (4 arquivos, latin) | ~175 KB |
| Fotos WebP (hero + galeria) | ~0,6 MB, 800px no mobile |
| Total | ~1,0 MB sem compressão |

Observações:
- Os números mudam com rede real. Ative gzip/brotli no host (CSS, JS e HTML caem para cerca de 40 KB no total).
- O `service worker` guarda os arquivos principais: a segunda visita e o modo offline não dependem da rede.
- Não há fontes nem scripts de terceiros; analytics só carrega se configurado (`SITE.analytics`).

## Como repetir

1. Servir a pasta (`python -m http.server`) e abrir no Chrome/Edge.
2. DevTools > Lighthouse (mobile) para LCP/CLS/PWA; extensão axe DevTools para acessibilidade.
3. Testar os dois temas pelo botão do header e com `prefers-color-scheme` alterado nas ferramentas do navegador.

## Pendências conhecidas

- Fotos e textos são de demonstração (ver `docs/CREDITOS-FOTOS.md` e `docs/DADOS-PARA-TROCAR.md`).
- Vídeo do hero: suporte pronto, mas sem arquivo (`SITE.heroVideo.enabled = false`).
- `robots`/`noindex`: o `index.html` está com `noindex, nofollow` (modo demo). Remova ao publicar de verdade.
- A cada release, aumente `VERSION` em `sw.js`.

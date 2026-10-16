# Painel de administração (`/admin/`)

Painel simples para o dono do negócio editar o site **sem mexer em código**: preços e regiões, cardápio, agenda, avaliações e contato. Tudo é salvo em `data/site-data.json`, que o site lê ao abrir.

Endereço depois de publicado: `https://kaykyazevedo.github.io/trg-buffet/admin/` (ou `<seu-domínio>/admin/`). A página tem `noindex` e está em `Disallow` no `robots.txt`, mas **o endereço não é secreto**.

## O que o painel é (e o que não é)

> **Não existe login nem senha.** Qualquer pessoa que abrir `/admin/` vê os formulários. Isso é intencional: um site estático não tem como guardar uma senha de forma segura, e uma "senha" no JavaScript seria falsa proteção.
>
> A proteção real é o **token do GitHub**: só quem tem o token consegue **publicar** alguma coisa. Sem token dá no máximo para olhar e baixar um JSON no próprio computador.

Boas práticas:

- O token fica **só na aba aberta** (`sessionStorage`) e só é enviado ao `api.github.com`. Não é gravado no site, no repositório, nem em cookies. Fechou a aba, o token some. Há o botão **Esquecer token**.
- **Nunca** envie o token por e-mail, WhatsApp ou print. Se vazar, revogue em GitHub > Settings > Developer settings > Personal access tokens.
- Use um token com **validade curta** (ex.: 30 dias) e escopo mínimo (abaixo).
- Cada publicação vira um **commit**: dá para ver o histórico e desfazer no GitHub.

## Como criar o token (escopo mínimo, só neste repositório)

1. Entre no GitHub com a conta dona do repositório e abra **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. **Token name:** `painel-trg-buffet`. **Expiration:** 30 dias (ou o que preferir).
3. **Repository access:** *Only select repositories* → marque **somente** `KaykyAzevedo/trg-buffet`.
4. **Permissions > Repository permissions:** **Contents → Read and write**. Deixe todo o resto como *No access* (o *Metadata: Read-only* aparece sozinho).
5. Clique em **Generate token** e **copie** o valor que começa com `github_pat_` (ele só aparece uma vez).
6. No painel, aba **Publicar**, cole no campo "Token do GitHub".

Se o repositório pertencer a uma organização, o dono da organização pode precisar aprovar o token.

## Como usar

1. Abra `/admin/`. O painel carrega o `data/site-data.json` atual.
2. Edite nas abas **Preços e regiões**, **Cardápio**, **Agenda**, **Avaliações** e **Contato**. Os campos com erro ficam em vermelho e uma lista aparece no topo (clique para ir ao campo).
3. **Pré-visualizar** mostra um resumo (preços por região, cardápio, agenda, avaliações, contato) antes de salvar.
4. Salve de uma das duas formas:
   - **Publicar** (aba Publicar): grava `data/site-data.json` no GitHub pela API. O site atualiza em 1 a 2 minutos.
   - **Baixar JSON**: baixa o arquivo para você enviar manualmente ao repositório (GitHub > `data/` > *Add file > Upload files*), sem usar token.
5. **Abrir arquivo JSON…** carrega um arquivo salvo antes; **Recarregar do site** descarta as alterações e lê de novo.

### Abas

- **Preços e regiões:** preço-base, quantidade mínima/máxima, margem da faixa, PIX, antecedência, acréscimos (bebidas, louça, sobremesas), dias sem atendimento, faixas de evento pequeno, regiões com frete (mín–máx) e adicionais (garçom, churrasqueiro). Um **simulador** mostra como a calculadora vai responder. As regiões `realengo`, `oeste` e `rj` são usadas pelo mapa do site e não podem ser removidas.
- **Cardápio:** categorias (viram abas), grupos com título opcional e itens; adicionar, remover e **reordenar com as setas** (↑ ↓, funciona no teclado). A categoria "Guarnições" é necessária (alimenta o cardápio montável). Também edita caldos, carnes extras e as condições do serviço.
- **Agenda:** calendário clicável (toque no dia para ocupar/liberar), lista de datas com anotação de motivo (só para você) e o link opcional da planilha do Google (com botão **Testar planilha**). Veja o passo a passo em `docs/DADOS-PARA-TROCAR.md`, seção "Agenda".
- **Avaliações:** veja abaixo.
- **Contato:** WhatsApp (só números com DDI/DDD), telefone, e-mail, Instagram, endereço e horário.

## Avaliações: troque os depoimentos fictícios

Os depoimentos que acompanham o site são **de exemplo**. Cada avaliação tem a caixa **"Avaliação real, com autorização do cliente"**:

- Avaliações **não marcadas como reais** aparecem no site com o aviso "exemplos" e **não** geram dados estruturados (nota/estrelas) para o Google.
- Só as marcadas como reais entram no JSON-LD (`AggregateRating`/`Review`) do site. Publicar avaliações inventadas viola as diretrizes do Google para dados estruturados e pode causar penalidade.
- Antes de divulgar o site, substitua os exemplos por avaliações reais (peça autorização ao cliente) e marque-as.

## Se algo der errado ao publicar

| Mensagem | O que fazer |
|---|---|
| O GitHub recusou o token | Token errado, expirado ou revogado: gere outro (passo a passo acima). |
| O token não tem permissão | O token precisa de **Contents: Read and write** neste repositório; confira também se ele foi liberado para o repositório certo. |
| Não encontrei o repositório ou o arquivo | Confira dono/repositório/branch em *Avançado* e o acesso do token. |
| O arquivo no GitHub é diferente do que você abriu | Alguém publicou antes (ou o painel não conseguiu ler o JSON). Nada foi sobrescrito. Use **Recarregar do site** e refaça a alteração, ou marque **Publicar mesmo assim** se tiver certeza. |
| Conflito (409/422) | O arquivo mudou durante a publicação. Recarregue e tente de novo. |
| Não consegui falar com o GitHub | Sem internet ou GitHub fora do ar: seus dados continuam na tela, tente de novo. |

## Para quem mantém o código

- Arquivos: `admin/index.html`, `admin/admin.css`, `admin/admin.js`; usa `js/site.js` (valores padrão, validação básica, parser da agenda).
- O painel preserva as chaves do JSON que ele não edita (ex.: `packages`). Ao salvar, completa `id`s novos (slug do nome) e atualiza `updatedAt`.
- A publicação faz `GET` (detecta conflito comparando o conteúdo atual do arquivo com o que foi aberto) e `PUT` em `/repos/{dono}/{repo}/contents/{arquivo}` com o `sha` atual. Não há servidor próprio.
- O service worker não intercepta `/admin/`.

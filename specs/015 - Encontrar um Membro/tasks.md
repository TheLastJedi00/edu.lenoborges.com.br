> **Dependência de ordem:** a Fase 04 (e-mail direto) depende da spec **014** no código, e as redes sociais
> do detalhe da Fase 03 dependem da **013** — as tasks das duas estão abertas. As Fases 01 a 03 não dependem
> de nenhuma das duas e podem entrar antes; onde um campo ainda não existir na API, ele sai do modelo e
> volta quando aquela spec subir.
>
> **Dependência de contrato:** as Fases 01 e 02 exigem a spec 015 do **backend** no ar. `GET /admin/users`
> troca `nextPageToken` por `total`/`offset` e passa a aceitar busca e filtros; a tela de hoje quebra no dia
> em que o backend subir sem esta spec. **As duas entram juntas.**

# Fase 01: O contrato novo [x]
Branch: `feat/015-contrato-da-lista`

Nenhuma mudança visível. Ao fim desta fase a tela continua exatamente como está, sobre uma API diferente.

- [x] Task 01: O modelo. Arquivo: `src/app/models/admin.model.ts`. Objetivo: `AdminUserPage` troca
  `nextPageToken` por `total`, `offset` e `limit`; `AdminUser` perde `phone` e ganha `emailOptOut`; nasce
  `AdminUserFilters` (`q`, `onboarding`, `tiers`, `gradeMin`, `gradeMax`). Comentário registrando que
  **`total` é do recorte e não da base** — é a frase que impede a tela de escrever "213 membros" com um
  filtro ligado.
- [x] Task 02 (TDD + implementação): O serviço. Arquivos: `src/app/services/admin.service.ts`, `.spec.ts`.
  Objetivo: `listUsers(filters, offset, limit)` montando `HttpParams` **sem os parâmetros vazios** — `q=` e
  `tiers=` vazios na URL são ruído que acaba virando filtro por string vazia no dia em que alguém trocar a
  validação do backend. Testes-trava: filtro ausente não aparece na URL; `tiers` com dois itens vira dois
  valores do mesmo parâmetro.
- [x] Task 03 (TDD + implementação): `getUser(id)`. Objetivo: `GET /admin/users/:id` devolvendo
  `AdminUserDetail` — a linha mais `phone`, `bio`, `linkedin`, `instagram`, os três campos de descadastro,
  as datas do perfil, `canReceiveEmail` e `cannotReceiveReason`. O tipo do motivo é uma **união literal**, e
  não `string`: a tela escolhe o texto pelo código (decisão 15), e um `string` deixaria o `switch` sem
  exaustividade.
- [x] Task 04: `tier` enfim chega. Arquivos: `usuarios.page.ts`, `.spec.ts`. Objetivo: remover qualquer
  contorno para `tier` vindo `undefined` e provar com teste que o seletor de tier do editor **abre no valor
  do membro** — hoje ele abre vazio porque a API nunca mandou o campo (spec 010). Está escrito como task
  para o conserto ser verificado, e não presumido.
- [x] Task 05 (TDD + implementação): "Carregar mais" por `offset`. Objetivo: a paginação passa a somar
  `offset`, e o botão só aparece enquanto `offset + carregados < total`. Teste-trava: **carregar a segunda
  página não duplica linhas** — o erro clássico ao trocar cursor por deslocamento, e ele só aparece com mais
  de uma página.

# Fase 02: Buscar e filtrar [x]
Branch: `feat/015-busca-e-filtros`

- [x] Task 01: O campo de busca. Arquivos: `src/app/pages/admin/usuarios/usuarios.page.html`, `.scss`.
  Objetivo: um campo com o rótulo **"Buscar por nome ou e-mail"**, `type="search"`, sempre visível — **fora
  do bloco de filtros** (decisão 16), porque é o controle que resolve a maior parte dos casos.
- [x] Task 02 (TDD + implementação): O atraso e a corrida. Arquivos: `usuarios.page.ts`, `.spec.ts`.
  Objetivo: `debounceTime(400)` mais `switchMap`, como a contagem da spec 014. Testes-trava: (a) duas teclas
  rápidas fazem **uma** requisição; (b) resposta antiga chegando depois da nova **não** vence — a lista
  ficaria contradizendo o que está escrito no campo, e nada na tela denunciaria.
- [x] Task 03: O bloco de filtros. Objetivo: "Onboarding pendente", os quatro tiers em caixas e a faixa de
  insígnia em dois seletores de 0 a 13. **Os rótulos de tier saem do `billing.model` e os de etapa do
  `core/progress`** — nenhum texto redigitado, e a mesma ordem da tela de e-mails (decisão 5).
- [x] Task 04 (TDD + implementação): O recorte na URL. Objetivo: filtros e busca viram query da rota, lidos
  na inicialização e escritos a cada mudança (decisão 2). **Teste-trava: a busca escreve com
  `replaceUrl: true`** — sem isso, "voltar" caminha letra por letra e a tela fica irrecuperável. Segundo
  teste: abrir a rota já com `?q=&tiers=` aplica o recorte antes da primeira requisição, e não depois.
- [x] Task 05 (TDD + implementação): A contagem. Objetivo: **"213 membros"** sem filtro e **"12 de 213
  membros"** com filtro (decisão 6), e o botão vira **"Carregar mais (163 restantes)"**. Teste-trava: com
  filtro ligado, o texto **não** é só o número — um número solto é lido como o tamanho da comunidade.
- [x] Task 06: "Todos os membros". Objetivo: sem nenhum filtro marcado, o rótulo do recorte é **"Todos os
  membros"**, com as mesmas palavras da tela de e-mails (decisão 4). Um estado vazio que não se explica é o
  pior padrão de uma tela de filtro, nas duas telas e por razões opostas — e o comentário registra as duas.
- [x] Task 07: Os dois vazios. Objetivo: **"Nenhum membro com esse recorte"** com **"Limpar filtros"** ao
  lado, separado do vazio de base sem cadastros (decisão 7). A mensagem própria do **403 não muda** — a
  claim de admin só vale no próximo token, e mandar sair e entrar de novo continua sendo a resposta certa.
- [x] Task 08: Mobile. Objetivo: os filtros num `details` fechado com **"Filtros (2)"** contando os ativos,
  a busca fora dele, alvos de 44px e nada fixo na borda (decisão 16). Conferir no Chrome nas duas larguras.

# Fase 03: O detalhe do membro [x]
Branch: `feat/015-detalhe-do-membro`

O diálogo de edição de hoje vira o lugar onde se olha para uma pessoa. As duas edições vão junto, e não
mudam.

- [x] Task 01: O diálogo cresce. Arquivos: `usuarios.page.html`, `.scss`. Objetivo: o `editing` de hoje vira
  o detalhe, com quatro blocos: **identidade** (nome, e-mail, telefone, bio, redes), **estado** (tier, etapa,
  onboarding, e-mail verificado, conta ativa, admin), **e-mails** (decisão 11) e **as duas edições**. Sem
  sub-rota (decisão 1).
- [x] Task 02 (TDD + implementação): Buscar ao abrir. Arquivos: `usuarios.page.ts`, `.spec.ts`. Objetivo:
  abrir dispara `getUser(id)`; enquanto não volta, o diálogo mostra o que a **linha** já sabia e o resto em
  esqueleto (decisão 9). Teste-trava: o diálogo **não abre vazio** — abrir vazio e preencher depois faz o
  clique parecer que falhou.
- [x] Task 03 (TDD + implementação): Falha no detalhe não fecha o diálogo. Objetivo: erro vira mensagem
  **dentro** dele, com "Tentar de novo". Teste-trava explícito: fechar sozinho na falha faz o admin clicar
  de novo, e é indistinguível de o clique não ter pego.
- [x] Task 04: As duas edições, no lugar novo e sem mudança nenhuma. Objetivo: `grade` e `tier` em
  `fieldset`s separados, com um botão cada e uma requisição cada. **O comentário de hoje vai junto,
  literal** — *encostados sem explicação, `tier` e `grade` viram a mesma coisa na cabeça de quem clica* — e a
  task existe para deixar escrito que mover é a única mudança permitida (decisão 10).
- [x] Task 05: O estado de e-mail, com motivo. Objetivo: **"Recebe os e-mails da Liga Dev"** ou **"Não recebe
  e-mails"** seguido do motivo e da data (decisão 11). Comentário obrigatório registrando que **isto é o
  oposto do que a decisão 12 da spec 014 faz em Meu Perfil, de propósito**: lá quem lê não pode agir, aqui
  pode. Sem o comentário, isto vira "inconsistência" no próximo code review.
- [x] Task 06: Nada de desativar, excluir ou promover. Objetivo: nenhum botão desses no detalhe. Está escrito
  como task para a ausência ser deliberada — é o lugar onde os três parecem caber, e os três foram recusados
  com argumento em specs anteriores.
- [x] Task 07: Rolagem e foco. Objetivo: o diálogo rola por dentro no celular, `Esc` fecha, o foco entra nele
  ao abrir e volta para a linha ao fechar — o mesmo comportamento dos diálogos que o sistema já tem, **sem
  inventar um segundo padrão**.

# Fase 04: O e-mail direto [x]
Branch: `feat/015-email-direto`

> Depende da spec 014 estar no código.

- [x] Task 01 (TDD + implementação): O serviço. Arquivos: `src/app/services/admin.service.ts`, `.spec.ts`.
  Objetivo: `enviarEmailDireto(userId, { subject, body })` em `POST /admin/users/:id/email`. **Sem
  `ctaLabel` e sem `ctaUrl`** (decisão 12), e o comentário diz por quê — é o primeiro campo que alguém vai
  querer "só adicionar".
- [x] Task 02: O diálogo. Arquivos: `usuarios.page.html`, `.scss`. Objetivo: **"Escrever e-mail"** no detalhe
  abre um diálogo com assunto e corpo (`textarea`), os dois obrigatórios. **Nenhum editor rico, nenhuma
  prévia, nenhum filtro** — a tela de campanha é outra, e o motivo está na decisão 12.
- [x] Task 03: O botão diz o endereço. Objetivo: **"Enviar para membro@email.com"**, e **nenhum
  `confirm-dialog` por cima** (decisão 14). Comentário registrando a diferença para a spec 014: lá o diálogo
  existe porque o número é grande e abstrato; aqui o destinatário está escrito no botão.
- [x] Task 04 (TDD + implementação): Quem não pode receber. Objetivo: `canReceiveEmail: false` nasce com o
  botão **desabilitado** e o motivo escrito ao lado, pela tabela da decisão 15. Teste-trava: membro
  descadastrado **não consegue abrir o diálogo** — deixar o botão ligado faria o admin escrever um recado
  inteiro para descobrir no fim que ele não sai.
- [x] Task 05 (TDD + implementação): O `422`. Objetivo: o erro é tratado escolhendo o texto pelo **`reason`
  do corpo**, e nunca por leitura da mensagem. Teste-trava: `reason: 'descadastrado'` mostra a frase da
  tabela — texto de erro do backend não é contrato, e um `includes('descadastr')` quebra na primeira revisão
  de copy de lá.
- [x] Task 06 (TDD + implementação): O `409`. Objetivo: campanha em andamento vira **"Tem um disparo
  acontecendo agora. Tente daqui a pouco."** — e não um erro genérico. É o trinco da spec 014 aparecendo
  numa tela que não fala de campanha, e sem esse texto ele é indistinguível de falha.
- [x] Task 07 (TDD + implementação): Enviando e enviado. Objetivo: campos desabilitados e botão em
  **"Enviando…"** durante a requisição; ao terminar, o diálogo fecha e o detalhe mostra **"E-mail enviado"**
  por alguns segundos (decisão 14). Teste-trava: **um clique duplo no botão não manda dois e-mails** — é a
  única ação irreversível desta tela, e a proteção é do front porque o backend não tem como saber que são o
  mesmo recado.

# Fase 05: Verificação [ ]
Branch: `feat/015-verificacao`

- [ ] Task 01: O caminho inteiro com o backend ligado. Objetivo: buscar por trecho do sobrenome, filtrar por
  onboarding pendente, conferir que **aparece alguém que não tem perfil**, abrir o detalhe, editar a etapa,
  editar o tier, e mandar um e-mail direto para si mesmo. Abrir o e-mail e conferir que o rodapé de
  descadastro está lá — ele vai também no e-mail direto, e é a decisão 13 da spec 015 do backend visível.
- [ ] Task 02: O recorte sobrevive ao F5. Objetivo: montar um recorte de quatro controles, recarregar, e ver
  a mesma lista. Depois, apertar "voltar" e ver o recorte anterior — **e não a tela quatro teclas atrás**
  (decisão 2).
- [ ] Task 03: Chrome, nas duas larguras. Objetivo: celular e desktop. O caso a olhar com atenção é o
  **diálogo do membro no celular**: ele rola por dentro, não estica a página, e o botão de enviar não fica
  fixo no rodapé.
- [ ] Task 04: Conferir que a tela de e-mails não mudou. Objetivo: abrir `/dashboard/admin/emails` e provar
  que nada dela foi tocado por esta spec — mesmo recorte, mesma contagem, mesmo teste obrigatório. **A
  exceção da decisão 13 vale só para o e-mail direto**, e é aqui que se verifica que ela não vazou.

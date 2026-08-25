> **Dependência de ordem:** a Fase 05 mexe em `/dashboard/perfil`, que é da spec 013 e **ainda não
> existe no código** (as tasks daquela spec estão abertas). As Fases 01 a 04 e a 06 não dependem dela e
> podem entrar antes; a 05 espera a 013 subir. Se as duas forem executadas juntas, a seção de e-mails
> nasce dentro da tela nova, e esta fase vira duas tasks lá.

# Fase 01: Camada de dados [x]
Branch: `feat/014-emails-camada-de-dados`

Nenhuma tela. Ao fim desta fase o front sabe conversar com os oito endpoints, e nada aparece ainda.

- [x] Task 01: O modelo. Arquivo: `src/app/models/email.model.ts`. Objetivo: `EmailFilters`
  (`tiers`, `gradeMin`, `gradeMax`, todos opcionais), `SendEmailRequest`, `EmailCampaign` e
  `CampaignStatus`. Comentário registrando que **filtro ausente significa todos os membros**, e não
  ninguém — é a inversão que uma tela de disparo não pode errar.
- [x] Task 02 (TDD + implementação): O serviço. Arquivos: `src/app/services/email.service.ts`, `.spec.ts`.
  Objetivo: `audiencia(filters)`, `enviarTeste(payload)`, `enviar(payload)`, `retomar(id)` e
  `listar()`. Mesmo desenho do `admin.service.ts` que já existe — **não inventar padrão novo de HTTP**.
- [x] Task 03 (TDD + implementação): O descadastro. Arquivos: `src/app/services/email.service.ts`,
  `.spec.ts`. Objetivo: `descadastrar(token)` batendo em `POST /emails/descadastro`. **Sem
  `Authorization`** — é chamada pública, feita por quem pode não ter sessão nenhuma (decisão 11), e um
  interceptor que anexe token aqui não pode quebrar a chamada.
- [x] Task 04 (TDD + implementação): O interruptor do perfil. Arquivos:
  `src/app/services/profile.service.ts`, `.spec.ts`. Objetivo: `definirRecebimentoDeEmail(receber)` em
  `PATCH /me/emails`, e `emailOptOut` em `MemberProfile` (`src/app/models/auth.model.ts`).
- [x] Task 05: `emailOptOut` no `AdminUser`. Arquivo: `src/app/models/admin.model.ts`. Objetivo: o campo
  novo, para a lista de usuários poder mostrar quem não recebe.

# Fase 02: Escrever e filtrar [x]
Branch: `feat/014-tela-de-emails`

Ao fim desta fase a tela existe, calcula a audiência e **não envia nada** — o botão de disparo entra na
Fase 03, de propósito.

- [x] Task 01: Rota e porta. Arquivos: `src/app/app.routes.ts`, `src/app/pages/admin/admin.page.ts`.
  Objetivo: `/dashboard/admin/emails` atrás de `adminGuard`, com `loadComponent`, e o quarto cartão no
  índice da Administração (decisão 1). **Nada muda no `dashboard-aside`** — a Administração inteira entra
  por uma porta só.
- [x] Task 02: O bloco Escrever. Arquivos: `src/app/pages/admin/emails/emails.page.ts`, `.html`, `.scss`.
  Objetivo: formulário reativo com assunto, corpo (`textarea`), e rótulo + endereço do botão opcional.
  **Nenhum editor rico e nenhum campo de HTML** (decisão 3). Validação: assunto e corpo obrigatórios; se
  um dos dois campos do botão vier preenchido, o outro passa a ser obrigatório.
- [x] Task 03: O bloco Para quem. Objetivo: os quatro tiers como caixas (rótulos do `billing.model`, não
  digitados de novo) e a faixa de insígnia como dois seletores de 0 a 13. **Nenhum campo de status de
  pagamento**, e um comentário no template dizendo por quê — é o campo que vai ser pedido, e a resposta
  precisa estar escrita onde alguém a lê antes de adicioná-lo.
- [x] Task 04 (TDD + implementação): A contagem viva. Objetivo: mudança de filtro dispara
  `audiencia(...)` com `debounceTime(400)` e `switchMap`, e o resultado vira **"42 membros vão receber"**.
  Nenhum filtro marcado mostra **"Todos os membros"** com a contagem ao lado (decisão 4). Teste-trava:
  duas mudanças rápidas fazem **uma** requisição, e a resposta que chega é a da última — resposta antiga
  vencendo a nova aqui significa disparar com um número errado na tela.
- [x] Task 05 (TDD + implementação): Falha de audiência bloqueia. Objetivo: erro em `audiencia` põe um
  traço no lugar do número e **desabilita o envio** até uma contagem válida chegar (decisão 14).
  Teste-trava explícito, e o comentário registra por que aqui é diferente da spec 012 — lá o acessório
  não podia bloquear nada; aqui o que falta é o tamanho do estrago.
- [x] Task 06: A prévia. Objetivo: o corpo renderizado com o mesmo espaçamento e a mesma hierarquia do
  template do e-mail, dentro de um `pixel-panel`. Quebra de linha vira parágrafo, e o botão opcional
  aparece como botão. **A prévia é aproximação, e a tela diz isso em uma linha** (ponto em aberto 4).

# Fase 03: Conferir e enviar [x]
Branch: `feat/014-disparo`

A fase da ação irreversível. Cada task aqui existe para pôr uma coisa entre o admin e o erro.

- [x] Task 01 (TDD + implementação): O teste. Objetivo: "Enviar teste para mim" chama `enviarTeste` e
  marca o conteúdo atual como testado. Estado de sucesso curto na própria linha do botão.
- [x] Task 02 (TDD + implementação): O destravamento. Objetivo: o botão de disparo fica **desabilitado
  até um teste ter sido enviado**, e volta a travar quando assunto, corpo ou botão mudam (decisão 5).
  **Mudar filtro não trava** — o conteúdo é o mesmo. Testes-trava, os dois: editar depois de testar trava
  de novo; trocar de tier não trava.
- [x] Task 03: O botão diz o número. Objetivo: **"Enviar para 42 pessoas"**, nunca "Enviar" (decisão 4).
  O número sai da mesma fonte da contagem, e não de uma segunda variável — duas verdades sobre o mesmo
  número é como elas divergem.
- [x] Task 04 (TDD + implementação): A confirmação. Objetivo: o `confirm-dialog` já existente, com o
  assunto e a contagem dentro, e o botão final repetindo **"Enviar para 42 pessoas"** (decisão 6). `Esc`
  e clique fora cancelam — já resolvidos no componente.
- [x] Task 05 (TDD + implementação): O envio. Objetivo: formulário desabilitado, botão em **"Enviando…"**,
  e nada mais na tela clicável até a resposta (decisão 7). **Sem barra de progresso** — não há progresso
  para ler, e um comentário registra isso para ninguém "melhorar" a espera depois.
- [x] Task 06 (TDD + implementação): O erro que **não** diz "não enviou". Objetivo: falha de rede ou de
  tempo mostra que **o envio começou e pode ter sido interrompido**, com o caminho para o histórico
  (decisão 8). **Teste-trava sobre o texto**, e o comentário explica: "tente de novo" aqui faz o admin
  reenviar para quem já recebeu, e essa é a pior consequência possível desta tela.
- [x] Task 07: Mobile. Objetivo: campos em coluna, filtros empilhados, alvos de 44px, e o botão de envio
  **no fluxo da página, nunca fixo** (decisão 15). Um disparo irreversível não pode ficar no caminho do
  polegar que rola.

# Fase 04: Enviados [x]
Branch: `feat/014-historico`

- [x] Task 01: A lista. Objetivo: as 20 campanhas mais recentes com assunto, data, "para N pessoas" e o
  estado. **Nenhuma linha clicável e nenhuma tela de detalhe** (decisão 9). A data usa o mesmo formato de
  relógio da spec 012 (`notification-time.ts`) — **reusar, não reimplementar**.
- [x] Task 02 (TDD + implementação): Retomar. Objetivo: campanha `interrompida` ganha o botão
  **"Retomar"**, que chama `retomar(id)` e atualiza a linha. Enquanto retoma, a linha fica em estado de
  envio e o disparo novo fica bloqueado — o backend só aceita um por vez, e a tela não deve descobrir isso
  por 409.
- [x] Task 03: Estado vazio. Objetivo: **"Nenhum e-mail enviado ainda"**, no mesmo tom do "Nada novo por
  aqui" da spec 012.
- [x] Task 04: Uma requisição só ao abrir. Objetivo: `listar()` na inicialização, e de novo depois de um
  envio bem-sucedido. **Nada de polling** — a mesma régua das specs 010, 011 e 012.

# Fase 05: O interruptor em Meu Perfil [x]
Branch: `feat/014-perfil-emails`

> Depende da spec 013 estar no código. Ver a nota no topo.

- [x] Task 01: A seção. Arquivos: `src/app/pages/perfil/perfil.page.html`, `.scss`. Objetivo: seção
  **E-mails** entre "Acesso" e "Excluir conta", com o rótulo **"Receber e-mails da Liga Dev"**, o
  interruptor e uma frase dizendo o que chega.
- [x] Task 02 (TDD + implementação): Salvar sozinho. Objetivo: o interruptor salva no gesto, otimista,
  com reversão na falha (decisão 12). **Comentário obrigatório registrando a exceção à decisão 2 da spec
  013** — sem ele, isto vira "bug" no próximo code review, exatamente como o `set()` da spec 012 viraria
  sem o comentário dele.
- [x] Task 03: O estado inicial. Objetivo: o interruptor nasce do `emailOptOut` que vem do `GET /me`.
  Teste-trava: perfil com `emailOptOut: true` desenha o interruptor **desligado** — e não ligado, que é o
  que um booleano invertido lido às pressas produz.
- [x] Task 04: Quem foi descadastrado por bounce religa aqui, e a tela não explica por quê (decisão 12).
  Objetivo: nenhum texto especial, nenhum aviso. Está escrito como task para que a ausência seja
  deliberada, e não esquecimento.

# Fase 06: A página pública de descadastro [x]
Branch: `feat/014-descadastro`

- [x] Task 01: Rota pública. Arquivo: `src/app/app.routes.ts`. Objetivo: `/descadastro`, **sem guard
  nenhum e fora do `dashboard-shell`**, aceitando `?token=`. Ela precisa funcionar para quem nunca
  entrou naquele navegador (decisão 11).
- [x] Task 02 (TDD + implementação): A página. Arquivos: `src/app/pages/descadastro/descadastro.page.ts`,
  `.html`, `.scss`. Objetivo: chama `descadastrar(token)` na inicialização, mostra **"Você não vai mais
  receber nossos e-mails"**, e um link para a landing. **Sem botão de confirmação** — quem clicou no
  rodapé já confirmou.
- [x] Task 03: Sem token. Objetivo: sem `?token=`, a tela explica em uma frase que o link está incompleto
  e manda entrar em Meu Perfil. Sem toast e sem erro vermelho: quem chega aqui não fez nada errado.
- [x] Task 04 (TDD): Não depende de sessão. Objetivo: teste-trava de que a página renderiza e completa a
  chamada **sem `AuthStore` inicializado** (decisão 11 e spec 011). Esperar o refresh de sessão numa
  página pública é o defeito que só aparece para quem está deslogado — ou seja, para todo mundo que a usa.
- [x] Task 05: Título e `noindex`. Objetivo: título próprio e a página fora dos buscadores. É uma URL com
  token na query; ela não tem por que existir num índice de busca.

# Fase 07: Publicar vídeo avisa, e verificação [ ]
Branch: `feat/014-aviso-e-verificacao`

- [x] Task 01: O aviso na trilha. Arquivo:
  `src/app/pages/admin/trilha/insignia-admin.page.html`. Objetivo: uma linha acima do botão de publicar —
  *"Publicar envia um e-mail para a comunidade."* **Sem contagem, sem caixa de seleção, sem diálogo
  novo** (decisão 13). O comentário registra que isto **revoga** a linha da spec 012 que dizia que a tela
  do admin não mudaria, e por quê.
- [x] Task 02: Quem não recebe, na lista de usuários. Arquivos:
  `src/app/pages/admin/usuarios/usuarios.page.html`, `.spec.ts`. Objetivo: selo discreto na linha de quem
  tem `emailOptOut`. Sem isso, "não chegou para o fulano" é investigação sem pista.
- [ ] Task 03: Conferir no Chrome, nas duas larguras. Objetivo: celular e desktop, a tela de e-mails
  inteira e a de descadastro. O caso a olhar com atenção é o **botão de envio no celular**: ele não pode
  ficar fixo nem encostado na borda inferior (decisão 15).
- [ ] Task 04: Conferir o caminho inteiro com o backend ligado. Objetivo: escrever, filtrar, ver a
  contagem, mandar o teste, disparar para uma pessoa, abrir o e-mail, **clicar no descadastro do rodapé**,
  cair na página pública, e ver o interruptor desligado em Meu Perfil. É o único jeito de saber que as
  duas pontas do token são a mesma pessoa.

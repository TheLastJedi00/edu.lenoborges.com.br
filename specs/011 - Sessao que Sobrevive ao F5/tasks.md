# Fase 00: Confirmar a causa antes de escrever código [ ]
Branch: nenhuma. É investigação, e ela vem primeiro de propósito.

Escrever código antes desta fase é apostar. O diagnóstico da spec é firme sobre o mecanismo, mas as
variáveis de ambiente de produção não foram lidas — ninguém aqui tem acesso a elas.

- [ ] Task 01: Ler as variáveis do projeto da API na Vercel. Objetivo: anotar os valores reais de
  `AUTH_COOKIE_SAMESITE`, `AUTH_COOKIE_SECURE`, `FRONTEND_URL` e `NODE_ENV`. **Se `FRONTEND_URL` não
  contiver a origem exata do front** (com protocolo, sem barra no fim), o CORS já recusa o refresh e
  este é o primeiro conserto — ponto em aberto 3.
- [ ] Task 02: Reproduzir em produção com o DevTools aberto. Objetivo: logar, abrir a aba Network,
  apertar F5 e olhar o `POST /auth/refresh`. Confirmar as duas coisas que a spec afirma: **a requisição
  não leva o header `Cookie`**, e a resposta é **401**. Anotar também o que a aba Application mostra do
  cookie `eduleno_rt` — se ele foi gravado e com quais atributos.
- [ ] Task 03: Registrar o achado no fim deste arquivo. Objetivo: uma seção curta com o que a Task 02
  mostrou. Se o cookie **estiver** indo e a resposta ainda for 401, a camada 1 da spec está errada e a
  execução para aqui para reabrir o diagnóstico — não se segue para a Fase 01 por inércia.

# Fase 01: O cookie chega na API [ ]
Branch: `fix/011-cookie-first-party`

Esta é a fase que conserta o F5. As outras impedem que ele quebre de novo por outro motivo.

- [ ] Task 01: Publicar a API em `api.lenoborges.com.br`. Objetivo: registro DNS e o domínio adicionado
  ao projeto da API na Vercel, servindo o mesmo deploy (decisão 1). **Não remover o
  `api-lenoborges.vercel.app` ainda** — ele continua respondendo até o front novo estar no ar, ou o
  deploy do front vira janela de indisponibilidade.
- [ ] Task 02: Apontar o front para o subdomínio. Arquivo:
  `src/environments/environment.production.ts`. Objetivo: `apiUrl` vira `https://api.lenoborges.com.br`.
  O comentário registra **por que o subdomínio** — same-site, cookie first-party, Safari — e não só que
  a URL mudou. Sem esse comentário, a próxima pessoa que "simplificar" isso reabre o bug.
- [ ] Task 03: Conferir que `AUTH_COOKIE_SAMESITE` em produção é `lax`. Objetivo: com same-site, `lax` é
  o valor certo e `none` passa a ser **proibido** (decisão 1). Se estiver `none`, muda para `lax` —
  depois da Task 02, nunca antes.
- [ ] Task 04: Verificar em produção. Objetivo: logar, F5 no painel, **continuar dentro**. E o mesmo no
  **Safari do iPhone**, que é o passo que prova a decisão (decisão 8). Um F5 verde só no Chrome do
  desktop não encerra esta fase.

# Fase 02: Falha de rede deixa de deslogar [ ]
Branch: `fix/011-so-401-desloga`

- [ ] Task 01 (TDD + implementação): O `refresh` para de decidir o significado do erro. Arquivos:
  `src/app/core/auth/auth.service.ts`, `.spec.ts`. Objetivo: remover o `setAnonymous()` do `tap` de erro
  (decisão 2). Quem chamou é que classifica — o boot e o interceptor dão respostas diferentes ao mesmo
  500, e enterrar a decisão no service é o que fez ela ficar errada nos dois lugares de uma vez.
- [ ] Task 02 (TDD + implementação): O interceptor separa 401 do resto. Arquivos:
  `src/app/core/auth/auth.interceptor.ts`, `.spec.ts`. Objetivo: `clearSession()` e a ida para
  `/comunidade` **só em 401** do refresh. Qualquer outro erro devolve a falha para quem pediu com a
  sessão intacta. Testes: 401 desloga; **500 não desloga**; erro de rede não desloga.
- [ ] Task 03 (TDD + implementação): O boot classifica a falha. Arquivos:
  `src/app/core/auth/session-init.ts`, `.spec.ts`. Objetivo: 401 → `setAnonymous()`; qualquer outra
  falha → `status` fica em **`unknown`** e a marca de sessão **permanece** (decisões 2 e 5). Teste-trava:
  falha de rede no boot **não** apaga `eduleno.session`.
- [ ] Task 04 (TDD + implementação): Prazo no boot. Arquivo: `src/app/core/auth/session-init.ts` + spec.
  Objetivo: 5 segundos, e estourar solta o app em `unknown`, nunca em `anonymous` (decisão 4). A
  requisição segue em voo e preenche a sessão se chegar depois. O comentário registra o cold start da
  função serverless como a razão do prazo.

# Fase 03: `unknown` para de expulsar [ ]
Branch: `fix/011-guard-nao-expulsa`

Sem esta fase, a Fase 02 troca um logoff por outro: o membro fica em `unknown` e o guard o manda embora
do mesmo jeito.

- [ ] Task 01 (TDD + implementação): O guard deixa `unknown` passar. Arquivos:
  `src/app/core/auth/auth.guard.ts`, `.spec.ts`. Objetivo: redirecionar só em `anonymous` (decisão 3).
  Teste-trava: **`status` em `unknown` não redireciona e não abre o modal de login.**
- [ ] Task 02 (TDD + implementação): Uma segunda tentativa, e só uma. Objetivo: recuo curto, uma
  repetição, **sem laço** (decisão 3). O comentário registra por que tem teto: repetir sem limite
  transforma trinta segundos de instabilidade em dez minutos, com todo mundo que está com o app aberto
  empurrando junto.
- [ ] Task 03: A faixa de sessão não confirmada. Arquivos: casca do painel
  (`src/app/pages/dashboard/dashboard-shell.ts`) e estilo. Objetivo: *"Não foi possível confirmar sua
  sessão. Verifique sua conexão."* com **Tentar de novo**. Ninguém é deslogado por vê-la.
- [ ] Task 04 (TDD): Teste-trava do destino preservado. Arquivo: `src/app/core/auth/auth.guard.spec.ts`.
  Objetivo: F5 em `/dashboard/mural` sem sessão guarda `intendedUrl` e o login volta para lá (decisão 7).
  Isto **já funciona hoje** — o teste existe para as Tasks 01 e 02 não o quebrarem sem ninguém ver.

# Fase 04: O logoff explicável [ ]
Branch: `fix/011-sessao-expirada-avisa`

- [ ] Task 01: A frase da sessão expirada. Arquivos: `src/app/app.ts` e o diálogo de autenticação.
  Objetivo: quem tinha marca de sessão e levou 401 na abertura vê *"Sua sessão expirou. Entre de novo
  para continuar."* no modal (decisão 6). Quem nunca teve sessão **não** vê — para o visitante da
  landing a frase é uma mentira.
- [ ] Task 02 (TDD): Spec da distinção. Objetivo: com marca de sessão + 401 → frase; sem marca → modal
  normal, sem frase.

# Fase 05: Verificação [ ]
Branch: nenhuma.

Nenhum item desta fase roda em `localhost`, e é o ponto da decisão 8: **em desenvolvimento o F5 já
funciona hoje, inclusive com o bug em pé.** Verde local aqui não é evidência.

- [ ] Task 01: F5 no painel, em produção, continuando dentro. Em **Chrome desktop e Safari do iPhone**.
- [ ] Task 02: F5 com a rede desligada no meio. Objetivo: a faixa aparece e **o membro não é deslogado**.
  Religar a rede e "Tentar de novo" recupera a sessão.
- [ ] Task 03: Aba parada por mais de uma hora, depois uma ação que chame a API. Objetivo: o access token
  expirou, o interceptor renova, a ação passa. Sem logoff, sem modal.
- [ ] Task 04: Logout, depois F5. Objetivo: continua deslogado, e a marca de sessão sumiu — o logout é o
  outro caminho que apaga a marca (decisão 5).
- [ ] Task 05: `ng build` limpo e a suíte do Karma verde.
- [ ] Task 06: Aposentar `api-lenoborges.vercel.app`. Objetivo: só **depois** de a Task 01 passar. É o
  passo que fecha a janela em que os dois domínios respondiam.

---

## Resultado da execução

_A preencher ao fim, no formato das specs 009 e 010: o que ficou de fora e por quê, e o que a execução
decidiu que vale registrar._

# Fase 00: Marcar as specs superadas [x]

Feita junto com o levantamento, e não durante a execução: a regra do `clauderc.md` é que a spec antiga
receba o bloco de `Deprecated` apontando para a nova. **Nenhuma spec inteira cai** — o que muda são
decisões nomeadas dentro delas, e por isso os blocos foram para o parágrafo e não para o topo do arquivo.

- [x] Task 00a: `specs/009 - Financeiro, Administracao e Trilha/context.md`. Objetivo: a **decisão 4**
  marcada como parcialmente Deprecated — cai a metade do upgrade, ficam a rota, os três blocos, os
  degraus cumulativos e a formatação de preço; o **ponto em aberto criado pela execução** ("o upgrade
  abre o LinkedIn, não o WhatsApp") fechado, porque as duas metades dele se resolveram em direções
  opostas; e o **ponto em aberto 3** fechado como não-aplicável.
- [x] Task 00b: `specs/005 - Autenticacao e Dashboard/context.md`. Objetivo: o parágrafo que descreve
  `/definir-senha` marcado como Deprecated. **É a segunda vez que aquela página muda de dono**, e a
  primeira nunca foi registrada aqui: ela morreu na decisão 3 da 007 do backend em 2026-08-16, e este
  repositório seguiu descrevendo por doze dias uma rota que não existia — inclusive na tabela do
  `README.md`, que a Task 22 corrige.

# Fase 01: Os contatos reais [ ]
Branch: `feat/020-contatos-reais`

Independente das outras fases. Ao fim dela, todo link de contato do site leva a um lugar que existe.

- [ ] Task 01: O ícone e o tipo. Arquivos: `src/app/models/profile.model.ts`,
  `src/app/components/icons/icon-social.ts`. Objetivo: `'whatsapp'` em `IconName` e o `@case`
  correspondente no `IconSocial`, apontando para o `IconWhatsapp` que **já existe** em
  `components/icons/icon-whatsapp.ts` desde a spec 003 — nenhum SVG novo.
- [ ] Task 02: Os links. Arquivo: `src/app/services/profile.service.ts`. Objetivo: Instagram passa a
  `https://www.instagram.com/lenoborges.dev`; entra o WhatsApp com `url: 'https://wa.me/5547992478232'` e
  `handle: '+55 47 99247-8232'`; LinkedIn e Portfólio não mudam. **O comentário registra a decisão 1**: o
  `?igsi=` do link compartilhado não entra — é o identificador de sessão de quem copiou, e mandar todo
  visitante com ele é o rastreio que a cláusula 8 da Política diz que não fazemos. E registra que o
  número formatado e o do `href` são dois valores escritos à mão, nunca um derivado do outro.
- [ ] Task 03: A grade aceita quatro. Arquivo: `src/app/components/contact-links/contact-links.ts`.
  Objetivo: `repeat(auto-fit, minmax(13rem, 1fr))` no lugar de `repeat(3, 1fr)` (decisão 3). O celular
  não muda: a grade já era de uma coluna.
- [ ] Task 04: O CTA vai para o WhatsApp. Arquivo: `src/app/pages/landing/landing.page.ts`. Objetivo:
  `contactHref` procura `icon === 'whatsapp'`, com `?text=` curto e `encodeURIComponent`; o `?? links[0].url`
  continua. **O comentário antigo sai** — ele diz "único canal de contato real hoje (LinkedIn)" e deixa de
  ser verdade nesta task; o novo diz por que o `?text=` só é possível agora (decisão 2).
- [ ] Task 05 (TDD): Spec dos contatos. Arquivos: `contact-links.spec.ts`, `landing.page.spec.ts`.
  Objetivo: três travas — o `href` do WhatsApp é `https://wa.me/5547992478232` com o texto na query; **nenhum
  `href` de contato contém `igsi`** (é o teste que fica vermelho quando alguém colar de novo o link do
  app); e o CTA da hero aponta para o WhatsApp, com `target="_blank"` e `rel="noopener noreferrer"`.

# Fase 02: A troca de plano em breve [ ]
Branch: `feat/020-plano-em-breve`

- [ ] Task 06: O `input` do cartão. Arquivo: `src/app/components/tier-card/tier-card.ts`. Objetivo:
  `upgradeDisponivel = input(true)`; falso deixa o botão `disabled` com o rótulo **"Em breve"** no lugar de
  "Quero o \<tier\>". O cartão **continua burro**: não conhece a constante, não sabe de sessão e não sabe
  por que está desabilitado.
- [ ] Task 07: A constante e o aviso. Arquivos: `src/app/pages/financeiro/financeiro.page.ts`, `.html`,
  `.scss`. Objetivo: `const TROCA_DE_PLANO_DISPONIVEL = false` no topo do arquivo, com o comentário da
  decisão 4 e a frase "uma linha para religar"; o `[upgradeDisponivel]` em todo `app-tier-card`; o CTA do
  bloco "O que o \<tier\> abre para você" desabilitado do mesmo jeito; e a frase **"A troca de plano estará
  disponível em breve."** uma vez só, acima da lista — nunca uma por cartão (decisão 4: `disabled` não é
  anunciado, e repetir a frase quatro vezes é um leitor de tela lendo a mesma promessa quatro vezes).
- [ ] Task 08: O código que fica. Arquivo: `financeiro.page.ts`. Objetivo: `onUpgrade` e `contactHref`
  **permanecem**, com o comentário da decisão 5 dizendo que não há caminho até eles enquanto a constante
  for falsa, e por que apagá-los transformaria uma linha numa tarefa.
- [ ] Task 09 (TDD): Spec do Financeiro. Arquivo: `financeiro.page.spec.ts`. Objetivo: todo botão de
  upgrade da tela está `disabled`; a frase de "em breve" aparece **uma vez**; o teste existente que exercita
  `onUpgrade` continua verde chamando o método direto (decisão 5) — é ele que impede o código desligado de
  apodrecer.

# Fase 03: O serviço e a rota [ ]
Branch: `feat/020-acesso-camada-de-dados`

Nenhuma tela ainda. **Depende da 020 do backend** — sem os três endpoints, esta fase compila e não
funciona.

- [ ] Task 10: Os modelos. Arquivo: `src/app/models/auth.model.ts`. Objetivo: `OobMode` (união literal com
  os quatro modos da decisão 7), `OobCheck { email }` e `ConfirmPasswordRequest { oobCode, newPassword }`.
  O comentário registra que o `mode` chega da URL e **serve só para escolher a tela** — quem decide qual
  operação o Firebase executa é o próprio código, no servidor (decisão 10 da 020 do backend).
- [ ] Task 11 (TDD + implementação): O serviço. Arquivos: `src/app/services/access.service.ts`,
  `.spec.ts`. Objetivo: `checkOobCode(oobCode)` → `POST /auth/password/check`;
  `confirmPassword(oobCode, newPassword)` → `POST /auth/password`; `applyEmailAction(oobCode)` →
  `POST /auth/email-action`. **Sem `AuthStore`, sem `withCredentials`, sem token**: são três chamadas
  públicas, e a única credencial em jogo é o `oobCode` do corpo. Teste-trava: **o serviço não guarda o
  `oobCode` em campo nenhum** (decisão 9) — ele recebe, envia e esquece.
- [ ] Task 12: A rota. Arquivo: `src/app/app.routes.ts`. Objetivo: `/acesso`, `loadComponent`, sem guard,
  **fora do `dashboard-shell`**, título "Acesso · Liga Dev". **O comentário de 8 linhas que hoje diz "Não
  existe rota `definir-senha`, e a ausência é proposital" é substituído** pelo que explica a decisão 6:
  ela voltou, com outro nome, e o `oobCode` agora passa pela nossa API — nunca pelo SDK do Firebase.

# Fase 04: A tela [ ]
Branch: `feat/020-tela-de-acesso`

- [ ] Task 13: O esqueleto e o roteamento por modo. Arquivos: `src/app/pages/acesso/acesso.page.ts`,
  `.html`, `.scss`. Objetivo: lê `mode` e `oobCode` de `ActivatedRoute.snapshot.queryParamMap`, **chama
  `history.replaceState` na sequência** (decisão 9) e guarda o código num signal do componente — em nenhum
  outro lugar. `@switch` no modo, com o ramo `@default` sendo a tela de link inválido (decisão 7). Sem
  `dashboard-shell`, com `app-logo` e `pixel-panel` (decisão 14).
- [ ] Task 14: `noindex`. Arquivos: `acesso.page.ts` (ou onde o `/descadastro` já faz isso). Objetivo:
  a mesma marcação de "fora dos buscadores" que a spec 014 pôs no descadastro — **copiar o mecanismo que
  existe, não inventar um segundo**. A URL carrega credencial na query, e um rastreador que a visitasse
  queimaria o link de alguém.
- [ ] Task 15: A conferência antes do formulário. Arquivo: `acesso.page.ts`. Objetivo: em
  `mode=resetPassword`, `checkOobCode` na inicialização; **os campos de senha só existem depois do
  sucesso** (decisão 8), com o e-mail dono do link escrito acima deles: *"Criando a senha de
  fulano@exemplo.com"*. Enquanto confere, o estado é de carregamento — não é formulário desabilitado.
- [ ] Task 16: O formulário. Arquivos: `acesso.page.html`, `.ts`. Objetivo: dois campos
  `type="password"` com `autocomplete="new-password"`, mínimo de 8 e igualdade entre eles, na marcação
  `.field` do `auth-dialog`. **As regras ficam acima dos campos, não como erro depois do submit**
  (decisão 12), e o comentário registra que este mínimo é cortesia: quem garante é a política do projeto
  no console, e a API é que traduz a recusa dela.
- [ ] Task 17: O sucesso. Arquivo: `acesso.page.ts`. Objetivo: `204` leva a `/?entrar=1`. **Não loga
  ninguém** (decisão 11) — não há sessão a criar aqui, e o comentário diz por que a resposta não devolve
  token: sessão nasce no login, e um segundo caminho de emissão do cookie de refresh só seria exercitado
  no fluxo que menos gente percorre duas vezes.
- [ ] Task 18: O `continueUrl` conferido. Arquivo: `acesso.page.ts`. Objetivo: se o `continueUrl` da query
  for do mesmo `origin`, é o destino; senão, `/?entrar=1` (decisão 10). O comentário nomeia o que a
  ausência disso seria: **um redirecionamento aberto com a marca do produto em cima**, alcançado por um
  link legítimo do nosso e-mail.
- [ ] Task 19: Os três modos sem formulário. Arquivos: `acesso.page.html`, `.ts`. Objetivo:
  `verifyAndChangeEmail`, `verifyEmail` e `recoverEmail` chamam `applyEmailAction` na inicialização e
  mostram a confirmação, com o caminho de volta para `/?entrar=1`. **Dois deles o produto não dispara
  hoje** (decisão 7), e o comentário registra que o endereço de ação é do projeto inteiro — a alternativa
  a tratá-los é uma tela em branco para quem fez tudo certo.
- [ ] Task 20: O link morto. Arquivos: `acesso.page.html`, `.ts`. Objetivo: a tela da decisão 13, com o
  título "Esse link não vale mais", a explicação de que links valem uma vez só, e o botão **"Pedir um link
  novo"** para `/?entrar=1`. **Expirado e inválido caem na mesma tela** — distinguir informaria a quem
  colou um código qualquer se ele existiu algum dia.
- [ ] Task 21 (TDD): Spec da tela. Arquivo: `acesso.page.spec.ts`. Objetivo: seis travas — sem `oobCode`,
  desenha o link inválido e **não chama serviço nenhum**; `mode` desconhecido cai no mesmo lugar; o
  `oobCode` **some da URL** depois de lido; o formulário só aparece depois do `check` bem-sucedido; um
  `continueUrl` de outro domínio **é ignorado** (o teste-trava do redirecionamento aberto); e o sucesso
  navega para `/?entrar=1` **sem tocar no `AuthStore`**.

# Fase 05: Fechar [ ]
Branch: `feat/020-fechamento`

- [ ] Task 22: `README.md`. Objetivo: a tabela de rotas ganha `/acesso` **e perde a linha
  `/definir-senha`, que está lá hoje descrevendo uma rota que não existe desde a spec 007**; uma seção
  curta sobre a tela de senha, com as decisões 6, 8 e 11 em três frases; e a nota de que a troca de plano
  está desligada por constante, com o nome dela.
- [ ] Task 23: `npm run lint` e `npm test`. Suíte verde antes de fechar.
- [ ] Task 24: Conferir no navegador, e é aqui que esta spec falha se falhar.
  - Os quatro links de contato a 360 px e a 1440 px — a grade da decisão 3 é o que se está olhando.
  - O CTA da hero abrindo o WhatsApp **no celular de verdade**, com o texto preenchido: `wa.me` se
    comporta diferente de desktop, e é onde a maior parte das pessoas clica.
  - `/acesso` com um `oobCode` real, do e-mail de cadastro, ponta a ponta: definir senha, cair em
    `/?entrar=1`, entrar com a senha nova.
  - **O mesmo link clicado duas vezes**: a segunda tem de mostrar a tela da decisão 13, e não um erro
    genérico.
  - A barra de endereços depois de a tela carregar: **sem `oobCode`**.

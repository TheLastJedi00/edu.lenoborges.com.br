> ## Ajustes durante a execução
>
> Quatro coisas saíram diferentes do que o `tasks.md` escreveu, e nenhuma delas muda uma decisão.
>
> 1. **A Task 03 se dividiu em dois arquivos, e nenhum deles é `services/profile.service.ts`.** Aquele
>    arquivo não é o que o nome sugere: ele guarda o conteúdo estático do portfólio da landing. `getMember`
>    foi para um `services/member.service.ts` novo, e `setSocialLinksPublic` para o `AuthService`, junto de
>    `setEmailPreference` e das outras escritas em `/me` — que é onde o comentário daquele arquivo já dizia
>    que elas moram.
> 2. **O `output` do modal chama-se `closed`, e não `close`.** `close` colide com o método público
>    `close()` que a página usa para fechar o diálogo, e um nome que serve para as duas coisas é o próximo
>    engano de quem for ler.
> 3. **O `uid` do cartão chega em `open(uid)`, e não por `input`.** É a armadilha já registrada no
>    `LegalAcceptDialog`: em zoneless, um host que renderiza o diálogo dentro de um `@if` e chama `open()`
>    numa microtask chama antes de o Angular criar o componente, e o `?.` engole a chamada em silêncio. O
>    diálogo fica sempre renderizado, e não há ordem a acertar.
> 4. **Dois testes do interruptor de e-mails precisaram de seletor escopado**, e isso é achado desta spec.
>    Passaram a existir **dois** `.switch__input` na tela de Meu Perfil, e o das redes vem antes no DOM — o
>    seletor global pegava o switch errado e o teste passou a falar sobre privacidade sem que o nome dele
>    mudasse. Os dois agora são escopados por `[aria-labelledby="titulo-emails"]` e
>    `[aria-labelledby="titulo-redes"]`.


# Fase 01: Camada de dados [x]
Branch: `feat/019-camada-de-dados`

Nenhuma tela. Ao fim desta fase o front sabe marcar vídeo, sabe guardar o XP e sabe pedir um cartão de
membro — e nada aparece ainda.

- [x] Task 01: Os modelos. Arquivos: `src/app/models/track.model.ts`, `src/app/models/profile.model.ts`,
  `src/app/models/mural.model.ts`, `src/app/models/auth.model.ts`. Objetivo: `watched: boolean` em
  `BadgeVideo`; `PublicMember` com `id`, `name`, `bio`, `grade`, `xp`, `linkedin`, `instagram`;
  `authorUid: string | null` em `MuralQuestion`; `xp` e `socialLinksPublic` em `MemberProfile`. O
  comentário do `authorUid` registra a decisão 8: **`null` é a pergunta anonimizada**, e o front não
  conhece o valor sentinela do backend — quem comparar com uma string aqui abre um cartão `404` em cima da
  pergunta de quem pediu para ser esquecido.
- [x] Task 02 (TDD + implementação): Marcar o vídeo. Arquivos: `src/app/services/track.service.ts`,
  `.spec.ts`. Objetivo: `setWatched(videoId, watched)` chamando
  `PUT /me/watched-videos/{videoId}` e devolvendo `{ videoId, watched, xp }`. Teste-trava: **o `xp` vem do
  corpo da resposta e o serviço não o calcula** (decisão 1) — nenhuma multiplicação, nenhum `10`, em lugar
  nenhum deste repositório.
- [x] Task 03 (TDD + implementação): O cartão. Arquivos: `src/app/services/profile.service.ts`, `.spec.ts`.
  Objetivo: `getMember(uid)` chamando `GET /members/{uid}`, e `setSocialLinksPublic(valor)` chamando
  `PATCH /me/privacy`. **Sem cache no `getMember`** (decisão 9): o teste-trava é que duas chamadas seguidas
  produzem duas requisições, e o comentário diz por quê — XP sobe, bio muda, o interruptor liga, e um
  cache mostra o estado de dez minutos atrás sem nada que denuncie.
- [x] Task 04: O XP no `AuthStore`. Arquivo: `src/app/core/auth/auth.store.ts`. Objetivo: `xp` computado
  de `profile()?.xp ?? 0`, e `setXp(valor)` que atualiza o perfil em memória. **Uma fonte, e é a que já
  existia** (decisão 3) — um segundo signal de XP em qualquer componente é o que fica velho na navegação
  de volta, e o sintoma é o painel mostrando o XP de antes de três vídeos.
- [x] Task 05 (TDD): Spec do `setXp`. Arquivo: `auth.store.spec.ts`. Objetivo: `setXp` sobre um perfil
  carregado muda só o `xp`; `setXp` sem perfil carregado **não cria um perfil pela metade** — é o estado
  que faria `profileCompleted` virar falso e o guard de onboarding sequestrar quem só marcou um vídeo.

# Fase 02: O check e o XP [x]
Branch: `feat/019-check-e-xp`

- [x] Task 06: O selo. Arquivos: `src/app/components/xp-count/xp-count.ts`, `.spec.ts`. Objetivo: `input`
  de `xp`, desenho no mesmo estilo do `BadgeCount` e **nada mais** — componente burro, sem serviço, sem
  saber quanto vale um vídeo. `aria-label` por extenso, como o do `BadgeCount`: *"340 pontos de
  experiência"*, porque "340 XP" lido em voz alta não é uma frase.
- [x] Task 07: O selo no painel. Arquivos: `src/app/pages/dashboard/dashboard.page.html`, `.scss`.
  Objetivo: `<app-xp-count>` **empilhado sobre** o `<app-badge-count>`, na mesma coluna à direita
  (decisão 10). O comentário no template registra a hierarquia: XP menor em cima, insígnia maior embaixo —
  o XP mede o esforço da semana, o contador mede a conquista, e lado a lado eles viram dois números
  competindo.
- [x] Task 08: O check. Arquivo: `src/app/pages/trilha/insignia/insignia.page.html`. Objetivo:
  `input[type="checkbox"]` dentro de um `label`, **fora do `video__frame`** (decisão 4, e o comentário diz
  por quê: dentro, ele herdaria a caixa de proporção da spec 017 e mudaria de tamanho conforme o vídeo
  fosse retrato ou paisagem). Rótulo **"Já assisti"**, virando **"Assistido"** quando marcado. O hint da
  decisão 5 embaixo: *"Os 10 XP são seus para sempre — desmarcar só tira o check."*
- [x] Task 09: O clique. Arquivo: `src/app/pages/trilha/insignia/insignia.page.ts`. Objetivo:
  `alternarVisto(video)` — vira o `watched` na lista **na hora** (otimista), chama `setWatched`, e no
  sucesso escreve o `xp` da resposta no `AuthStore`. **Só o check é otimista; o XP nunca** (decisão 2). No
  erro, o check volta ao que era e uma linha discreta aparece — **sem modal**: falhar em marcar um vídeo
  não interrompe a leitura.
- [x] Task 10 (TDD): Spec do check. Arquivo: `insignia.page.spec.ts`. Objetivo: quatro travas — o check
  muda antes da resposta chegar; o `xp` do `AuthStore` **só** muda depois dela; o erro **reverte o check**
  e não mexe no XP; e **remarcar um vídeo cujo `xp` volta igual deixa o selo igual** — é o teste que
  documenta a decisão 1, e é o que fica vermelho no dia em que alguém somar 10 localmente "para a tela
  responder mais rápido".
- [x] Task 11: O check não pisca na troca de aba. Arquivo: `insignia.page.ts`. Objetivo: conferir que
  `selectTab` recarrega a lista e que o `watched` vem do servidor junto — **sem estado de check
  sobrevivendo entre abas** (decisão 11). Nada de `localStorage`, e o comentário registra a falha nas duas
  direções: navegador limpo faria quem já assistiu ver tudo desmarcado, e um estado gravado por engano
  esconderia para sempre um vídeo que a pessoa quis marcar.

# Fase 03: O cartão do membro [x]
Branch: `feat/019-cartao-do-membro`

- [x] Task 12: O modal. Arquivos: `src/app/components/member-card-dialog/member-card-dialog.ts`, `.spec.ts`.
  Objetivo: `input` de `uid`, `output` de `close`. Busca ao abrir, três estados (`loading`, `ready`,
  `error`), overlay e armadilha de foco copiados do `LegalAcceptDialog` (spec 018). **O que não se copia é
  o rodapé**: o cartão não tem ação, não grava nada e fecha por `Esc`, por clique fora e pelo botão.
  Desenha nome, insígnia (via `describeProgress`, como o `BadgeCount`), XP, bio, e as redes **quando elas
  vierem** — ausentes não reservam espaço e não viram "não informado".
- [x] Task 13: O `404` tem frase própria. Arquivo: `member-card-dialog.ts`. Objetivo: *"Esse membro não
  faz mais parte da comunidade."* (decisão 9). É o que acontece quando alguém exclui a conta com o Mural
  aberto na outra aba, e um erro genérico ali faria uma saída normal do produto parecer falha nossa.
- [x] Task 14: O nome clicável. Arquivo: `src/app/components/question-card/question-card.ts`. Objetivo:
  `output` de `authorClick`; o nome vira `button` **só quando `authorUid` não é nulo** (decisão 8) — sem
  uid, é texto e mais nada: sem cursor de link, sem foco por teclado, sem `role`. **O cartão continua burro
  e não abre o modal**: ele emite, e quem abre é a página do Mural. Um componente de cartão que injeta
  serviço para buscar membro é o que impede o Mural de ser testado sem HTTP.
- [x] Task 15: A página do Mural liga os dois. Arquivos: `src/app/pages/mural/mural.page.html`, `.ts`.
  Objetivo: guarda o `uid` aberto num signal, desenha o `MemberCardDialog` quando ele existe, limpa no
  `close`. Um modal por vez.
- [x] Task 16 (TDD): Spec do nome. Arquivo: `question-card.spec.ts`. Objetivo: dois teste-trava — pergunta
  com `authorUid` tem `button` e emite ao clicar; **pergunta com `authorUid: null` não tem botão, não tem
  elemento focável e não emite nada**. O segundo é a garantia de que ninguém abre o cartão de quem pediu
  para ser esquecido.
- [x] Task 17 (TDD): Spec do modal. Arquivo: `member-card-dialog.spec.ts`. Objetivo: membro sem redes não
  desenha os ícones; com redes, desenha os dois links; `404` mostra a frase da Task 13; `Esc` fecha. E o
  **teste de vazamento visto do front**: o modal desenha só os campos do `PublicMember` — se um dia o
  backend mandar telefone, esta tela não o mostra por acidente.

# Fase 04: O interruptor das redes [x]
Branch: `feat/019-privacidade`

- [x] Task 18: O interruptor. Arquivos: `src/app/pages/perfil/perfil.page.html`, `.ts`. Objetivo: dentro
  do bloco **"Suas redes"**, logo abaixo dos dois campos (decisão 6). Mesma marcação `.switch` do
  interruptor de e-mails, que já está a duzentas linhas dali. Rótulo: **"Mostrar minhas redes para os
  outros membros"**. Hint: *"A administração da Liga Dev continua vendo seus links, como vê seu e-mail e
  telefone."* — chamar isso de privado seria vender uma garantia que não existe.
- [x] Task 19: Ele grava no clique. Arquivo: `perfil.page.ts`. Objetivo: `alternarRedesPublicas()`
  chamando `setSocialLinksPublic`, **fora do formulário de redes** e sem esperar "Salvar redes"
  (decisão 6). São duas gravações diferentes no mesmo bloco, e o comentário registra que isso é escolha:
  um interruptor que precisa de submit é um interruptor que fica meio ligado.
- [x] Task 20 (TDD): Spec do interruptor. Arquivo: `perfil.page.spec.ts`. Objetivo: abre na posição que o
  perfil trouxe — **e o teste-trava é o perfil que chega com `socialLinksPublic: false`, que precisa
  aparecer desligado**; clicar chama o serviço uma vez; erro reverte a posição e mostra a linha de erro,
  como o de e-mails ao lado.

# Fase 05: Fechar [ ]
Branch: `feat/019-fechamento`

- [x] Task 21: `README.md` e `CLAUDE.md`. Objetivo: o `XpCount` e o `MemberCardDialog` na lista de
  componentes; a frase que resume a decisão 1 — **o front nunca calcula XP, e o número 10 não existe neste
  repositório**; e a nota de que o check é a única escrita otimista da tela da insígnia.
- [x] Task 22: `npm run lint` e `npm test`. Suíte verde antes de fechar.
- [ ] Task 23: Conferir as duas telas no navegador, nas duas larguras. Objetivo: o check embaixo de um
  vídeo **retrato** e de um **paisagem** — é o que a decisão 4 previne, e é onde ela falha se falhar; o
  selo de XP empilhado no painel a 360 px, sem quebrar a linha do nome; e o modal do cartão sobre o Mural
  rolado até o fim, para ver se a rolagem de fundo se comporta.

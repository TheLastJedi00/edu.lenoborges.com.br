# Fase 00: Fix herdado da spec 012 — o painel de notificações no desktop [ ]
Branch: `fix/012-painel-alinhamento`

Não é desta spec, e vem primeiro por isso: é bug de pé em produção, custa duas linhas de CSS e um input,
e não depende de nada do Meu Perfil. Diagnóstico completo em
`specs/012 - Notificacoes Internas/fix.md`.

No desktop o sino mora no `.aside__head`, encostado na borda **esquerda** da janela, e o painel continua
com o `right: 0` que foi escrito para a barra do celular — então ele cresce 22rem para a esquerda e sai
pela borda. Com o menu recolhido some quase inteiro.

- [ ] Task 01: O input de alinhamento. Arquivos:
  `src/app/components/notification-panel/notification-panel.ts`,
  `src/app/components/notification-center/notification-center.ts`. Objetivo:
  `align = input<'start' | 'end'>('end')` nos dois, com o centro repassando ao painel. **`'end'` é o
  padrão** — é o comportamento de hoje e é o certo para a barra do celular; um input obrigatório faria o
  host que já está certo declarar o que já fazia.
- [ ] Task 02: A regra. Arquivo: `notification-panel.ts`. Objetivo:
  `.panel--start { left: 0; right: auto; }`, aplicada por `[class.panel--start]`. **Fora das media
  queries de celular** — a folha abaixo de `48rem` usa `position: fixed` com `left` e `right` próprios, e
  nada nela muda.
- [ ] Task 03: O aside declara o lado. Arquivo:
  `src/app/components/dashboard-aside/dashboard-aside.ts`. Objetivo: `align="start"` na instância do
  `.aside__bell`. A da `.mobile-header` **não muda** e continua no padrão.
- [ ] Task 04 (TDD): Spec do alinhamento. Objetivo: teste-trava de que a instância do aside recebe
  `start` e a da barra do celular não. O teste da Fase 02 da spec 012 garante que **o sino** aparece com
  o menu recolhido; nunca garantiu que **o painel** cabia, e é por essa fresta que o bug passou.
- [ ] Task 05: Conferir no navegador, nos dois estados do menu. Objetivo: expandido e **recolhido** — o
  recolhido é o caso pior e é o único em que um `left: 0` mal aplicado ainda pareceria funcionar por
  sorte. Conferir também que o cartão pinta por cima do conteúdo principal.

# Fase 01: Camada de dados [ ]
Branch: `feat/013-perfil-camada-de-dados`

Nenhuma tela. Ao fim desta fase o front sabe chamar as quatro operações, e nada aparece ainda.

- [ ] Task 01: Os campos no modelo. Arquivo: `src/app/models/auth.model.ts`. Objetivo: `linkedin` e
  `instagram` como `string | null` em `MemberProfile`, e **opcionais** em `UpdateProfileRequest`. O
  comentário registra que ausência no request é "não mencionei" e string vazia é "quero apagar" — são
  coisas diferentes e o backend as trata diferente.
- [ ] Task 02 (TDD + implementação): Normalizar rede social. Arquivos:
  `src/app/core/social-url.ts`, `.spec.ts`. Objetivo: `toLinkedinUrl` e `toInstagramUrl` aceitando
  `@fulano`, `fulano` e a URL inteira, devolvendo sempre a URL completa (decisão 4). Vazio devolve `''`.
  Teste-trava: entrada que já é URL de **outro** domínio não é aceita nem "consertada" — ela é inválida,
  e transformar `evil.com/fulano` em `linkedin.com/in/evil.com/fulano` seria pior que recusar.
- [ ] Task 03 (TDD + implementação): `updateProfile` com as redes. Arquivos:
  `src/app/core/auth/auth.service.ts`, `.spec.ts`. Objetivo: os dois campos entram no corpo, já
  normalizados. **Sem os campos, o corpo é idêntico ao de hoje** — teste-trava, porque o onboarding chama
  o mesmo método e não pode passar a mandar `linkedin: ''` para todo mundo.
- [ ] Task 04 (TDD + implementação): `changeEmail`. Arquivos: `src/app/core/auth/auth.service.ts`,
  `.spec.ts`. Objetivo: `POST /me/email` com `{ newEmail, password }`. **Não mexe no `AuthStore`** —
  teste-trava: o `202` não altera o e-mail em memória, porque a troca ainda não aconteceu (decisão 6).
- [ ] Task 05 (TDD + implementação): `changePassword`. Arquivos: `src/app/core/auth/auth.service.ts`,
  `.spec.ts`. Objetivo: `POST /me/password`, e no `204` chamar `authStore.clearSession()`. Teste-trava:
  a sessão é limpa **no sucesso e só no sucesso** — um `401` de senha errada não pode deslogar quem
  errou a digitação.
- [ ] Task 06 (TDD + implementação): `deleteAccount`. Arquivos: `src/app/core/auth/auth.service.ts`,
  `.spec.ts`. Objetivo: `DELETE /me` com corpo `{ password }` — `HttpClient.delete` exige `body` dentro
  de `options`, e é o erro que faz a requisição sair sem senha e voltar `400` sem explicação. No `204`,
  `clearSession()`.

# Fase 02: A rota e a casca da tela [ ]
Branch: `feat/013-rota-perfil`

- [ ] Task 01: A rota. Arquivo: `src/app/app.routes.ts`. Objetivo: `/dashboard/perfil` com
  `authGuard` + `profileCompleteGuard`, título `Meu Perfil · Liga Dev`, `loadComponent`. Nas mesmas
  condições das irmãs — nenhum guard novo.
- [ ] Task 02: Destravar o cartão do painel. Arquivo: `src/app/pages/dashboard/dashboard.page.html`.
  Objetivo: o cartão inerte vira `<a routerLink="/dashboard/perfil">` com selo "Disponível". **O
  comentário "Em breve aqui é a verdade" sai**, e a descrição para de prometer "preferências de
  notificações e histórico" — nenhum dos dois existe (decisão 12 e Fora de escopo).
- [ ] Task 03: Destravar o item do aside. Arquivo:
  `src/app/components/dashboard-aside/dashboard-aside.ts`. Objetivo: o `<button disabled>` vira `<a>` com
  `routerLinkActive`, `aria-current` e `onNavClick`, igual aos outros. **Junto com a Task 02, nunca
  depois** — a regra escrita no `dashboard.page.html` é que menu e painel espelham um ao outro.
- [ ] Task 04: Casca da página. Arquivos:
  `src/app/pages/perfil/perfil.page.{ts,html,scss,spec.ts}`. Objetivo: cabeçalho com título, as quatro
  seções vazias, e `GET /me` no `ngOnInit` com fallback para o `AuthStore.profile()` já carregado — o
  mesmo padrão do `completar-perfil`, que é onde ele já está resolvido.
- [ ] Task 05: Estado de carregando. Objetivo: enquanto o `GET /me` não voltar, os campos não aparecem
  vazios e depois preenchidos. Formulário que pisca com valor errado é o que faz alguém salvar por cima
  do que ainda não tinha chegado.

# Fase 03: Seus dados [ ]
Branch: `feat/013-seus-dados`

- [ ] Task 01: O formulário. Objetivo: nome, telefone e bio, com **as mesmas validações do
  `completar-perfil`** — 2 a 120, 10 ou 11 dígitos, 10 a 500 com contador. Reusar os validadores, não
  recriá-los: duas cópias das mesmas regras divergem na primeira mudança de limite.
- [ ] Task 02: Salvar. Objetivo: botão desabilitado enquanto `form.pristine` ou `form.invalid` (decisão
  2), "Salvando…" durante a requisição, e o `AuthStore.setProfile()` atualizado na resposta — o nome no
  "Olá, {{ firstName() }}" do painel precisa mudar junto.
- [ ] Task 03: A linha sobre o nome. Objetivo: abaixo do campo de nome, discreta: as perguntas já
  publicadas no Mural continuam com o nome antigo (decisão 3). **Uma linha, sem ícone de aviso** — é
  informação, não alerta.
- [ ] Task 04 (TDD): Sair com alteração não salva. Arquivos: `perfil.page.ts`, `.spec.ts`. Objetivo:
  `confirm-dialog` ao navegar com o formulário sujo (decisão 2). Comparar contra o valor **normalizado**,
  não contra o texto cru — senão apagar um espaço no fim da bio dispara o diálogo.
- [ ] Task 05 (TDD): Spec da seção. Objetivo: pré-preenchimento vindo do `GET /me`, botão travado sem
  alteração, salvar atualizando o store, e erro de rede aparecendo **abaixo do formulário** sem navegar
  (decisão 11).

# Fase 04: Suas redes [ ]
Branch: `feat/013-redes`

- [ ] Task 01: Os dois campos. Objetivo: LinkedIn e Instagram, **opcionais**, num formulário com botão
  próprio (decisão 1). Ícones vindos de `icon-linkedin.ts` e `icon-instagram.ts`, que já existem — nenhum
  ícone novo.
- [ ] Task 02: Normalizar ao sair do campo. Objetivo: `@fulano` vira a URL completa no próprio input, no
  `blur` (decisão 4). A pessoa vê no que o texto dela virou antes de salvar, em vez de descobrir depois.
- [ ] Task 03: Apagar remove. Objetivo: campo esvaziado manda string vazia, e a API grava `null`. Depois
  de salvar, o campo volta vazio — e não com o valor antigo, que é o que acontece quando ninguém
  reaplica a resposta ao formulário.
- [ ] Task 04 (TDD): Spec da seção. Objetivo: os três formatos de entrada aceitos, domínio errado
  recusado com mensagem no campo, e **salvar as redes não mexe em nome, telefone e bio** — teste-trava,
  porque os dois formulários chamam o mesmo `PATCH`.

# Fase 05: Acesso — e-mail e senha [ ]
Branch: `feat/013-acesso`

- [ ] Task 01: Os dois blocos fechados. Objetivo: cada um mostra só o estado — o e-mail atual, e "Senha ·
  alterada por você" sem nenhum dado — e abre ao toque (decisão 5). Fechar cancela e limpa os campos,
  **inclusive os de senha**.
- [ ] Task 02: A explicação do campo de senha atual. Objetivo: "Confirmamos que é você antes de mudar o
  acesso." Um campo de senha sem explicação numa tela de perfil parece bug ou golpe, e é o momento em que
  alguém desiste da operação.
- [ ] Task 03: Trocar de e-mail. Objetivo: novo e-mail + senha atual, `POST /me/email`. No `202`, o bloco
  **fica aberto** com "Confirmação enviada para …" e o aviso de que a sessão termina quando a troca for
  confirmada (decisão 6 e ponto em aberto 3).
- [ ] Task 04 (TDD): O e-mail na tela não muda. Objetivo: teste-trava de que o `202` **não** altera o
  e-mail exibido nem o `AuthStore` (decisão 6). É o reflexo mais provável de quem for implementar, e a
  mentira só apareceria no próximo login, falhando.
- [ ] Task 05: Trocar de senha. Objetivo: senha atual + nova + confirmação da nova. A confirmação é do
  front e não vai para a API — é proteção contra digitar errado a senha que ninguém vai lembrar depois.
- [ ] Task 06: O aviso antes do botão. Objetivo: *"Ao trocar a senha, você sai de todos os aparelhos e
  precisa entrar de novo."*, fixo, acima do botão. **Sem `confirm-dialog`** (decisão 7) — diálogo em cima
  de aviso ensina a clicar em "Confirmar" sem ler.
- [ ] Task 07: O destino depois do `204`. Objetivo: `clearSession()`, navegar para `/?entrar=1` — o
  parâmetro da spec 007, que abre o diálogo de login — e mensagem de sucesso lá. Cair numa tela de login
  sem contexto é indistinguível de ter sido deslogado por erro.
- [ ] Task 08 (TDD): Spec da seção. Objetivo: `401` mostrando "Senha incorreta." **dentro do bloco**, sem
  navegar e sem deslogar; sucesso de senha limpando a sessão e navegando; sucesso de e-mail não mexendo
  em nada além da mensagem.

# Fase 06: Excluir conta [ ]
Branch: `feat/013-excluir-conta`

A fase irreversível do front. Cada task aqui existe para a pessoa saber o que está fazendo antes de
fazer.

- [ ] Task 01: A seção. Objetivo: no fim da tela, separada por respiro grande, com borda de atenção e
  **sem vermelho gritante** (decisão 8). O vermelho é do botão final, dentro do diálogo.
- [ ] Task 02: A lista do que some e do que fica. Objetivo: as duas colunas da decisão 8, literais, mais
  a linha explicando por que as perguntas ficam. **Isto é requisito de consentimento, não texto de
  apoio**: "sua conta será excluída" não informa nada sobre a pergunta que virou vídeo na trilha.
- [ ] Task 03: O diálogo. Arquivo: `src/app/pages/perfil/perfil.page.html` + `dialog-box` existente.
  Objetivo: resumo em uma frase, campo de senha, **Cancelar** e **Excluir minha conta**. Botão final
  desabilitado com o campo vazio.
- [ ] Task 04 (TDD): O foco inicial é o Cancelar. Objetivo: teste-trava. É a única tela do produto onde o
  botão perigoso não pode estar a um `Enter` de distância (decisão 9), e o padrão do `confirm-dialog` é
  focar o confirmar — então aqui é exceção declarada, não descuido.
- [ ] Task 05: Excluir. Objetivo: `DELETE /me`, e no `204` `clearSession()` + `router.navigate(['/'])`.
  **Sem toast de sucesso na landing** (decisão 10) — comemorar a saída de alguém é fora de hora.
- [ ] Task 06: Falhar mantém o diálogo aberto. Objetivo: `401` vira "Senha incorreta." dentro do diálogo;
  `403` — admin — mostra a mensagem do backend literal, porque nesse caso quem lê é quem consegue
  resolver. Fechar o diálogo no erro faria a pessoa recomeçar do zero.
- [ ] Task 07 (TDD): Spec da exclusão. Objetivo: botão travado sem senha, `401` sem deslogar e sem
  navegar, `204` limpando a sessão e indo para a landing, e o foco inicial no Cancelar.

# Fase 07: Mobile e acabamento [ ]
Branch: `feat/013-mobile`

- [ ] Task 01: A tela no celular. Objetivo: seções empilhadas, campos com largura cheia, alvos de toque
  de **44px de verdade** — a mesma régua da decisão 11 da spec 010 e da decisão 13 da spec 012.
- [ ] Task 02: `autocomplete` correto em cada campo. Objetivo: `name`, `tel`, `email`,
  `current-password` e `new-password`. Sem eles o gerenciador de senhas oferece a senha errada no campo
  errado, e o de "senha atual" é o que mais dói.
- [ ] Task 03: O diálogo de exclusão no celular. Objetivo: largura de folha, altura que não corta os
  botões com o teclado virtual aberto. É o pior caso possível — teclado aberto por causa do campo de
  senha, e dois botões que precisam continuar visíveis.
- [ ] Task 04: Verificação em aparelho real, **incluindo Safari do iPhone**. Objetivo: o teclado virtual e
  o `dialog` nativo são exatamente onde o Safari difere, e é onde os dois botões somem.

# Fase 08: Documentação e release [ ]
Branch: `feat/013-docs`

- [ ] Task 01: `README.md`. Objetivo: a tela em duas linhas, e uma frase sobre exclusão de conta — o que
  some, o que fica anônimo, e que é imediato.
- [ ] Task 02: Revogar os "Em breve" nas specs antigas. Objetivo: onde a spec 005 registrar que Meu
  Perfil não existe, corrigir apontando para esta. Enquanto a frase antiga estiver lá, ela contradiz o
  produto — mesmo movimento que a spec 012 fez com a linha do Mural.
- [ ] Task 03: `npm test` (Karma) verde e `ng build` limpo.
- [ ] Task 04: Verificação ponta a ponta com conta descartável. Objetivo: criar uma conta, completar o
  onboarding, editar tudo, escrever uma pergunta, votar em outra, trocar a senha, entrar de novo, e
  **excluir**. Depois: abrir o Mural com outra conta e conferir que a pergunta está lá como
  "Membro removido" e que o `voteCount` da pergunta votada caiu em um.
- [ ] Task 05: Verificação com leitor de tela. Objetivo: cada seção é um `<section>` com título
  alcançável, os erros são anunciados por `role="alert"`, e no diálogo de exclusão **o primeiro elemento
  focado é o Cancelar** — é o teste em que a decisão 9 se prova ou não.

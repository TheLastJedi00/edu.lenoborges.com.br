# Fase 01: Fundação do core de autenticação (TDD) []
Branch: `feat/005-core-auth`

Esta fase é toda serviço e nenhum pixel. É onde a regra 6 do clauderc morde: os specs vêm antes da
lógica. Nada de tela até a sessão funcionar contra o backend real.

- [x] Task 01: Criar os modelos do domínio. Arquivo: `src/app/models/auth.model.ts`. Objetivo:
  declarar `Credentials`, `SignupRequest`, `Session`, `MemberProfile` e as respostas HTTP, espelhando
  o contrato do backend sem inventar campo, como a spec 004 fez com `WaitlistReceipt`.
- [x] Task 02: Extrair a normalização compartilhada. Arquivos: `src/app/core/normalize.ts` e
  `src/app/core/normalize.spec.ts`. Objetivo: mover trim com colapso de espaços do nome, dígitos do
  telefone e lowercase do e-mail para um único lugar, com os casos migrados de
  `waitlist.service.spec.ts`.
- [x] Task 03: Passar o `WaitlistService` a usar o utilitário. Arquivos:
  `src/app/services/waitlist.service.ts`, `src/app/services/waitlist.service.spec.ts`. Objetivo:
  remover a normalização duplicada sem alterar comportamento; a suíte da spec 004 continua verde sem
  mexer em expectativa.
- [x] Task 04: Criar o `AuthStore`. Arquivo: `src/app/core/auth/auth.store.ts`. Objetivo: guardar
  `accessToken` num signal **em memória**, mais `user`, `profile` e `status` com os três valores
  `unknown | anonymous | authenticated`, além dos computed `isLoggedIn` e `profileCompleted`. O
  terceiro estado existe para o intervalo entre a abertura do app e a resposta do refresh silencioso;
  sem ele os guards leriam "anônimo" no primeiro instante e expulsariam quem tinha sessão.
- [x] Task 05: Garantir que nada de sessão toca o armazenamento do navegador. Arquivo:
  `src/app/core/auth/auth.store.ts`. Objetivo: nenhum `localStorage` nem `sessionStorage` para token,
  porque token que o JS de terceiro lê é token que um XSS exfiltra; o refresh mora em cookie
  `HttpOnly` do backend.
- [x] Task 06 (TDD): Escrever a spec do `AuthService` **antes** da lógica. Arquivo:
  `src/app/core/auth/auth.service.spec.ts`. Objetivo: cobrir os 8 casos do `context.md` com
  `HttpTestingController` — signup normalizado, confirmação divergente falhando sem rede, login
  guardando o token, 401 sem guardar token, `setPassword`, `refresh`, `logout` limpando o store
  **mesmo com a requisição falhando** e `updateProfile`.
- [x] Task 07: Implementar o `AuthService`. Arquivo: `src/app/core/auth/auth.service.ts`. Objetivo:
  os sete métodos contra `environment.apiUrl`, reaproveitando o padrão do `WaitlistService` de
  normalizar e validar antes de gastar requisição.
- [x] Task 08 (TDD): Escrever a spec do interceptor. Arquivo:
  `src/app/core/auth/auth.interceptor.spec.ts`. Objetivo: cobrir os 6 casos do `context.md`, com
  destaque para dois: **duas requisições em 401 simultâneo disparam um único refresh**, e **401 em
  `/auth/login` não dispara refresh**. O primeiro é o bug clássico desse desenho, já que o backend
  rotaciona o refresh a cada uso e o segundo disparo viria com token consumido.
- [x] Task 09: Implementar o `authInterceptor`. Arquivo: `src/app/core/auth/auth.interceptor.ts`.
  Objetivo: injetar `Authorization` nas chamadas para `apiUrl`, `withCredentials` só nas rotas de
  `/auth` (o cookie tem `Path=/auth`), e refazer a requisição após um refresh compartilhado por
  `shareReplay`.
- [] Task 10: Registrar interceptor e refresh silencioso. Arquivos: `src/app/app.config.ts` e
  `src/app/core/auth/session-init.ts`. Objetivo: `provideHttpClient(withInterceptors([...]))` e um
  `provideAppInitializer` que chama `POST /auth/refresh` antes do primeiro guard rodar. Sem esse
  passo, todo F5 dentro do dashboard jogaria o usuário para fora, que é o defeito clássico de token
  em memória. O 401 aqui é resposta esperada e **não** aparece na tela.

# Fase 02: Guards e rotas []
Branch: `feat/005-guards`

- [] Task 01 (TDD): Escrever a spec dos guards. Arquivos: `src/app/core/auth/auth.guard.spec.ts` e
  `src/app/core/auth/profile.guard.spec.ts`. Objetivo: cobrir os 4 casos do `context.md` — sessão
  ausente redirecionando e guardando a URL tentada, perfil incompleto indo para `/completar-perfil`,
  perfil completo liberado e perfil completo sendo devolvido ao dashboard pelo guard inverso.
- [] Task 02: Implementar o `authGuard`. Arquivo: `src/app/core/auth/auth.guard.ts`. Objetivo:
  `CanActivateFn` funcional que **lê estado e não dispara requisição**, guardando a URL tentada para
  o login levar o usuário até onde ele queria ir. Guard que faz `await` de rede pisca a tela errada
  antes de redirecionar.
- [] Task 03: Implementar `profileCompleteGuard` e `onboardingPendingGuard`. Arquivo:
  `src/app/core/auth/profile.guard.ts`. Objetivo: o primeiro barra perfil incompleto no dashboard, o
  segundo impede que quem já preencheu volte ao onboarding pela URL, o que transformaria a etapa
  "obrigatória" em tela permanente no histórico.
- [] Task 04: Declarar as rotas novas. Arquivo: `src/app/app.routes.ts`. Objetivo: `/definir-senha`
  pública, `/completar-perfil` com `authGuard` e `onboardingPendingGuard`, e `/dashboard` com
  `authGuard` e `profileCompleteGuard` carregando o shell com filho. Cada uma com `title` próprio,
  como as rotas existentes.
- [] Task 05: Manter `/completar-perfil` fora do shell do dashboard. Arquivo:
  `src/app/app.routes.ts`. Objetivo: a etapa obrigatória não pode exibir o aside com Home, Trilha e
  Jogos, porque seria oferecer saída de um caminho sem saída.

# Fase 03: Modal de login e cadastro []
Branch: `feat/005-auth-dialog`

- [] Task 01: Criar o `AuthDialog` como componente burro. Arquivo:
  `src/app/components/auth-dialog/auth-dialog.ts`. Objetivo: `<dialog>` nativo com `showModal()`,
  foco no primeiro campo, Esc fechando e `(close)` emitindo, copiando a acessibilidade do
  `WaitlistDialog` da spec 004 em vez de reinventá-la. Recebe `state` e emite `login`, `signup` e
  `closed`, sem conhecer o `AuthService` (regra 7 do clauderc).
- [] Task 02: Montar a aba de login. Arquivo: mesmo componente. Objetivo: e-mail e senha com mínimo
  de 8, mensagem de erro única acima do botão e, no 401, limpar o campo de senha e devolver o foco a
  ele.
- [] Task 03: Montar a aba de cadastro. Arquivo: mesmo componente. Objetivo: **dois campos, ambos
  e-mail**, sem campo de senha, com o botão escrito "Criar conta". A confirmação compara ignorando
  caixa e espaços nas pontas, do mesmo jeito que o backend normaliza antes de comparar, e **colar é
  permitido nos dois campos**: bloquear `paste` pune gerenciador de senha e teclado de celular sem
  evitar erro nenhum.
- [] Task 04: Montar o estado enviado. Arquivo: mesmo componente. Objetivo: depois do 202, mostrar
  "Enviei um link para {e-mail}. Abra o e-mail para criar a sua senha." com `aria-live="polite"`, sem
  fechar sozinho, e **idêntico** para e-mail já cadastrado, já que o front não tenta descobrir a
  diferença que o backend esconde de propósito.
- [] Task 05: Ligar a troca de abas. Arquivo: mesmo componente. Objetivo: trocar de aba limpa o erro
  e **preserva o e-mail digitado**, porque quem errou a senha e foi criar conta não quer redigitar.
- [] Task 06: Adicionar o "Esqueci minha senha". Arquivo: mesmo componente. Objetivo: link discreto
  na aba de login que emite `signup` com o e-mail digitado, reusando o endpoint idempotente do
  backend, com a mesma tela de retorno do cadastro.
- [] Task 07 (spec de comportamento): Testar o componente. Arquivo:
  `src/app/components/auth-dialog/auth-dialog.spec.ts`. Objetivo: troca de aba limpando erro e
  preservando e-mail, submit emitindo o output certo e o estado enviado mostrando o e-mail de
  destino.
- [] Task 08: Hospedar o modal no shell da aplicação. Arquivos: `src/app/app.ts`,
  `src/app/core/auth/auth.store.ts`. Objetivo: uma única instância acima do `<router-outlet>`, com o
  estado de abertura no store, porque ele é aberto de três lugares e duplicá-lo por página faria três
  estados divergentes.
- [] Task 09: Colocar o botão de entrar no menu. Arquivos:
  `src/app/components/menu-bar/menu-bar.ts`, `src/app/pages/landing/landing.page.html`,
  `src/app/pages/comunidade/comunidade.page.html`. Objetivo: input opcional `action` no `MenuBar`,
  para não chumbar autenticação dentro de um componente de navegação, exibindo **Entrar na Seita
  Dev** e, com sessão, **Ir para o painel**; o botão não some, muda de destino.
- [] Task 10: Colocar o botão no hero da comunidade. Arquivo:
  `src/app/pages/comunidade/comunidade.page.html`. Objetivo: **Entrar na Seita Dev** ao lado de
  "Quero acesso antecipado", reusando o `PixelButton`, sem remover o fluxo da lista de espera, que
  continua valendo nesta fase.

# Fase 04: Página de definição de senha []
Branch: `feat/005-definir-senha`

- [] Task 01: Criar a página. Arquivos:
  `src/app/pages/definir-senha/definir-senha.page.{ts,html,scss}`. Objetivo: página pública, fora do
  menu, com um cartão centrado e mobile first.
- [] Task 02: Ler o token da URL sem exibi-lo. Arquivo: `definir-senha.page.ts`. Objetivo: pegar
  `token_hash` da query, guardar em campo privado e **nunca** renderizá-lo em tela nem em `title`.
- [] Task 03: Tratar a ausência de token. Arquivo: `definir-senha.page.ts`. Objetivo: sem
  `token_hash`, mostrar direto o estado de link inválido, sem formulário, em vez de deixar o usuário
  preencher para falhar depois.
- [] Task 04: Montar o formulário. Arquivo: `definir-senha.page.html`. Objetivo: senha e confirmação
  com mínimo de 8, botão de revelar a senha e mensagem de erro acima do botão.
- [] Task 05: Ligar ao backend. Arquivo: `definir-senha.page.ts`. Objetivo: `POST /auth/password` e,
  no 204, mostrar "Senha criada. Agora é só entrar." com um botão que abre o modal já na aba de
  login; no 400, "Esse link não vale mais. Peça um novo." com atalho para o cadastro.
- [] Task 06: Cobrir o formato alternativo do link. Arquivo: `definir-senha.page.ts`. Objetivo: se o
  template do painel do Supabase ainda estiver no padrão, os dados chegam no fragmento (`#`) e não na
  query; ler dos dois lugares evita que uma configuração errada de ambiente quebre a página em
  silêncio.

# Fase 05: Onboarding obrigatório []
Branch: `feat/005-onboarding`

- [] Task 01: Criar a página. Arquivos:
  `src/app/pages/completar-perfil/completar-perfil.page.{ts,html,scss}`. Objetivo: cartão centrado,
  só logo e formulário, sem aside e sem menu de navegação.
- [] Task 02: Montar o formulário reativo. Arquivo: `completar-perfil.page.html`. Objetivo: nome de 2
  a 120, telefone com 10 ou 11 dígitos e bio de 10 a 500 com contador de caracteres visível, usando
  as **mesmas** regras do `WaitlistService` da spec 004 pelo utilitário da Fase 01.
- [] Task 03: Pré-preencher com o que veio do backend. Arquivo: `completar-perfil.page.ts`.
  Objetivo: `name` e `phone` vindos da lista de espera chegam preenchidos e editáveis, **sem selo e
  sem explicação**: é sugestão, não verdade.
- [] Task 04: Ligar o envio. Arquivo: `completar-perfil.page.ts`. Objetivo: `PATCH /me/profile`,
  sucesso marcando `profileCompleted` no store e navegando para `/dashboard`, erro mostrando a
  mensagem acima do botão e **mantendo tudo digitado**.
- [] Task 05: Oferecer a única saída. Arquivo: `completar-perfil.page.html`. Objetivo: botão **Sair**
  com o mesmo modal de confirmação do dashboard. Quem não quer preencher pode ir embora; não pode é
  entrar sem preencher.

# Fase 06: Shell do dashboard e aside expansível []
Branch: `feat/005-dashboard-shell`

- [] Task 01: Criar os ícones. Arquivos: `src/app/components/icons/icon-home.ts`, `icon-track.ts`,
  `icon-user.ts`, `icon-games.ts`, `icon-logout.ts`, `icon-menu.ts`. Objetivo: SVG componentizado
  como manda a regra 1 do clauderc, seguindo o padrão dos ícones existentes, sem emoji em lugar
  nenhum.
- [] Task 02: Criar o `ConfirmDialog` genérico. Arquivo:
  `src/app/components/confirm-dialog/confirm-dialog.ts`. Objetivo: componente burro e reutilizável
  com `title`, `message`, `confirmLabel` e `cancelLabel`, emitindo `confirmed` e `cancelled`, com
  foco inicial no botão de confirmar e Esc equivalendo a cancelar. Genérico de propósito: um modal
  específico de logout nasceria obsoleto na primeira exclusão de algo.
- [] Task 03 (spec de comportamento): Testar o `ConfirmDialog`. Arquivo:
  `confirm-dialog.spec.ts`. Objetivo: os dois outputs disparando nos botões certos e Esc cancelando.
- [] Task 04: Criar o `DashboardAside` como componente burro. Arquivo:
  `src/app/components/dashboard-aside/dashboard-aside.ts`. Objetivo: receber os itens e o estado
  expandido, emitir navegação e logout, sem conhecer serviço nem rota.
- [] Task 05: Desenhar a gaveta do celular primeiro. Arquivo: `dashboard-aside.ts` (bloco `styles`).
  Objetivo: mobile first, regra 2 do clauderc — gaveta sobre o conteúdo com fundo escurecido, aberta
  por um botão de menu no topo, fechando por Esc, por toque fora e ao navegar.
- [] Task 06: Acrescentar a coluna fixa do desktop. Arquivo: mesmo componente. Objetivo: a partir de
  `64rem`, coluna fixa que recolhida mostra só ícones com `title` e `aria-label`, e expandida mostra
  ícone e rótulo, animando `width`.
- [] Task 07: Tratar os itens inertes. Arquivo: mesmo componente. Objetivo: Trilha, Meu Perfil e
  Jogos como `<button disabled>` com `aria-disabled="true"` e selo "Em breve", pelo **mesmo** critério
  dos cartões do dashboard: um destino não pode estar bloqueado no cartão e clicável no menu.
- [] Task 08: Acessibilidade do menu. Arquivo: mesmo componente. Objetivo:
  `<nav aria-label="Menu do painel">`, botão de expandir com `aria-expanded` e item ativo com
  `routerLinkActive` e `aria-current="page"`.
- [] Task 09 (spec de comportamento): Testar o aside. Arquivo: `dashboard-aside.spec.ts`. Objetivo:
  expandir e recolher alternando `aria-expanded` e item inerte não emitindo navegação.
- [] Task 10: Criar o `DashboardShell`. Arquivos: `src/app/pages/dashboard/dashboard-shell.ts`.
  Objetivo: página inteligente com o layout, o aside, o `<router-outlet>` do filho e o modal de
  confirmação do logout.
- [] Task 11: Persistir a preferência do aside. Arquivo: `dashboard-shell.ts`. Objetivo: guardar
  expandido/recolhido em `localStorage` na chave `eduleno.aside.expanded`. É o **único** uso de
  armazenamento nesta spec: preferência de layout não é dado sensível e é irritante de reajustar a
  cada visita.
- [] Task 12: Ligar o logout. Arquivo: `dashboard-shell.ts`. Objetivo: confirmação, `POST
  /auth/logout`, limpeza do store e navegação para `/comunidade`, **deslogando mesmo se a chamada
  falhar**: deixar o usuário preso porque a rede caiu seria trocar segurança por teimosia.

# Fase 07: Página do dashboard []
Branch: `feat/005-dashboard-page`

- [] Task 01: Criar o `GradeBadge`. Arquivo: `src/app/components/grade-badge/grade-badge.ts`.
  Objetivo: componente burro que exibe "Grau N" com a leitura "N de 33 Graus", puxando o total de
  `CommunityService.grades().totalGrades`, que existe desde a spec 003, para o número não ser escrito
  duas vezes no projeto.
- [] Task 02: Criar a página. Arquivos:
  `src/app/pages/dashboard/dashboard.page.{ts,html,scss}`. Objetivo: cabeçalho com
  "Olá, {primeiro nome}" e o `GradeBadge`, lendo do `AuthStore` sem nova requisição, já que o login e
  o refresh já trouxeram `profileCompleted` e `grade`.
- [] Task 03: Montar os quatro cartões. Arquivo: `dashboard.page.html`. Objetivo: Acessar trilha,
  Grupo do WhatsApp, Meu Perfil e Jogos, reusando o `PixelPanel`, um por linha no celular e grade de
  dois a partir de `48rem`.
- [] Task 04: Tratar os três cartões inertes. Arquivo: `dashboard.page.html`. Objetivo:
  `<button disabled>` com `aria-disabled="true"` e selo "Em breve" no canto, sem página de "em
  construção": um botão que parece clicável e não faz nada é pior que um declaradamente
  indisponível.
- [] Task 05: Ligar o cartão do WhatsApp. Arquivos: `src/environments/environment.ts`,
  `src/environments/environment.production.ts`, `dashboard.page.html`. Objetivo: `whatsappGroupUrl`
  ao lado do `apiUrl` que já mora lá, abrindo em nova aba com `rel="noopener noreferrer"`. **Enquanto
  o usuário não fornecer o link, o valor fica vazio e o cartão se comporta como os inertes**, o que
  mantém a tela honesta em vez de publicar um link quebrado.
- [] Task 06: Aplicar as animações. Arquivo: `dashboard.page.scss`. Objetivo: `animate-enter` e
  `animate-leave` como manda a regra 6 do clauderc, gradientes suaves da regra 5, tudo em `.scss` e
  respeitando `prefers-reduced-motion` como o `DialogBox` já faz.
- [] Task 07: Conferir o sistema visual. Arquivos: `dashboard.page.scss`,
  `dashboard-aside.ts`. Objetivo: usar os tokens de `styles.scss` (`--ink`, `--paper`, `--accent-deep`,
  `--radius-lg`) em vez de inventar tema para a área logada, e nenhum travessão nos textos de tela
  (regra 4 do clauderc).

# Fase 08: Validação ponta a ponta e documentação []
Branch: `feat/005-validacao`

- [] Task 01: Rodar `ng test`. Objetivo: suíte verde, incluindo as specs da spec 004 que passaram a
  usar o utilitário de normalização.
- [] Task 02: Validar o fluxo completo no Chrome, com o backend no ar. Objetivo: regra 3 do clauderc
  — cadastrar, receber o e-mail, definir a senha, logar, preencher o onboarding e chegar ao
  dashboard, sem erro de CORS no console.
- [] Task 03: Testar o F5 dentro do dashboard. Objetivo: recarregar em `/dashboard` e continuar
  logado. É exatamente onde token em memória costuma falhar, e é o que a Task 10 da Fase 01 existe
  para resolver.
- [] Task 04: Testar a expiração e o refresh. Objetivo: com o access token vencido, uma ação
  autenticada deve renovar em silêncio e concluir, e duas ações simultâneas devem provocar **um**
  refresh, não dois.
- [] Task 05: Testar os guards pela URL. Objetivo: `/dashboard` sem sessão abre o modal de login;
  `/completar-perfil` com perfil já completo volta ao dashboard; depois do login, o usuário chega na
  URL que tentou antes.
- [] Task 06: Testar no tamanho de celular. Objetivo: gaveta abrindo e fechando por Esc, por toque
  fora e ao navegar, e nenhum estouro horizontal em 360px de largura.
- [] Task 07: Atualizar o `README.md`. Arquivo: `README.md`. Objetivo: documentar as rotas novas, a
  variável `whatsappGroupUrl` e a dependência do backend da spec 005 para o app subir com sessão.

# Fase 09: Release []
- [] Task 01: Abrir `release/005-autenticacao` unindo as branches `feat/005-*`.
- [] Task 02: Merge da release em `dev` e PR contra a `main` (se houver origin; se não, merge local).

## Checklist final
- [] Botão **Entrar na Seita Dev** no menu e no hero, virando **Ir para o painel** com sessão
- [] Cadastro com dois campos de e-mail, sem senha, e estado de espera após o 202
- [] Resposta do cadastro idêntica para e-mail novo e já cadastrado
- [] `/definir-senha` lendo o token da URL sem exibi-lo e tratando link inválido
- [] Onboarding obrigatório, com guard próprio e sem aside na tela
- [] Guard inverso impedindo voltar ao onboarding depois de concluído
- [] Dashboard recebendo pelo nome e exibindo o Grau vindo do backend
- [] Quatro cartões presentes, três inertes com selo "Em breve", WhatsApp abrindo em nova aba
- [] Aside expansível com os mesmos itens mais Home, e Sair no rodapé com confirmação
- [] Aside como gaveta no celular e coluna fixa no desktop
- [] Access token só em memória, nada de sessão em `localStorage`
- [] F5 dentro do dashboard mantém a sessão
- [] 401 simultâneo dispara um único refresh
- [] Logout desloga mesmo com a requisição falhando
- [] Nenhum `@supabase/supabase-js` nem chave do Supabase neste repositório
- [] Nenhum emoji, SVG componentizado, animações em `.scss` e mobile first
- [] `ng test` verde e fluxo validado no Chrome

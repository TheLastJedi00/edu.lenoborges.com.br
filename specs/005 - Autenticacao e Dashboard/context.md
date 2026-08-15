# Spec 005: Login, onboarding obrigatório e dashboard do membro

## Objetivo
Transformar a Seita Dev de página institucional em produto com área logada:

1. Botão **Entrar na Seita Dev** abre um modal com login e cadastro.
2. Cadastro pede o e-mail duas vezes e espera a confirmação vinda do backend.
3. Ao logar, o usuário vai para o dashboard.
4. No primeiro acesso ele é **obrigado** a preencher nome, telefone e bio antes de qualquer outra
   coisa, protegido por um guard próprio de perfil incompleto.
5. O dashboard recebe o membro pelo nome, mostra o Grau dele e oferece quatro destinos: Trilha,
   Grupo do WhatsApp, Meu Perfil e Jogos.
6. Um aside expansível repete esses mesmos destinos, mais Home, e traz Sair no rodapé com modal de
   confirmação.

**O front não fala com o Supabase.** Não há `@supabase/supabase-js` neste repositório, nem chave
`anon`, nem URL do projeto. Toda identidade passa pelo backend em `../eduleno-back`, spec
`005 - Autenticacao e Dashboard`, que é o contrato consumido aqui.

---

## Decisões tomadas com o usuário (2026-08-14)

### O cadastro não tem campo de senha
Confirmado: _"o cadastro exige confirmação por email, dispare o email do supabase de redefinição de
senha para o cadastrante, o login não exige 2FA, apenas email e senha"_.

O formulário de cadastro tem **dois campos, ambos e-mail**: o endereço e a confirmação. Nenhum campo
de senha. Depois do envio, o modal entra em estado de espera e diz para o usuário abrir o e-mail. O
link do e-mail cai numa página nova, `/definir-senha`, onde ele cria a senha. Só então ele loga.

Isso muda o vocabulário da tela: o botão do cadastro não diz "Criar conta e entrar", diz
**"Criar conta"**, e a tela de sucesso explica o próximo passo em vez de comemorar.

### Cadastro aberto, com aproveitamento da lista de espera
Confirmado: _"Aberto, mas vincula se já estiver na lista"_. O front não faz nada de especial: quem
cruza os dados é o backend. A consequência visível é que o onboarding pode chegar **já
pré-preenchido** com nome e telefone de quem entrou na lista de espera na spec 004. O formulário
trata isso como valor inicial editável, sem aviso e sem campo travado.

### Grau vem do backend e começa em 1
Confirmado: _"Coluna no perfil, todo mundo começa no Grau 1"_. O dashboard **só exibe**. Não existe
tela de progressão, não existe cálculo no front, e o número nunca é chumbado no código: vem de
`GET /me` e do login.

---

## Origem: o que já existe e vai ser reaproveitado

Esta spec é a primeira com área logada. Antes dela o site é público inteiro
([001](../001%20-%20MVC/context.md), [002](../002%20-%20Foco%20Educacional/context.md),
[003](../003%20-%20Comunidade/context.md), [004](../004%20-%20Acesso%20Antecipado/context.md)).

Reaproveitar, não recriar:

| já existe                                 | uso nesta spec                                                     |
|-------------------------------------------|---------------------------------------------------------------------|
| `components/waitlist-dialog`              | **padrão** de modal: `<dialog>` nativo, foco preso, Esc, `(close)`   |
| `components/pixel-button`                 | todos os botões, incluindo os do aside                               |
| `components/pixel-panel`                  | cartões do dashboard                                                 |
| `components/menu-bar`                     | topo das páginas públicas; ganha o botão de entrar                   |
| `components/icons/*`                      | convenção de SVG componentizado (regra 1 do clauderc)                |
| `directives/reveal`                       | entrada de blocos no scroll                                          |
| `services/waitlist.service.ts`            | modelo de service com HTTP + normalização + TDD                      |
| `environments/environment.ts` (`apiUrl`)  | mesma base de URL, sem hardcode novo                                 |
| `styles.scss` (tokens `--ink`, `--paper`) | o dashboard usa o mesmo sistema visual, não inventa tema             |

O `WaitlistDialog` **continua existindo e funcionando**. Lista de espera e cadastro são coisas
diferentes: uma é interesse antes da abertura, a outra é conta. As duas convivem nesta fase.

---

## Fluxos

### Entrar
```
[Entrar na Seita Dev]
   -> modal, aba Login
   -> POST /auth/login { email, password }
   -> 200: token em memória, cookie de refresh guardado pelo navegador
   -> profileCompleted === false ? /completar-perfil : /dashboard
   -> 401: mensagem única "E-mail ou senha inválidos.", o campo senha limpa e recebe foco
```

### Criar conta
```
[Criar conta]
   -> modal, aba Cadastro: e-mail + confirmação de e-mail
   -> POST /auth/signup { email, emailConfirmation }
   -> 202: modal vai para o estado "sent"
      "Enviei um link para fulano@email.com. Abra o e-mail para criar a sua senha."
   -> o modal NÃO fecha sozinho: quem fecha é o usuário
```
O backend responde 202 mesmo para e-mail já cadastrado, de propósito. **O front não tenta descobrir
a diferença** e não oferece nenhuma dica: a tela é idêntica nos dois casos.

### Definir a senha
```
e-mail -> /definir-senha?token_hash=...&type=recovery
   -> a página lê o token da query e NÃO o mostra em tela
   -> senha + confirmação de senha
   -> POST /auth/password { tokenHash, password, passwordConfirmation }
   -> 204: "Senha criada. Agora é só entrar." + botão que abre o modal já na aba Login
   -> 400: "Esse link não vale mais. Peça um novo." + atalho para reenviar pelo cadastro
```
A página é **pública** (o usuário ainda não tem sessão) e não fica no menu. Sem `token_hash` na URL,
ela mostra direto o estado de link inválido, sem formulário.

### Restaurar sessão no F5
O access token vive **em memória**, então recarregar a página o apaga. Na inicialização do app,
antes de o primeiro guard rodar, um `provideAppInitializer` chama `POST /auth/refresh` com
`withCredentials`. Deu certo, a sessão volta em silêncio. Deu 401, o usuário é anônimo e nenhum erro
aparece na tela: 401 aqui é resposta esperada, não falha.

Sem esse passo, todo F5 dentro do dashboard jogaria o usuário para fora, que é o defeito clássico de
token em memória.

### Sair
```
[Sair] no rodapé do aside
   -> modal de confirmação: "Sair da Seita Dev?" [Cancelar] [Sair]
   -> POST /auth/logout
   -> limpa o token em memória e o estado do usuário
   -> navega para /comunidade
```
Se a chamada falhar, **o front desloga do mesmo jeito**. O objetivo do usuário é sair; deixá-lo
preso porque a rede caiu seria trocar segurança por teimosia. O cookie expira sozinho.

---

## Rotas

```ts
{ path: '',                loadComponent: LandingPage }                       // pública, existe
{ path: 'comunidade',      loadComponent: ComunidadePage }                    // pública, existe
{ path: 'definir-senha',   loadComponent: DefinirSenhaPage }                  // pública, nova
{ path: 'completar-perfil',canActivate: [authGuard, onboardingPendingGuard],
                           loadComponent: CompletarPerfilPage }               // nova
{ path: 'dashboard',       canActivate: [authGuard, profileCompleteGuard],
                           loadComponent: DashboardShell, children: [
    { path: '', loadComponent: DashboardPage }
]}
{ path: '**', redirectTo: '' }
```

**`/completar-perfil` fica fora do `DashboardShell` de propósito.** Se a etapa é obrigatória, a tela
não pode exibir o aside com Home, Trilha e Jogos: seria oferecer saída de um caminho sem saída. A
página do onboarding tem só o logo, o formulário e o botão de sair.

### Os três guards

| guard                    | pergunta                        | falha leva para                          |
|--------------------------|----------------------------------|-------------------------------------------|
| `authGuard`              | tem sessão?                      | `/comunidade` com o modal de login aberto |
| `profileCompleteGuard`   | `profileCompleted === true`?     | `/completar-perfil`                       |
| `onboardingPendingGuard` | `profileCompleted === false`?    | `/dashboard`                              |

O terceiro é o inverso do segundo e existe para que quem já preencheu não consiga voltar ao
onboarding pela URL. Sem ele, a etapa "obrigatória" viraria uma tela permanente no histórico.

Todos são `CanActivateFn` funcionais, injetando `AuthStore` e `Router`, e **todos leem estado, nunca
disparam requisição**. Quem garante que o estado existe antes do primeiro guard rodar é o
`provideAppInitializer` do refresh silencioso. Guard que faz `await` de rede é guard que pisca a
tela errada antes de redirecionar.

`authGuard` guarda a URL tentada e, depois do login, o `AuthService` navega para ela em vez do
dashboard. Quem clicou num link direto volta para onde queria ir.

---

## Componentes e páginas novos

```
src/app/
  core/auth/
    auth.store.ts               # signals: accessToken (memória), user, profile, status
    auth.service.ts             # HTTP: signup, login, setPassword, refresh, logout, me, patch
    auth.service.spec.ts
    auth.interceptor.ts         # injeta Authorization, withCredentials, refila apos refresh
    auth.interceptor.spec.ts
    auth.guard.ts               # authGuard
    profile.guard.ts            # profileCompleteGuard, onboardingPendingGuard
    profile.guard.spec.ts
    session-init.ts             # provideAppInitializer com o refresh silencioso
  models/
    auth.model.ts               # Credentials, SignupRequest, Session, MemberProfile
  components/
    auth-dialog/auth-dialog.ts          # dumb: abas login/cadastro + estado enviado
    confirm-dialog/confirm-dialog.ts    # dumb, genérico: título, texto, dois botões
    dashboard-aside/dashboard-aside.ts  # dumb: itens, estado expandido, outputs
    grade-badge/grade-badge.ts          # dumb: exibe "Grau N" com a régua da comunidade
    icons/icon-home.ts
    icons/icon-track.ts
    icons/icon-user.ts
    icons/icon-games.ts
    icons/icon-logout.ts
    icons/icon-menu.ts
  pages/
    dashboard/dashboard-shell.ts        # smart: layout, aside, logout
    dashboard/dashboard.page.{ts,html,scss}
    completar-perfil/completar-perfil.page.{ts,html,scss}
    definir-senha/definir-senha.page.{ts,html,scss}
```

Regra 7 do clauderc respeitada: **dumb components, smart pages**. O `AuthDialog` não conhece
`AuthService`; ele recebe `state` e emite `login`, `signup` e `closed`. Quem chama a rede é a página
que o hospeda. O mesmo vale para o `ConfirmDialog` e para o `DashboardAside`.

O `AuthDialog` fica no `app.ts`, acima do `<router-outlet>`, com estado no `AuthStore`. Motivo: ele é
aberto de três lugares diferentes (menu, hero da comunidade, redirecionamento do `authGuard`) e
duplicá-lo por página faria três instâncias com três estados. Um só, no shell, resolve.

---

## O modal de login e cadastro

Estados: `idle | sending | sent | error`. Abas: `login | signup`. Trocar de aba **limpa o erro** mas
preserva o e-mail já digitado, porque quem errou a senha e foi criar conta não quer redigitar.

### Aba Login
| campo    | validação                                    |
|----------|-----------------------------------------------|
| e-mail   | obrigatório, formato de e-mail                 |
| senha    | obrigatória, mínimo 8                          |

Link discreto **"Esqueci minha senha"**, que reusa `POST /auth/signup` com o e-mail digitado. Não é
gambiarra: no backend desta spec, aquele endpoint é idempotente e dispara o mesmo e-mail de
redefinição para quem já tem conta. A mensagem de retorno é a mesma do cadastro.

### Aba Cadastro
| campo                 | validação                                              |
|-----------------------|---------------------------------------------------------|
| e-mail                | obrigatório, formato de e-mail                           |
| confirmação de e-mail | obrigatória, **igual** ao primeiro, comparação sem caixa |

A comparação ignora maiúsculas e espaços nas pontas, do mesmo jeito que o backend normaliza antes de
comparar. Recusar `Fulano@Email.com` contra `fulano@email.com` seria acusar erro onde não há.

**Colar é permitido nos dois campos.** Bloquear `paste` na confirmação é folclore de formulário: quem
usa gerenciador de senhas ou toca em teclado de celular é punido, e quem erra o e-mail erra igual
digitando duas vezes.

O modal repete o padrão do `WaitlistDialog`: `<dialog>` nativo, `showModal()`, foco no primeiro campo
ao abrir, Esc fecha, `(close)` emite para a página. Acessibilidade não é reinventada, é copiada de
algo que já funciona.

---

## Onboarding obrigatório

`/completar-perfil`. Formulário reativo, um cartão centrado, mobile first.

| campo    | validação                                              |
|----------|---------------------------------------------------------|
| nome     | obrigatório, 2 a 120, trim e colapso de espaços          |
| telefone | obrigatório, 10 ou 11 dígitos após remover não dígitos   |
| bio      | obrigatória, 10 a 500, contador de caracteres visível    |

As duas primeiras regras são **idênticas** às do `WaitlistService` da 004. A normalização sai de lá
para `core/normalize.ts`, compartilhada pelos dois services, com os testes existentes intactos.

Se o backend devolveu `name`/`phone` (vindos da lista de espera), os campos já chegam preenchidos e
editáveis, sem selo nem explicação.

Envia `PATCH /me/profile`. Sucesso navega para `/dashboard` e o `AuthStore` marca
`profileCompleted = true`. Erro mostra a mensagem acima do botão e **mantém tudo digitado**.

A tela tem exatamente uma saída além de concluir: o botão **Sair**, com o mesmo modal de
confirmação do dashboard. Quem não quer preencher pode ir embora; não pode é entrar sem preencher.

---

## Dashboard

### Boas-vindas e Grau
Cabeçalho com `Olá, {primeiro nome}` e o `GradeBadge` mostrando **Grau N**, com a leitura
`N de 33 Graus`. O 33 vem de `CommunityService.grades().totalGrades`, que já existe desde a spec 003:
o número não é escrito duas vezes no projeto.

### Os quatro destinos
Cartões grandes, tocáveis, um por linha no celular e grade de dois no desktop:

| destino             | ação nesta spec                                         |
|---------------------|----------------------------------------------------------|
| Acessar trilha      | inerte                                                   |
| Grupo do WhatsApp   | abre `whatsappGroupUrl` em nova aba                      |
| Meu Perfil          | inerte                                                   |
| Jogos               | inerte                                                   |

**Como os inertes se comportam:** confirmado que "por enquanto não levam a lugar nenhum". Eles são
`<button disabled>` com `aria-disabled="true"` e o selo `Em breve` visível no canto do cartão. Não
são links mortos e não abrem "página em construção". Um botão que parece clicável e não faz nada é
pior que um botão declaradamente indisponível, e o selo evita o chamado de suporte.

**WhatsApp:** o único ativo. A URL vira `whatsappGroupUrl` em `environment.ts` /
`environment.production.ts`, junto do `apiUrl` que já mora lá. Abre com
`target="_blank" rel="noopener noreferrer"`. **Pendência para o usuário: o link real do grupo.**
Enquanto não vier, o valor fica vazio e o cartão se comporta como os inertes, com o mesmo selo. Isso
mantém a tela honesta em vez de publicar um link quebrado.

### O aside expansível
Mesmos itens dos cartões, mais **Home**, que volta ao dashboard, e **Sair** fixo no rodapé.

- Estado guardado num signal do `DashboardShell` e persistido em `localStorage`
  (`eduleno.aside.expanded`). Preferência de layout não é dado sensível e é irritante de reajustar a
  cada visita.
- **Desktop (>= 64rem):** coluna fixa. Recolhida mostra só os ícones, com `title` e `aria-label`;
  expandida mostra ícone e rótulo. A transição anima `width`.
- **Celular:** o aside não ocupa coluna. Vira gaveta sobre o conteúdo, aberta por um botão de menu no
  topo, com fundo escurecido, fechando por Esc, por toque fora e ao navegar. Mobile first, regra 2 do
  clauderc: a gaveta é o desenho base e a coluna fixa é o acréscimo do desktop.
- Item ativo marcado com `routerLinkActive` e `aria-current="page"`.
- Os itens inertes usam o **mesmo** critério dos cartões: desabilitados, com selo. Um destino não
  pode estar bloqueado no cartão e clicável no menu.
- `<nav aria-label="Menu do painel">` e o botão de expandir com `aria-expanded`.

Animações em `.scss` com `animate-enter` / `animate-leave`, regras 5 e 6 do clauderc, e todas
respeitando `prefers-reduced-motion` como o `DialogBox` já faz.

### Modal de confirmação do logout
`ConfirmDialog` genérico e reutilizável, não um modal de logout específico. Recebe `title`,
`message`, `confirmLabel`, `cancelLabel` e emite `confirmed` / `cancelled`. O botão de confirmar
recebe o foco inicial e a variante de destaque; Esc equivale a cancelar.

---

## Sessão no front

### Token em memória
`AuthStore` guarda `accessToken` num `signal<string | null>`, dentro de um serviço `providedIn:
'root'`. **Nunca** em `localStorage` nem `sessionStorage`: token que o JS de terceiro consegue ler é
token que um XSS exfiltra. O refresh mora em cookie `HttpOnly`, que a página não enxerga.

O único dado de sessão que toca `localStorage` é a preferência de aside expandido.

### Interceptor
`authInterceptor`, funcional, registrado em `provideHttpClient(withInterceptors([authInterceptor]))`:

1. Requisição para `environment.apiUrl` e existe token: adiciona `Authorization: Bearer`.
2. Requisição para `/auth/refresh` ou `/auth/logout`: adiciona `withCredentials: true` (o cookie tem
   `Path=/auth`, então só essas precisam).
3. Resposta **401** numa rota que não seja de auth: chama `POST /auth/refresh` **uma vez**, e refaz a
   requisição original com o token novo.
4. O refresh falhou: limpa o estado, navega para `/comunidade` e propaga o erro.

Requisições paralelas que batem 401 juntas **compartilham um único refresh** (um `shareReplay` sobre
o observable em andamento). Sem isso, três chamadas simultâneas disparariam três refreshes, e como o
backend rotaciona o refresh token a cada uso, duas delas receberiam 401 por token já consumido. Esse
é o bug clássico desse desenho e o teste dele é obrigatório.

O interceptor **nunca** tenta refresh em resposta 401 de `/auth/login`: ali o 401 é credencial
errada, e insistir seria transformar erro de senha em loop.

### O que fica em `AuthStore`
```ts
accessToken: signal<string | null>
user:        signal<{ id: string; email: string } | null>
profile:     signal<MemberProfile | null>
status:      signal<'unknown' | 'anonymous' | 'authenticated'>
isLoggedIn:  computed(() => status() === 'authenticated')
profileCompleted: computed(() => profile()?.profileCompleted ?? false)
```
`status: 'unknown'` existe para o intervalo entre a abertura do app e a resposta do refresh
silencioso. Sem esse terceiro estado, os guards leriam "anônimo" no primeiro instante e chutariam
para fora quem tinha sessão válida.

---

## Onde o botão "Entrar na Seita Dev" aparece
1. `MenuBar` das páginas públicas, à direita, como ação e não como item de lista. O componente ganha
   um input opcional `action` para não hardcodar autenticação dentro de um componente de navegação.
2. Hero da `ComunidadePage`, ao lado de "Quero acesso antecipado".
3. Disparado pelo `authGuard` quando alguém tenta uma URL protegida sem sessão.

Quando já existe sessão, o mesmo lugar mostra **Ir para o painel**, que navega ao dashboard. O botão
não some, muda de destino: quem está logado e volta ao site institucional precisa de um caminho de
volta óbvio.

---

## Testes (TDD, regra 6 do clauderc)
Regra do front: TDD **em service**. Os specs abaixo vêm antes da lógica correspondente.

### `core/auth/auth.service.spec.ts` (`HttpTestingController`)
1. `signup` posta `{ email, emailConfirmation }` normalizados em minúsculas e sem espaços.
2. `signup` com confirmação divergente falha **sem** chamar a rede.
3. `login` posta credenciais, guarda o token no store e devolve a sessão.
4. `login` 401 propaga a mensagem única e **não** guarda token.
5. `setPassword` posta `tokenHash` e senha; senhas divergentes falham sem rede.
6. `refresh` atualiza o token no store.
7. `logout` limpa o store **mesmo quando a requisição falha**.
8. `updateProfile` posta os campos normalizados e atualiza `profile` no store.

### `core/auth/auth.interceptor.spec.ts`
1. injeta `Authorization` quando há token.
2. não injeta em requisição para fora de `apiUrl`.
3. 401 numa rota protegida dispara refresh e **refaz** a requisição original.
4. duas requisições em 401 simultâneo disparam **um único** refresh.
5. refresh falhando limpa o store e não repete a tentativa.
6. 401 em `/auth/login` **não** dispara refresh.

### `core/auth/profile.guard.spec.ts`
1. `profileCompleteGuard` libera perfil completo.
2. `profileCompleteGuard` redireciona perfil incompleto para `/completar-perfil`.
3. `onboardingPendingGuard` redireciona perfil completo para `/dashboard`.
4. `authGuard` sem sessão redireciona e guarda a URL tentada.

### `core/normalize.spec.ts`
Casos migrados do `waitlist.service.spec.ts`, provando que extrair o utilitário não mudou nada.

### Componentes (specs de comportamento, não de pixel)
- `AuthDialog`: troca de aba limpa erro e preserva e-mail; submit emite o output; estado `sent`
  mostra o e-mail de destino.
- `DashboardAside`: expandir e recolher alterna `aria-expanded`; item inerte não emite navegação.
- `ConfirmDialog`: `confirmed` e `cancelled` disparam nos botões certos; Esc cancela.

Regra 3 do clauderc: **testar no Chrome sempre**. A validação manual roda com o backend da spec 005
no ar, incluindo o teste de F5 dentro do dashboard, que é onde token em memória costuma falhar.

---

## Fora de escopo
- Trilha, Meu Perfil e Jogos: os botões existem e ficam inertes, confirmado com o usuário.
- Progressão de Grau, ranking e pontuação. O Grau é lido, nunca alterado.
- Login social e 2FA. Confirmado: e-mail e senha.
- Alterar e-mail da conta, excluir conta e upload de avatar.
- Tela de "editar perfil" separada. `PATCH /me/profile` já existe, mas nesta spec só o onboarding o
  usa; a tela de edição chega com o botão Meu Perfil.
- Página de política de privacidade completa e qualquer mudança no `WaitlistDialog` da 004.
- SSR e pré-renderização das rotas do dashboard.
- Persistir o access token em disco, em qualquer forma.

---

## Pendências para o usuário
1. **URL do grupo do WhatsApp.** Sem ela o cartão nasce inerte com selo "Em breve".
2. **Ajuste no painel do Supabase**, feito pelo lado do backend, mas que muda a URL que chega aqui: o
   template de e-mail precisa apontar para `{{ .SiteURL }}/definir-senha?token_hash={{ .TokenHash }}&type=recovery`.
   Se ficar no formato padrão, `/definir-senha` recebe os dados no fragmento (`#`) e não na query, e
   a página precisa ler dos dois lugares. Detalhado no `context.md` do backend.

   > **DEPRECATED em 2026-08-15** pela spec 006 do backend, `006 - Configuracao de Auth como Codigo`.
   >
   > Duas correções. O formato certo é `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`:
   > `{{ .SiteURL }}` renderiza a configuração de Site URL do projeto, que é campo único e não
   > consegue atender dev e produção ao mesmo tempo. E não é mais ajuste de painel, o template
   > passou a viver em `supabase/templates/recovery.html` no repositório do backend.
   >
   > Para esta página nada muda: o destino continua sendo `/definir-senha` com `token_hash` na query,
   > e `definir-senha.page.ts` segue lendo query e fragmento, o que continua sendo a decisão certa.

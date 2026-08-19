# Spec 011: Sessão que Sobrevive ao F5

## Objetivo
Hoje, em produção, **apertar F5 dentro do painel desloga o membro**. Ele volta para a landing com o
modal de login aberto, sem explicação, e precisa digitar a senha de novo. Em desenvolvimento nada
disso acontece, e é por isso que o problema chegou até aqui.

Esta spec resolve isso e, junto, resolve a razão de o F5 ser tão fácil de quebrar: **o app trata
qualquer falha de rede na abertura como "você não tem sessão"**. Cair a internet por um segundo,
a API demorar para acordar, o CORS recusar — tudo isso hoje produz o mesmo resultado que uma sessão
genuinamente expirada, que é o logoff silencioso.

O par desta spec no backend é a **011**, e as duas precisam entrar juntas: o front sozinho não
conserta o cookie, e o backend sozinho não conserta o logoff por rede instável.

---

## Numeração
Os números são iguais nos dois repositórios: 009 é Financeiro, Administração e Trilha, 010 é o Mural,
011 é esta. O número 011 já foi usado por uma spec de Links Gerenciados que **foi removida antes de
qualquer execução** (`docs(011): remove a spec de Links Gerenciados`) — ele está livre, e nada do que
estava escrito lá vale.

---

## O que já está certo, e precisa continuar
A arquitetura de sessão do produto **não é o problema**, e é importante dizer isso antes de mexer nela,
porque a tentação ao caçar um logoff é reescrever tudo:

- O access token vive **só em memória**, num signal. Nunca em `localStorage`. Isso está certo e não muda.
- O refresh token vive num **cookie HttpOnly**, invisível para o JS. Isso está certo e não muda.
- Existe um `provideAppInitializer` que tenta restaurar a sessão **antes de qualquer guard rodar**
  (`session-init.ts`). O desenho está certo: sem ele, o guard rodaria com o store vazio e o F5 dentro do
  painel jogaria o membro para fora por construção.
- Existe uma marca booleana em `localStorage` (`eduleno.session`) que responde "vale a pena tentar o
  refresh na abertura?". Ela existe porque o cookie é invisível para o JS, e sem ela todo visitante
  anônimo da landing pagaria uma requisição condenada. Isso está certo e não muda.

**O F5 falha apesar desse desenho, não por causa dele.** Quem for executar esta spec deve resistir a
"consertar" o `session-init`: ele faz a pergunta certa, e o que quebra é a resposta.

---

## O problema, em duas camadas

### Camada 1: o cookie nunca chega na API (a causa em produção)
`environment.production.ts` aponta para `https://api-lenoborges.vercel.app`, e o front é servido do
domínio do produto. São **sites diferentes** — não só origens diferentes, sites diferentes, e a
distinção é a que decide tudo aqui.

O cookie é gravado com `SameSite=Lax`, que é o padrão do `CookieService` quando a variável de ambiente
não diz outra coisa. **`Lax` não envia o cookie em requisição cross-site nenhuma feita por XHR.** Ele
abre exceção só para navegação de topo com método seguro, e `POST /auth/refresh` não é isso.

O resultado é exatamente o sintoma relatado:

| momento | o que acontece | o que a pessoa vê |
|---|---|---|
| Login | 200, sessão em memória, `Set-Cookie` na resposta | Entra normalmente. **Tudo funciona** |
| Navegação no painel | Access token em memória, no header | Tudo funciona |
| **F5** | `POST /auth/refresh` **sem o cookie** → 401 | **Deslogado, sem explicação** |

Login funcionar e F5 não é a assinatura desse defeito, e é o que faz ele passar por code review: nada
no código está errado isoladamente.

**Em desenvolvimento isso não reproduz.** `localhost:4200` e `localhost:3000` são o mesmo site — porta
não separa site —, então `Lax` envia o cookie e o F5 funciona perfeitamente. Um bug que só existe onde
não se desenvolve é um bug que só o usuário encontra.

### Camada 2: qualquer falha vira logoff (a causa que sobra depois)
Em `auth.service.ts`, o `refresh()` chama `setAnonymous()` no ramo de erro. **Em qualquer erro.**

O `restoreSession` faz o mesmo: `catch { authStore.setAnonymous(); }`. E o interceptor, quando o refresh
falha, faz `clearSession()` e manda para `/comunidade` — também para qualquer erro.

Isso significa que hoje **derrubam a sessão do membro**: um 500 momentâneo da API, o cold start da
função serverless estourando o tempo, o celular trocando de Wi-Fi para 4G no instante do F5, e o CORS
recusando por configuração. Nenhuma dessas coisas é "sua sessão acabou", e as quatro produzem o mesmo
efeito que ela.

**Só 401 significa "não há sessão".** Todo o resto significa "não deu para saber agora", e não saber
não é motivo para deslogar ninguém.

---

## Decisões

### 1. A API vai para um subdomínio do domínio do produto, e é isso que conserta o F5
`api-lenoborges.vercel.app` sai; entra **`api.lenoborges.com.br`**, apontando para o mesmo deploy da
Vercel. O front continua em `edu.lenoborges.com.br`.

Com isso os dois passam a compartilhar o domínio registrável `lenoborges.com.br` e viram **same-site**.
O cookie deixa de ser de terceiro, `SameSite=Lax` volta a funcionar, e o F5 passa a mandar o cookie.

Continua sendo cross-**origin**, então CORS e `withCredentials` seguem exatamente como estão. **Nada no
código do front muda por causa desta decisão além da URL** — e é esse o argumento: a correção mais
robusta é a que não pede código novo.

> **Por que não simplesmente `SameSite=None`.** É a correção de uma linha, e é a errada.
> `None` transforma o cookie num cookie de terceiro assumido, e cookie de terceiro é a coisa que os
> navegadores estão desligando: o Safari **já bloqueia**, por padrão, sem opção de contornar pelo
> servidor. O Safari é o iPhone. Este produto é mobile-first e a decisão 11 da spec 010 diz que o Mural
> é a tela mais tocada — no aparelho onde a correção `None` não funciona. O Firefox isola por site, e o
> Chrome está no meio da própria remoção.
>
> Ou seja: `None` conserta o F5 no Chrome do desktop de quem for testar, e mantém quebrado no aparelho
> da maior parte dos membros. **É pior que não consertar**, porque parece consertado.

**`AUTH_COOKIE_SAMESITE=none` é proibido em produção depois desta spec.** Se aparecer, o F5 voltou a
depender de cookie de terceiro e a decisão foi revertida sem querer.

### 2. Só 401 desloga. Todo o resto é "não sei", e "não sei" mantém a sessão
O `AuthStatus` já tem `unknown`, e hoje ele é usado só antes do boot. Passa a ter significado no fim
dele.

| o que a API respondeu | o que o app conclui | o que acontece com o membro |
|---|---|---|
| 200 | Sessão válida | Segue para onde ia |
| **401** | **Não há sessão** | Vira anônimo, marca limpa, vai para a landing |
| 500, 502, 504, timeout, erro de rede, CORS | **Não deu para saber** | **Continua onde estava**, e a tela avisa |

O `refresh()` do `AuthService` **para de chamar `setAnonymous()` no `tap` de erro**. Quem decide o que
um erro significa é quem chamou — o boot e o interceptor têm respostas diferentes para o mesmo 500 — e
enterrar essa decisão dentro do service é o que fez ela ficar errada nos dois lugares de uma vez.

O interceptor muda junto: `clearSession()` e o redirecionamento para `/comunidade` passam a acontecer
**só quando o refresh responde 401**. Um 500 no refresh devolve o erro para quem pediu, e a sessão
continua de pé.

> Isto é o que separa "a internet oscilou" de "sua sessão acabou". Hoje as duas frases têm a mesma
> consequência, e é por isso que o logoff parece aleatório para quem usa.

### 3. Se o boot não conseguiu decidir, o painel não expulsa — ele espera e depois explica
Com a decisão 2 existe um estado novo e real: **o membro tem marca de sessão, o boot falhou por rede, e
o app não sabe se ele está logado.** Alguém precisa decidir o que a rota `/dashboard` faz nesse caso.

O `authGuard` hoje pergunta `isLoggedIn()`, que é `status() === 'authenticated'`. Em `unknown` isso é
falso, e o membro seria expulso — o bug de novo, por outro caminho.

Então:

- **`status() === 'unknown'` não é motivo para redirecionar.** O guard deixa passar e a tela do painel
  mostra o seu estado de carregamento.
- O app tenta o refresh **mais uma vez**, uma só, com recuo curto.
- Se essa segunda tentativa também não decidir, o painel mostra uma faixa: *"Não foi possível confirmar
  sua sessão. Verifique sua conexão."* com um botão **Tentar de novo**. Ninguém é deslogado.
- Se ela responder 401, aí sim: anônimo, marca limpa, landing.

**Uma tentativa a mais, não um laço.** Repetir sem teto transforma API fora do ar em tempestade de
requisições vinda de todo mundo que tem o app aberto, e é assim que uma instabilidade de trinta
segundos vira uma de dez minutos.

### 4. O boot tem prazo, e estourar o prazo não desloga
`restoreSession` hoje espera o `refresh` sem limite. A API roda como função serverless na Vercel: **cold
start existe, e é medido em segundos**. Enquanto isso o app inteiro fica parado antes da primeira
pintura, porque o initializer bloqueia o bootstrap.

Prazo de **5 segundos**. Estourou, o boot solta o app com `status` em `unknown` — nunca em `anonymous`,
pela decisão 2 — e a requisição continua em voo: se ela chegar depois, a sessão é preenchida e a tela
se atualiza sozinha.

Cinco segundos é feio e é melhor que a alternativa. A alternativa é tela branca por tempo
indeterminado, e a pessoa recarrega no meio — o que reinicia o cold start e a coloca num laço em que
cada tentativa de sair piora a espera.

### 5. A marca de sessão só é apagada por 401
`hasSessionHint()` responde "vale a pena tentar o refresh?". Se ela for apagada por falha de rede, o
membro perde o direito de nem sequer *tentar* restaurar a sessão na próxima abertura — e aí o logoff
vira permanente, causado por um blip.

Apaga em: **401 no refresh**, e **logout explícito**. Em mais nada.

### 6. O logoff que acontecer precisa ser explicável
Um logoff silencioso não é reportável. A pessoa não escreve "o refresh devolveu 401", ela escreve "o
site me desloga sozinho" — e foi exatamente assim que este problema chegou, sem nada para investigar.

Então: quando o membro tinha marca de sessão e é deslogado por 401 na abertura, ele **não cai calado na
landing**. O modal de login abre com a linha *"Sua sessão expirou. Entre de novo para continuar."*

É uma frase, e ela é a diferença entre um usuário que reclama de algo concreto e um que só desconfia do
produto.

### 7. O destino é preservado, e isso já funciona — não quebrar
Quem aperta F5 em `/dashboard/mural` e precisa entrar de novo **volta para `/dashboard/mural`**, não
para o `/dashboard`.

O `authGuard` já guarda `intendedUrl` e o `onLogin` do `app.ts` já o consome e limpa. Está certo hoje.
Entra na spec como **teste-trava**: as mudanças das decisões 2 e 3 mexem no caminho do guard, e é o tipo
de comportamento que se perde numa refatoração sem ninguém notar.

### 8. Nada disso pode ser verificado em desenvolvimento
É a regra mais importante da spec e a mais fácil de ignorar, porque em `localhost` **tudo já funciona
hoje, inclusive o bug**.

Um F5 verde no `ng serve` não é evidência de nada aqui. A verificação real é:

1. **Em ambiente publicado**, logar, apertar F5 no painel, continuar dentro.
2. **No Safari do iPhone**, o mesmo. É onde a correção `SameSite=None` falharia, e é por isso que este
   passo é o que prova a decisão 1.
3. Com a rede desligada no meio do F5: a tela avisa e **não desloga** (decisões 2 e 3).
4. Aba aberta parada por mais de uma hora, depois uma ação: o access token expirou, o interceptor
   renova, a ação passa. Sem logoff.

---

## Rotas

Nenhuma rota nova. O que muda é o comportamento dos guards na abertura:

| Rota | Guard | O que muda |
|---|---|---|
| `/dashboard/**` | `authGuard` + `profileCompleteGuard` | `unknown` deixa de expulsar (decisão 3) |
| `/completar-perfil` | `authGuard` + `onboardingPendingGuard` | idem |
| `/comunidade` | — | Recebe a frase de sessão expirada (decisão 6) |

---

## Fora de escopo

- **Trocar o modelo de sessão.** Access token em memória e refresh em cookie HttpOnly continuam. Quem
  abrir esta spec e propor token em `localStorage` está resolvendo o F5 abrindo um XSS.
- **"Lembrar de mim", sessão longa, ou múltiplos dispositivos.** O prazo de 30 dias do cookie não muda.
- **Renovar o token proativamente antes de expirar.** O interceptor renova no 401 e isso basta; um
  temporizador de renovação é estado a mais para o mesmo resultado.
- **Consertar o logout global.** O `revokeRefreshTokens` do Firebase derruba a sessão em todos os
  aparelhos, o que é uma decisão da spec 007 e um incômodo conhecido. Não é este problema.
- **Tela de manutenção para API fora do ar.** A faixa da decisão 3 é o que existe.

---

## Specs afetadas

### Spec 005 (Autenticação e Dashboard) — vigente, corrigida
A tabela de cookies de lá **já previa `SameSite=none` em produção**, com a justificativa "front e API
estão em domínios diferentes". A previsão estava certa sobre o problema e errada sobre a saída: a
decisão 1 desta spec ataca a premissa — os domínios é que deixam de ser diferentes — em vez de aceitar
o cookie de terceiro. **A linha `none em produção` da spec 005 fica revogada.**

O resto da 005 — token em memória, cookie HttpOnly, `Path=/auth` — continua valendo integralmente.

### Spec 010 (Mural de Perguntas) — vigente
A decisão 11 de lá diz que o Mural é a tela mais tocada do produto, no celular. É o argumento de por que
o Safari não pode ficar de fora da correção (decisão 1).

---

## Pontos em aberto

1. **`api.lenoborges.com.br` pode ser criado?** A decisão 1 depende de um registro DNS e de o domínio
   ser adicionado ao projeto da Vercel. Assumido que sim, por ser o mesmo domínio do produto. Se por
   algum motivo não puder, a alternativa é a decisão 1-B abaixo, e **não** é o `SameSite=None`.
2. **Alternativa 1-B, se o subdomínio não for possível:** o front passa a servir a API sob o próprio
   domínio, via rewrite (`/api/*` → backend). Aí o cookie é first-party de verdade e o CORS some.
   Custa um salto de rede a mais e obriga o `Path` do cookie a virar `/api/auth`. É mais forte que a
   decisão 1 e mais cara; ficou como alternativa por isso.
3. **O `FRONTEND_URL` de produção está com a origem certa do front?** Não deu para verificar daqui — é
   variável de ambiente na Vercel. Se estiver errada, o CORS recusa e o F5 falha **mesmo depois** da
   decisão 1, com um sintoma idêntico. É o primeiro item a conferir na execução, antes de mexer em
   código.
4. **Quanto tempo o membro fica logado, na prática?** O cookie dura 30 dias, mas quem manda é o refresh
   token do Firebase. Assumido que 30 dias é o teto real. Se for menor, alguém vai reabrir esta spec
   achando que o F5 quebrou de novo.

# Code review da spec 005 (e da 004 junto)

Data: 2026-08-14. Repositório: `eduleno-front`, branch `dev`.

## Escopo

| recorte | range                                                   | arquivos |
|---------|---------------------------------------------------------|----------|
| spec 005 | `release/004-acesso-antecipado..dev`                    | 58 (~5.500 linhas) |
| spec 004 | `release/003-comunidade..release/004-acesso-antecipado`  | 10 de código |

Documentação (`specs/**`, `README.md`, `.agents/**`) ficou fora. `npx tsc -p tsconfig.app.json
--noEmit` passa limpo: nenhum achado abaixo é erro de tipo, todos são de comportamento.

Critério: o contrato do [`context.md`](./context.md) desta spec e as regras do
`.claude/clauderc.md`.

## O que passou

Os cinco pontos de risco que a spec previu foram verificados um a um e **quatro estão corretos**:

- `auth.store.ts`: access token só em `signal`, nenhum `localStorage` nem `sessionStorage` para
  sessão. O único uso de armazenamento é a preferência de aside expandido, como planejado.
- `auth.guard.ts` e `profile.guard.ts`: leem estado, não disparam rede, e o guard inverso está lá.
- `auth.interceptor.ts`: `/auth/login` corretamente excluído do fluxo de refresh, então 401 de
  credencial errada não vira loop.
- `definir-senha.page.ts`: o token não é renderizado em tela nem em log.

O quinto (refresh compartilhado entre 401 simultâneos) foi implementado, mas escapa em dois casos.
Ver A3.

Do lado da 004, o código está sólido: o modal bloqueia envio duplo em dois lugares (`send()` e o
`[disabled]` do botão), e `waitlist-error.ts` traduz falha fora do componente dumb, como manda a
regra 7 do clauderc.

---

## Bloqueante

### A1. O cookie de refresh nunca é guardado, porque o login não manda credenciais
**Arquivo:** `src/app/core/auth/auth.interceptor.ts:23`

`withCredentials` é aplicado só em `/auth/refresh` e `/auth/logout`. Front (`localhost:4200`) e API
(`localhost:3000`) são origens distintas, então o navegador **descarta o `Set-Cookie` HttpOnly** da
resposta do login.

**Cenário:** o usuário loga e tudo parece funcionar, porque o access token em memória está lá. No
primeiro F5, o `provideAppInitializer` chama `/auth/refresh` sem cookie, toma 401, e a sessão vira
anônima. Qualquer 401 posterior também nunca consegue renovar. É exatamente o defeito que a Fase 01
inteira existia para evitar, e o `context.md` pede em texto: "token em memória, cookie de refresh
guardado pelo navegador".

**Correção:** incluir `/auth/login` na condição da linha 23. **Não** incluir `/auth/password`: pelo
contrato, aquele endpoint responde 204 sem sessão e sem cookie, de propósito.

---

## Sérios

### A2. `catchError` depois do `switchMap` derruba sessão válida
**Arquivo:** `src/app/core/auth/auth.interceptor.ts:70`

O `catchError` está encadeado depois do `switchMap`, então captura tanto a falha do refresh quanto a
falha da **requisição refeita**.

**Cenário:** o refresh funciona, o retry de `GET /me` devolve 500. O `clearSession()` roda e expulsa
do dashboard um usuário com sessão perfeitamente válida, por causa de um erro de servidor não
relacionado.

**Correção:** aplicar o `catchError` com `clearSession` só sobre `refreshInProgress$`, antes do
`switchMap`.

### A3. `finalize` depois do `shareReplay` zera o refresh em voo
**Arquivo:** `src/app/core/auth/auth.interceptor.ts:53`

O `finalize` está a jusante do `shareReplay(1)`, portanto roda por assinante, inclusive no
**unsubscribe**, não só quando o refresh termina.

**Cenário:** duas requisições tomam 401 e compartilham o refresh. A primeira é cancelada por
navegação ou destruição de componente. O `finalize` daquele assinante zera `refreshInProgress$` com
o refresh ainda em voo, e um terceiro 401 dispara um **segundo** `POST /auth/refresh` com o token já
rotacionado, que volta 401 e desloga. É a mesma corrida que a Task 08 da Fase 01 mandava testar,
escapando por ordem de operador.

**Correção:** mover o `finalize` para antes do `shareReplay`, sobre a fonte, ou limpar a variável só
nos callbacks de next e error.

### A4. Falta a navegação quando o refresh falha
**Arquivo:** `src/app/core/auth/auth.interceptor.ts:71`

O `context.md` (seção "Interceptor", item 4) diz: "o refresh falhou: limpa o estado, **navega para
`/comunidade`** e propaga o erro". O código só limpa o estado.

**Cenário:** a sessão expira com o usuário em `/dashboard`. O store é limpo, mas nenhuma rota muda e
nenhum guard reroda, então ele fica olhando um dashboard morto, com nome e Grau em branco, sem
entender que saiu.

### A5. O texto de LGPD da 004 deixou de ser verdade por causa da 005
**Arquivos:** `src/app/components/waitlist-dialog/waitlist-dialog.ts`, bloco `.legal`, mais o
`signup` do backend.

O texto promete duas coisas: "finalidade única: avisar quando a Seita Dev abrir" e dados "apagados
quando você pedir". A spec 005 quebra as duas. O backend lê `waitlist_entries` no cadastro e
**copia** `name` e `phone` para `profiles`, guardando ainda o `waitlist_entry_id`. Isso é uma segunda
finalidade, não coberta pelo consentimento que a pessoa deu. E a FK é `on delete set null`: apagar a
linha da lista de espera a pedido do titular **deixa nome e telefone vivos no perfil**, então a
exclusão prometida vira parcial.

Este é o único achado que só aparece cruzando as duas specs. A 004 registrou no próprio `context.md`
que trocar o comportamento é o gatilho para revisar esse texto; a 005 trocou o comportamento e não
revisou.

**Decisão do usuário (2026-08-14): muda o texto, o backend continua copiando.**

Aplicado em `waitlist-dialog.ts`. O bloco `.legal` passou a declarar as duas finalidades (aviso de
abertura e preenchimento do perfil se a pessoa criar conta com o mesmo e-mail) e a consequência de
retenção que o `on delete set null` produz: apagar a inscrição na lista **não** apaga o perfil, e o
titular precisa pedir os dois. O rótulo do checkbox de consentimento também mudou, porque é ele o
texto operativo do consentimento, não o parágrafo explicativo.

Continua fora de escopo inventar política de privacidade: o texto novo descreve o que o backend da
005 de fato faz, nada além.

### A6. Tratamento de erro reimplementado, e pior, em quatro lugares
**Arquivos:** `src/app/app.ts:82` e `:101`, `src/app/pages/completar-perfil/completar-perfil.page.ts:74`,
`src/app/pages/definir-senha/definir-senha.page.ts:120`

Dois defeitos distintos, mesma raiz:

1. `error?.message || fallback`: um `HttpErrorResponse` **sempre** tem `.message`, com o texto
   técnico do Angular. Um 500 no `PATCH /me/profile` faz o usuário ler
   `"Http failure response for http://localhost:3000/me/profile: 500 Internal Server Error"`, com a
   URL da API exposta na tela, e o fallback nunca roda.
2. `app.ts:82` testa só `error?.status`, mas os erros de validação lançados pelo `AuthService` são
   `Error` puro, sem `status`. `Validators.email` aceita `maria@x` e o `EMAIL_PATTERN` do service
   rejeita, então o usuário vê "Não foi possível conectar. Tente novamente em instantes.", culpando a
   rede por um erro de campo.

**Correção:** a 004 já resolveu isso certo em `src/app/services/waitlist-error.ts`, que testa
`HttpErrorResponse` **antes** de `Error` justamente porque `HttpErrorResponse` não é
`instanceof Error`. Generalizar aquele arquivo para um `httpErrorMessage(error, fallback)` e reusar
nos quatro pontos, em vez de manter cinco tratamentos paralelos.

### A7. Boot bloqueado pelo refresh, inclusive para visitante anônimo
**Arquivo:** `src/app/core/auth/session-init.ts:18`

O `provideAppInitializer` faz `await firstValueFrom(authService.refresh())` para **todo** visitante,
inclusive quem só abriu a landing pública.

**Cenário:** `environment.production.apiUrl` aponta para `https://api.lenoborges.com.br`, que a
própria doc do arquivo marca como ainda não publicado. Em produção, a landing só renderiza depois de
o DNS ou a conexão falharem, o que em rede lenta é o timeout do navegador.

**Correção:** disparar o refresh sem bloquear a inicialização, ou só quando houver indício de sessão.
O estado `unknown` do `AuthStore` já existe para cobrir essa janela.

### A8. Gaveta do aside continua tabulável quando fechada
**Arquivo:** `src/app/components/dashboard-aside/dashboard-aside.ts:203`

No mobile o `<aside>` fica sempre no DOM, escondido só por `transform: translateX(-100%)`.

**Cenário:** usuário de teclado ou leitor de tela em viewport menor que `64rem`, com a gaveta
fechada, tabula a partir do header e cai em cinco controles invisíveis fora da tela: Home, Trilha,
Perfil, Jogos e **Sair**.

**Correção:** `visibility: hidden` ou `inert` enquanto `mobileOpen()` for falso.

---

## Menores

### B1. O `token_hash` fica na URL depois de usado
`src/app/pages/definir-senha/definir-senha.page.ts:62`. O token é lido mas nunca removido, então
continua no histórico do navegador e vaza no `Referer` de qualquer subrecurso de outra origem. Um
`router.navigate([], { replaceUrl: true })` logo após a leitura resolve.

### B2. O fallback de token aceita `access_token` como se fosse `token_hash`
`src/app/pages/definir-senha/definir-senha.page.ts:64` e `:70`. A leitura tenta, nessa ordem,
`token_hash`, `token` e `access_token`, na query e no fragmento. Os dois primeiros são o mesmo tipo
de valor; `access_token` **não é**: é o JWT que o template padrão do Supabase devolve, e mandá-lo em
`POST /auth/password` como `tokenHash` faz o `verifyOtp` do backend falhar. O fallback dá a impressão
de cobrir o template padrão sem cobrir de verdade. Ou tratar esse caso com o endpoint certo, ou
remover o `access_token` da lista e deixar cair em `invalid_link`, que ao menos é honesto.

### B3. `intendedUrl` fica preso no store
`src/app/app.ts:76`. Só é consumido e limpo no ramo de perfil completo. Se o guard salvou
`/dashboard/x` e o usuário loga com perfil incompleto, ele vai para `/completar-perfil` e o valor
fica lá. Num login futuro, aquele destino velho é aplicado.

### B4. O modal não reseta os formulários ao fechar
`src/app/components/auth-dialog/auth-dialog.ts:548`. `close()` só chama `dialog.close()`. A senha
digitada continua preenchida ao reabrir, e o valor segue vivo no `FormGroup` pelo resto da sessão.

### B5. `aria-current="page"` fixo no Home
`src/app/components/dashboard-aside/dashboard-aside.ts:94`. Está escrito direto no template, sem
binding com o `routerLinkActive`. Quando existir a segunda rota filha do dashboard, o leitor de tela
vai anunciar duas páginas atuais.

### B6. SVG inline contra a regra 1 do clauderc
`src/app/components/auth-dialog/auth-dialog.ts:71`, `confirm-dialog.ts` e
`definir-senha.page.html:12`. O mesmo PR criou seis `icon-*.ts` e depois deixou três SVGs soltos.

### B7. `subscribe` sem `takeUntilDestroyed` (herdado da 004)
`src/app/pages/comunidade/comunidade.page.ts:80` e o equivalente em `landing.page.ts`. Se o visitante
navega com o envio em voo, o callback escreve num signal de componente destruído. São as únicas
assinaturas soltas do repositório.

### B8. `apiUrl` de produção aponta para uma API não publicada
`src/environments/environment.production.ts`. Herdado da 004 e agravado por A7, que transformou isso
em bloqueio de renderização.

---

## Ordem sugerida de correção

| # | achado | branch sugerida |
|---|--------|------------------|
| 1 | A1, A2, A3, A4 (mesmo arquivo, mesmo bloco) | `fix/005-interceptor-sessao` |
| 2 | A5 (**depende de decisão do usuário**) | `fix/005-lgpd-vinculo-waitlist` |
| 3 | A6 | `fix/005-mensagens-de-erro` |
| 4 | A7, B8 | `fix/005-boot-sem-bloqueio` |
| 5 | A8, B5 | `fix/005-a11y-aside` |
| 6 | B1, B2, B3, B4, B6, B7 | `fix/005-ajustes-menores` |

O item 1 sai numa branch só porque os quatro achados são do mesmo bloco de código, e um teste novo de
"cancelamento não zera o refresh em voo" cobre A3 e parte de A1.

O item 2 é o único que não é decisão técnica: mudar o texto do modal ou mudar o comportamento do
backend. Precisa da resposta antes de qualquer coisa ir para produção.

## Contagem
16 achados: 12 da spec 005, 3 da spec 004 e 1 (A5) que só existe no cruzamento das duas.

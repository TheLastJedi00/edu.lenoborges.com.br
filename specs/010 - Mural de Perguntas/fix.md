# Fix: o dashboard do membro e o aside contam histórias diferentes

Aberto em 2026-08-18, depois da execução da spec 010 nos dois lados.

## Sintoma

O painel tem dois menus, e eles discordam.

O **aside** (`src/app/components/dashboard-aside/dashboard-aside.ts`) tem seis itens de navegação
mais o rodapé: Home, Trilha, Financeiro, Mural, Meu Perfil, Jogos, Administração e Sair. Trilha,
Financeiro e Mural estão ativos; Meu Perfil e Jogos estão inertes, com o selo `Em breve`.

O **dashboard** (`src/app/pages/dashboard/dashboard.page.html`) tem quatro cartões: Acessar trilha,
Grupo do WhatsApp, Meu Perfil e Jogos. **Três dos quatro estão `card--disabled`**, e o único
habilitado é o WhatsApp, que é um link para fora do produto.

O resultado é que quem entra no painel vê uma tela onde quase nada funciona, e descobre que a Trilha,
o Financeiro e o Mural existem só se abrir o menu lateral.

---

## As duas correções, e por que são a mesma

### 1. `Acessar trilha` não é mais `Em breve`

O cartão da trilha está com `card--disabled` e o selo `Em breve` desde a spec 005, quando a trilha
realmente não existia. **A spec 009 destravou a trilha** — a decisão 6 de lá diz que insígnia sem
conteúdo abre e avisa em vez de travar, e o aside foi atualizado com um comentário explicando
exatamente isso:

> Destravada na spec 009. O fallback saiu daqui e foi para dentro da tela. [...] Travar o botão
> esconderia o mapa de quem está começando.

O argumento vale igual para o cartão. **Ele ficou para trás no mesmo commit em que o aside andou**, e
o efeito é pior no dashboard do que seria no aside: o cartão é maior, tem descrição, e é a primeira
coisa que a pessoa lê ao entrar. Um cartão cinza dizendo `Em breve` sobre um recurso que está de pé
não é conservador, é informação errada.

Vale o mesmo para Financeiro e Mural, que **não têm cartão nenhum** — e essa é a segunda correção.

### 2. Um é o espelho do outro

O dashboard e o aside são a mesma lista de destinos em duas formas. Não é uma coincidência de
desenho: é o que faz o painel ser aprendível. Quem clica no cartão da Trilha e depois vê `Trilha` no
menu lateral aprende que os dois são o mesmo lugar. Quem vê quatro cartões e seis itens de menu
aprende que precisa procurar nos dois.

**A regra que este fix estabelece:** todo item de navegação do aside tem um cartão no dashboard, com o
mesmo rótulo, o mesmo ícone e o mesmo estado (ativo ou `Em breve`). Divergir é o bug.

O estado final:

| Item | Aside | Dashboard hoje | Dashboard depois |
|---|---|---|---|
| Home | ativo | — | **não tem cartão** (é a própria tela) |
| Trilha | ativo | `Em breve` | **ativo** → `/dashboard/trilha` |
| Financeiro | ativo | ausente | **ativo** → `/dashboard/financeiro` |
| Mural | ativo | ausente | **ativo** → `/dashboard/mural` |
| Meu Perfil | `Em breve` | `Em breve` | `Em breve` (igual) |
| Jogos | `Em breve` | `Em breve` | `Em breve` (igual) |
| Administração | ativo, se `isAdmin()` | ausente | **ativo, sob o mesmo `isAdmin()`** |
| Sair | ativo | — | **não tem cartão** (ação, não destino) |

**Três exceções, e as três são deliberadas:**

- **Home não vira cartão.** Um cartão que navega para a tela onde a pessoa já está é um beco.
- **Sair não vira cartão.** É ação destrutiva de sessão, e ação destrutiva não fica na grade junto de
  navegação, onde o clique é exploratório.
- **Grupo do WhatsApp fica, e é o único cartão sem par no aside.** Ele não é um destino do produto: é
  um link para fora, com `target="_blank"`. Colocá-lo no aside daria a um link externo o mesmo peso
  visual de uma rota interna, e o menu lateral passaria a ter um item que não pode ficar `is-active`.
  A assimetria é de mão única, e é a única aceita: **tudo que está no aside está no dashboard; nem
  tudo que está no dashboard está no aside.**

O cartão de Administração respeita o mesmo `@if (authStore.isAdmin())` do aside, e vale a mesma nota
que já está lá: **esconder não é a segurança** — quem impede é o `AdminGuard` do backend, e nenhuma
tela pode depender de o cartão estar escondido.

---

## O que muda no código

Só o dashboard. **O aside não muda** — ele já está certo, e é dele que o dashboard copia.

- `src/app/pages/dashboard/dashboard.page.html` — o cartão da Trilha vira `<a class="card card--link"
  routerLink="/dashboard/trilha">` com selo `Disponível`; entram os cartões de Financeiro, Mural e
  Administração no mesmo formato; Meu Perfil e Jogos ficam como estão.
- `src/app/pages/dashboard/dashboard.page.ts` — importa `RouterLink` e os ícones `IconBilling`,
  `IconMural` e `IconShield`, que já existem em `src/app/components/icons/`, e expõe o `authStore`
  para o `isAdmin()` do cartão de Administração.
- `dashboard.page.scss` — nada. As classes `card--link`, `card--disabled` e `card__badge--active` já
  existem e cobrem os dois estados.

**Reuso, não invenção:** os ícones são os mesmos do aside, e os rótulos são os mesmos, literais. Um
"Financeiro" no aside e um "Assinatura" no cartão seriam dois nomes para uma coisa, que é o começo de
o produto ter vocabulário próprio em cada tela.

---

## O que não fazer

**Não extrair uma lista compartilhada de itens agora.** É a tentação óbvia — um `NAV_ITEMS` que os
dois componentes consomem — e ela custa mais do que resolve: as duas telas têm formas diferentes
(cartão tem descrição, item de menu não), estados diferentes (o cartão do WhatsApp não existe no
aside) e o aside já tem uma `AsideNavItem` que ninguém usa. Se a divergência voltar uma terceira vez,
aí a constante compartilhada se paga.

**Não transformar os cartões de Meu Perfil e Jogos em links "que abrem e avisam".** O argumento da
decisão 6 da spec 009 — insígnia vazia abre e avisa — vale para conteúdo que ainda não chegou numa
tela que existe. Perfil e Jogos não têm tela nenhuma, e `/dashboard/perfil` não está em
`app.routes.ts`. `Em breve` aqui é a verdade.

**Não mexer no aside para "equilibrar".** A correção é em uma direção só. O aside é a fonte.

---

## Verificação

- `dashboard.page.spec.ts` ganha um caso que garante que o cartão da Trilha navega, e um que garante
  que o cartão de Administração só existe com `isAdmin()` verdadeiro.
- O teste que trava a divergência: **para cada rota ativa no aside, existe um cartão no dashboard
  apontando para ela.** É o único teste que impede o bug de voltar; os outros só testam o estado de
  hoje.
- `ng build` limpo e a suíte inteira verde (eram 241 testes no fim da spec 010).

---

## Aplicação (2026-08-18)

Branch `fix/010-espelho-dashboard-aside`. **O aside não foi tocado** — ele já estava certo, e é dele
que o dashboard copia.

| Arquivo | O que mudou |
|---|---|
| `dashboard.page.html` | Trilha vira `<a routerLink>` com selo `Disponível`; entram Financeiro, Mural e Administração; WhatsApp, Meu Perfil e Jogos ficam como estavam |
| `dashboard.page.ts` | importa `RouterLink`, `IconBilling`, `IconMural` e `IconShield`; o `authStore` passa de `private` para `protected`, para o `isAdmin()` do cartão de Administração |
| `dashboard.page.spec.ts` | três casos novos, um deles o que trava a regra |
| `dashboard.page.scss` | **nada**. `card--link`, `card--disabled` e `card__badge--active` já cobriam os dois estados |

A ordem final da grade espelha a do aside, com o rodapé no fim: Trilha, Financeiro, Mural, WhatsApp,
Meu Perfil, Jogos, Administração.

### Os testes, e qual deles importa

Os dois primeiros travam o estado de hoje — que Trilha, Financeiro e Mural navegam, e que só Meu
Perfil, Jogos e o WhatsApp sem URL ficam inertes. **O terceiro trava a regra**, e é o único que impede
o bug de voltar:

```ts
it('todo destino do aside tem um cartão no dashboard', () => { ... })
```

Ele monta o aside e a page juntos, com e sem a claim de admin, e exige que todo `href` do menu tenha
um cartão correspondente. `/dashboard` é filtrado, por ser o único destino deliberadamente sem cartão.

**A checagem é de mão única de propósito.** Exigir o inverso quebraria no Grupo do WhatsApp, que é a
assimetria aceita — e transformar essa exceção em erro de teste levaria alguém a "consertar" o teste
pondo um link externo no menu lateral.

**244 testes verdes** (eram 241) e `ng build` limpo.

### O que ficou de fora, e por quê

- **Uma constante `NAV_ITEMS` compartilhada.** É a tentação óbvia e custa mais do que resolve agora:
  as duas telas têm formas diferentes (cartão tem descrição, item de menu não) e estados diferentes
  (o WhatsApp não existe no aside). O teste do espelho dá a mesma garantia sem acoplar os dois
  componentes. Se a divergência voltar uma terceira vez, aí a constante se paga.
- **A `AsideNavItem` órfã**, exportada em `dashboard-aside.ts` e usada por ninguém. É a sobra de uma
  tentativa anterior dessa mesma abstração, e removê-la não pertence a este fix.

---
---

# Fix 2: o link do grupo entra no código, e o quarto cartão acende

Aberto em 2026-08-18, logo depois do Fix 1.

## O que era

`environment.whatsappGroupUrl` estava `''` nos dois ambientes, com o comentário *"vazio por padrão até
o link definitivo ser configurado"*. O cartão do Grupo do WhatsApp caía no ramo `@else` e ficava
`card--disabled`, com o selo `Em breve` e o texto "o link do grupo oficial está sendo preparado".

O Fix 1 acendeu Trilha, Financeiro e Mural. **O WhatsApp era o último cartão apagado que não precisava
estar apagado** — e o único cujo destravamento não dependia de escrever tela nenhuma, só de saber o
link.

## O que mudou

Uma linha em cada `environment`:

```ts
whatsappGroupUrl: 'https://chat.whatsapp.com/FIyeOUoIuCmKghcHpd0vbR',
```

**O mesmo valor nos dois arquivos, e isso é a decisão.** Um convite de grupo público não é segredo, e
apontar o desenvolvimento para um grupo diferente — ou para nenhum — significa que o único ambiente
onde o cartão é exercitado é produção. Já foi assim duas vezes neste projeto, nos dois fixes da spec
007 do backend, e as duas vezes custaram caro.

**Nenhuma linha de template mudou.** O `@if (hasWhatsappUrl())` já estava lá desde a spec 005,
esperando exatamente por isso. É o desenho funcionando: o cartão sempre soube acender sozinho.

## O que este fix não faz

**Não coloca o WhatsApp no aside.** O pedido falava em "botão no dashboard/aside", mas o aside nunca
teve item de WhatsApp — e a decisão do Fix 1 é que ele não deve ter. É um link para fora, com
`target="_blank"`, e no menu lateral viraria o único item incapaz de ficar `is-active`. A regra do
espelho é de mão única, e este cartão é justamente a exceção que ela permite.

**Não torna o link configurável em tempo de execução.** Ele é constante de build, e trocá-lo exige
deploy. Isso é aceitável enquanto o grupo for um só; quando precisar mudar sem deploy, o lugar é um
campo no backend, não uma variável de ambiente do front — que exige build do mesmo jeito e só espalha
a configuração por mais um sistema.

## Verificação

- **245 testes verdes** (eram 244) e `ng build` limpo.
- O teste dos cartões inertes caiu para `['Meu Perfil', 'Jogos']`, que é a lista de quem não tem rota
  em `app.routes.ts`. Os dois únicos cartões apagados do painel agora são os dois recursos que de fato
  não existem.
- Um teste novo garante que o `href` é o link do `environment`, que ele tem forma de convite do
  WhatsApp, e que o `rel` traz `noopener` — sem ele a aba do grupo recebe `window.opener` e pode
  reescrever a URL desta, que é a única aba com a sessão dentro.
- Conferido no bundle: o link aparece no `dist` de produção, e não só no `environment.ts` de
  desenvolvimento.

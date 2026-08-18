# Spec 009: Financeiro, Administração e Trilha

> ## Alteração de escopo durante a execução (2026-08-18)
>
> **A seção de acesso antecipado sai das páginas públicas.** O cadastro de conta já funciona, então a
> lista de espera perdeu a razão de existir: ela era a forma de capturar interesse **enquanto não havia
> porta de entrada**, e agora há. Manter as duas seria oferecer duas portas para o mesmo lugar, uma
> delas pior.
>
> Isso simplifica a decisão 3 em vez de complicá-la. O CTA já ia ser um só; agora ele é o único, sem
> um terciário competindo por atenção logo abaixo.
>
> **O que sai é a interface, não os dados.** `POST /waitlist`, a coleção `waitlist_entries` e a spec
> 004 continuam de pé, intocados: as inscrições existentes são de pessoas reais, e `waitlistEntryId`
> ainda liga perfis a elas. Apagar endpoint e coleção é irreversível e não é preciso para tirar a
> seção do ar — some o caminho até o formulário, e o que já foi coletado continua onde está.
>
> Some da landing e da `/comunidade`: os botões "Quero acesso antecipado" e "Entrar na lista de
> espera", a seção final da `/comunidade` inteira, e o `app-waitlist-dialog` das duas páginas.

## Objetivo
Tirar o preço das páginas públicas e devolvê-lo dentro da plataforma, numa aba nova chamada
**Financeiro**. A landing continua contando quais tiers existem e o que cada um entrega — **incluindo o
Master Dev Tier, novo** —, mas nenhum número aparece antes da conta. O CTA público passa a ser um só:
**começar gratuitamente**.

Junto disso, o painel deixa de ser uma tela com um selo e quatro botões inertes:

1. **Financeiro** — os quatro tiers com preço, o plano atual, e o que cada upgrade abre.
2. **Administração** — visível só para quem tem a claim de admin: usuários cadastrados e publicação dos
   vídeos da trilha, com ordem e título próprios por insígnia.
3. **Trilha destravada** — o aluno entra, vê as insígnias, escolhe qual conquistar e **pode pular**.
   Insígnia sem conteúdo não some nem trava: ela abre e avisa que o material ainda está sendo preparado.

O par desta spec no backend é a **009**, que serve o preço atrás do guard, as rotas de admin e os vídeos
por insígnia. Esta spec consome aqueles endpoints e não inventa nenhum.

---

## Numeração

**O número é o mesmo nos dois repositórios, sempre.** Esta é a 009 aqui e a 009 lá.

Isso custa números vazios, e o custo é aceito: o front não tem 006 nem 007, porque as duas foram
inteiramente de backend; o backend não tem 008, porque a Liga Dev era quase toda de front. **Número
ausente é barato de explicar; número que significa duas coisas, não.** Esta spec chegou a nascer como
008 no backend e foi renumerada antes de qualquer execução, exatamente por isso.

A consequência boa é que "spec 008" quer dizer Liga Dev em qualquer um dos dois lados, e as citações
que o código do backend já tem estão certas como estão.

A spec seguinte, o Mural de Perguntas, é a **010** nos dois repositórios.

---

## Por que o preço sai da página

A tabela de preços é a terceira seção que um visitante novo lê, e ele chega nela sem ter visto uma aula,
sem saber o que é uma insígnia e sem ter usado nada. R$ 199,99 sem contexto não é caro nem barato — é
uma objeção, e ela chega antes de existir qualquer coisa para objetar.

A decisão 5b da spec 008 já tinha visto o sintoma: três preços em sequência fazem o terceiro parecer
arbitrário. A resposta de lá foi explicar melhor. A resposta daqui é mudar o momento — o preço faz
sentido **depois** de a pessoa ter conta, ter visto a trilha e ter conquistado de graça as duas
primeiras insígnias. Nessa hora ele responde uma pergunta que ela já está fazendo sozinha.

### "Tirar o preço" não é `@if` no template

> **O número não pode estar no bundle.** Se o preço vem no JavaScript que qualquer visitante baixa,
> ele não saiu da landing — só saiu da tela, e continua a dois cliques no DevTools.

É por isso que existe um endpoint autenticado para uma tabela de quatro linhas. O `price` some do
conteúdo local (`community.service.ts`) e passa a chegar de `GET /billing/tiers`, que só responde com
sessão. Ver a decisão 1 da spec 009 do backend.

---

## Decisões

### 1. Duas fontes para tier, e a divisão é a mesma nos dois repositórios
| Dado | Onde mora | Onde aparece |
|---|---|---|
| Nome do tier, o que entrega, ordem, `perks` | `community.service.ts`, conteúdo local | landing e `/comunidade`, para qualquer visitante |
| **Preço** e o rótulo formatado | `GET /billing/tiers`, com sessão | só em `/dashboard/financeiro` |

`CommunityTier.price` **deixa de existir** no modelo local. Não vira `price: string | null`, não vira
`priceHidden: boolean` — some. Campo opcional é convite: alguém preenche "para o cartão ficar completo",
e o número volta ao bundle sem ninguém perceber.

O que entra no lugar é `priceHint: string`, e ele é copy, não dado: *"Preço na plataforma"*. Diz por que
o espaço do preço está vazio, o que é diferente de deixá-lo vazio.

### 2. Quatro tiers, e o Master aparece na landing sem número
| Tier | O que a landing diz | O que só o Financeiro diz |
|---|---|---|
| **Dev Tier** | Gratuito, insígnias 1 e 2, comunidade | — (grátis é o único preço que pode aparecer) |
| **Great Dev Tier** | A plataforma da insígnia 3 em diante | R$ 19,99/mês |
| **Ultra Dev Tier** | Tudo acima + a Grinding Arena | R$ 199,99/mês |
| **Master Dev Tier** | Tudo acima + duas aulas de inglês por mês, focadas em entrevista técnica | R$ 260,00/mês |

**"Gratuito" continua na landing, e não é exceção à regra** — é a ausência de preço, e é o CTA. Esconder
o "grátis" seria esconder a única coisa que a página precisa dizer sobre dinheiro.

**A cópia do Master tem uma armadilha para evitar.** Duas aulas por mês não ensinam inglês, e a página
não pode sugerir que ensinam. O que elas treinam é a **entrevista técnica em inglês**: apresentar-se,
explicar uma decisão de arquitetura, responder um follow-up sem perder o raciocínio. O público é quem
já programa e trava na conversa, não quem está começando o idioma.

Com quatro cartões, o `badge-ladder` fica apertado no celular. Ver a decisão 8.

### 3. O CTA público vira um só: começar gratuitamente
Hoje a landing tem três chamadas de peso — WhatsApp, lista de espera, conhecer a Liga — e a `/comunidade`
tem cinco botões só no hero. Com o preço fora, isso vira uma pergunta simples: **o que a página quer que
a pessoa faça?** Uma coisa.

| Peso | Ação | Onde |
|---|---|---|
| Primário | **Começar gratuitamente** → abre o diálogo de cadastro | hero da landing, fim de cada seção de tier, rodapé |
| Secundário | Entrar (quem já tem conta) | barra de menu, como já é |
| Terciário | WhatsApp e "conhecer a Liga" | ghost, sem competir |

**A lista de espera sai da página** (ver a alteração de escopo no topo). O cadastro de conta já
funciona, e a lista existia para capturar interesse enquanto não havia porta de entrada. O terciário
fica só com o WhatsApp e o "conhecer a Liga". Página sem preço não pode pedir dinheiro; o único próximo passo
honesto que sobra é a conta grátis, e ela é de verdade grátis, o que torna o CTA a frase mais fácil de
defender da página inteira.

### 4. Financeiro é rota do painel, e o upgrade leva a uma conversa
`/dashboard/financeiro`, item novo no aside, entre Home e Trilha.

A tela tem três blocos, nesta ordem: **seu plano hoje** (Dev Tier, para todo mundo, por enquanto), **os
quatro tiers com preço**, e **o que o próximo degrau abre**. O terceiro bloco é o que a landing não
consegue ter: com `currentTierId` em mãos, dá para dizer "o que você ganharia" em vez de "o que existe".

**Os tiers são cumulativos, e a tela precisa mostrar isso como degrau, não como alternativa.** Cada
cartão abre com "Tudo do <tier anterior>", e os já incluídos aparecem apagados no cartão de cima, não
repetidos por extenso — quatro listas quase idênticas lado a lado no celular viram um muro.

**Não existe checkout.** O backend não tem cobrança (decisão 4 da spec 009 do backend), então o botão
de upgrade abre o WhatsApp com uma mensagem pré-preenchida dizendo qual tier a pessoa quer. Um botão
"Assinar" que não assina é pior que nenhum: ele promete um fluxo que não existe e a pessoa descobre no
clique.

**Preço vem em centavos e a formatação é do front.** `price: 26000` vira `R$ 260,00` por
`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, num único helper. O `priceLabel`
que a API manda junto serve de fallback, não de fonte — dois formatadores discordando é a forma mais
boba de a tela mostrar `R$ 260` num lugar e `R$ 260,00` no outro.

### 5. Administração aparece pela claim, e esconder o botão não é a segurança
`role` chega achatado na sessão e em `GET /me` (decisão 5 da spec 009 do backend). O `AuthStore` ganha
`isAdmin`, computado da mesma forma que `grade` já é — do perfil quando existe, da sessão quando não.

> **O front não decodifica o ID token.** Dá para fazer, e é errado: o token é do backend, o formato é
> dele, e um `atob` no meio do app cria um segundo lugar que sabe ler credencial. `role` é campo de
> resposta.

O item "Administração" no aside e a rota `/dashboard/admin` ficam atrás de um `adminGuard`. **Isso é
conveniência, não proteção** — quem impede de verdade é o `AdminGuard` do backend, e qualquer tela de
admin que dependa do botão estar escondido está errada. O guard do front existe para o usuário comum
não bater num 403 sem entender por quê.

**Dois casos que se erra:**

- **A claim demora até uma hora** para entrar em vigor, porque o ID token vive isso (decisão 5 do
  backend). Quem acabou de ser promovido não vê o botão até o próximo login. A tela de erro 403 do
  admin precisa dizer isso, senão vira chamado de suporte.
- **`isAdmin` muda no meio da sessão** quando o perfil chega depois da sessão. O aside é `OnPush` e lê
  signal, então isso se resolve sozinho — desde que ninguém copie o valor para uma propriedade comum no
  `ngOnInit`.

### 6. A trilha destrava, e insígnia vazia é uma tela, não um erro
O item "Trilha" do aside perde o `disabled` e o selo "Em breve". A rota `/dashboard/trilha` mostra as
**oito insígnias como cartões selecionáveis**, mais a Elite Four e a Battle Frontier abaixo, separadas
pelo mesmo vão que o `badge-ladder` já usa.

**Nada é travado.** O aluno escolhe qual insígnia quer conquistar e pode pular a ordem. O cartão mostra
o estado — conquistada, disponível, sem conteúdo — mas nenhum estado impede o clique.

O fallback é **depois de entrar**, nunca antes:

> Insígnia sem vídeo abre normalmente e diz: *"Ainda estamos preparando esse material."*

Isso é escolha de produto, e a alternativa foi descartada: desabilitar o cartão da insígnia vazia
esconderia da pessoa **qual é o mapa**. No lançamento, onze das treze etapas estarão vazias — um painel
com dois cartões clicáveis e onze cinzas conta uma história pior do que treze cartões abertos, dois com
aula e onze com um aviso honesto.

**A consequência técnica é a decisão 8 da spec 009 do backend**: lista vazia é `200`, não `404`. O
front tem que tratar `videos.length === 0` como estado de conteúdo, e reservar a tela de erro para erro
de rede de verdade. Confundir os dois é o bug mais provável desta spec.

### 7. Ordem vem do servidor. No admin, os botões mandam e o arrastar é enfeite
A lista de vídeos de uma insígnia é renderizada na ordem que a API mandou, e o front **nunca reordena
por conta própria** — nem por título, nem por data, nem "para ficar bonito". A ordem é dado, é editável
pelo admin, e uma segunda ordenação no cliente faria o admin arrastar sem ver efeito.

Na tela de administração, reordenar tem dois mecanismos, e a hierarquia entre eles é uma decisão:

| Mecanismo | Papel | Por quê |
|---|---|---|
| **Botões subir/descer** | primário, sempre visíveis | funcionam no toque, no teclado e no leitor de tela |
| **Arrastar e soltar** | melhoria, só no ponteiro fino | rápido no mouse |

**Arrastar no celular disputa com o scroll**, e essa disputa não tem empate: ou a página rola quando o
usuário queria mover o item, ou o item se move quando ele queria rolar. Em uma tela cujo uso principal é
o celular (decisão 9), o mecanismo confiável tem que ser o primário. O arrastar entra depois, atrás de
`@media (pointer: fine)`, e nada depende dele.

**A reordenação é otimista com rollback.** A lista se move na hora, o `PATCH .../order` sai com os ids
na ordem nova, e se falhar a lista volta para onde estava com um aviso. Esperar a rede a cada clique de
seta torna a operação — que é repetitiva por natureza — insuportável. E como o backend escreve em lote
atômico (decisão 7 de lá), o rollback é sempre para um estado íntegro: não existe meio-reordenado.

**Salvar a ordem é uma requisição por gesto**, sem debounce escondendo dois cliques rápidos num só.
Debounce aqui só ganharia se a pessoa clicasse muito rápido, e perderia a garantia de que o que está na
tela é o que está no banco.

### 8. Animação: bastante, mas com regra
A ordem é abusar — e abuso sem regra vira jank no celular fraco, que é exatamente o aparelho do público.
As regras são cinco, e são baratas:

1. **Só `transform` e `opacity`.** Nada de animar `width`, `height`, `top`, `margin` ou `box-shadow` —
   são as propriedades que forçam layout a 60 vezes por segundo. Quando um efeito exigir tamanho, é
   `scale`, não `width`.
2. **`prefers-reduced-motion` desliga tudo**, num bloco global no `styles.scss`, não componente a
   componente. Movimento não é decoração para quem tem enxaqueca vestibular, e um único componente
   esquecido anula a intenção inteira.
3. **Duração por peso**, com tokens: 120ms para feedback de toque, 200ms para transição de estado,
   320ms para entrada de tela. Acima de 400ms a interface fica lenta, não elegante.
4. **Entrada em cascata com teto.** A `appReveal` que a landing já usa ganha `delay` por índice, com
   **máximo de 6 passos** — a sétima insígnia não pode esperar 700ms para existir. Depois do teto,
   todos entram juntos.
5. **Movimento com causa.** Cada animação responde a algo: conquista de insígnia comemora, upgrade de
   tier destaca, vídeo entra na lista deslizando de onde foi solto. Animação de ambiente — coisa que
   pulsa sozinha — só no hero, e só uma.

Os momentos que ganham animação de destaque, porque são os que carregam significado:

- **Selecionar insígnia** — o cartão cresce e o conteúdo entra por baixo, ligando os dois.
- **Insígnia conquistada** — selo com brilho e um pulso único, uma vez por conquista, nunca em loop.
- **Reordenar vídeo** — o item se move com `FLIP` (posição antiga → nova via `transform`), e os vizinhos
  acompanham. É o que faz a reordenação parecer física em vez de um redesenho.
- **Trocar de tier no Financeiro** — a comparação desliza lateralmente, mostrando o que entra.

### 9. Mobile é o desenho principal, não a adaptação
O aside já é mobile-first, com gaveta e `inert`. As telas novas seguem a mesma régua, e estes pontos são
os que se perdem quando alguém desenha no monitor:

- **Alvo de toque de 44px**, mínimo, com a área clicável maior que o desenho quando preciso. Os botões
  de subir/descer da decisão 7 são os primeiros candidatos a nascerem pequenos demais.
- **Ação primária ao alcance do polegar.** Em tela de admin e no Financeiro, o botão que importa fica
  ancorado embaixo no celular, não no topo depois de rolar.
- **Uma coluna até 48rem.** Os cartões de tier no celular são um carrossel de scroll horizontal com
  `scroll-snap`, não quatro cartões espremidos — quatro colunas de 90px não são uma tabela, são um
  problema.
- **Nada depende de `:hover`.** Toda informação que aparece no hover tem que existir em outro lugar no
  toque. Vale para tooltip de tier e para os botões de ação da linha de vídeo, que no celular ficam
  sempre visíveis.
- **`env(safe-area-inset-bottom)`** em tudo que gruda embaixo, ou o botão fica sob a barra do iOS.
- **Formulário de admin usa o teclado certo**: `inputmode="url"` no campo do YouTube,
  `enterkeyhint="done"`. É de graça e economiza dois toques por vídeo cadastrado.
- **Estado de carregamento é esqueleto, não spinner centralizado.** A lista de vídeos e a de usuários
  já sabem a forma que vão ter; o esqueleto evita o salto de layout que o spinner garante.

### 10. Vocabulário
| Termo | Uso |
|---|---|
| **Financeiro** | o item do menu e a rota. Não é "Planos", não é "Assinatura" — nada é assinado ainda |
| **Administração** | o item do menu do admin. Não é "Admin", que é jargão |
| **Master Dev Tier** | sempre por extenso na primeira menção de cada tela |
| **Ainda estamos preparando esse material** | a frase da insígnia vazia, literal, sempre a mesma |
| **Começar gratuitamente** | o CTA primário público, literal, em todas as posições |

Frase repetida é reconhecida. Cinco variações da mesma mensagem fazem o produto parecer escrito por
cinco pessoas.

---

## Rotas

| Rota | Guard | O que é |
|---|---|---|
| `/dashboard/financeiro` | auth + perfil completo | Os quatro tiers com preço, plano atual, upgrades |
| `/dashboard/trilha` | auth + perfil completo | As treze etapas, selecionáveis, nada travado |
| `/dashboard/trilha/:badgeId` | auth + perfil completo | Vídeos da insígnia, ou o aviso de material em preparo |
| `/dashboard/admin` | auth + perfil completo + **admin** | Índice da administração |
| `/dashboard/admin/usuarios` | idem | Lista paginada de cadastrados, edição de `grade` |
| `/dashboard/admin/trilha` | idem | Escolha da insígnia a administrar |
| `/dashboard/admin/trilha/:badgeId` | idem | Vídeos: criar, editar, remover, reordenar |

---

## Fora de escopo

- **Checkout, cartão, cobrança.** O upgrade leva ao WhatsApp (decisão 4).
- **Estado de assinatura na interface.** Todo mundo é Dev Tier hoje; a tela lê `currentTierId` e não
  presume mais nada. As decisões 5c e 5d da spec 008 continuam valendo: **`grade` é conquista, não
  aluguel**, e nenhuma tela pode derivar acesso de progresso nem o contrário.
- **Player próprio.** O vídeo é um `<iframe>` do YouTube. Título e ordem são nossos; o resto é de lá.
- **Marcar vídeo como assistido, progresso dentro da insígnia, jogos e ranking.**
- **Promover admin pela tela.** É script de terminal, no backend.

---

## Specs afetadas

### Spec 008 (Liga Dev) — vigente, com duas emendas
- A tabela de tiers da decisão 5 vai de três para quatro linhas, com o Master Dev Tier.
- `CommunityTier.price` sai do modelo (decisão 1 desta spec). As decisões 5b, 5c e 5d de lá continuam
  **integralmente vigentes** — a 5d, em particular, é a restrição que impede esta spec de inventar um
  gate por `grade`.

### Spec 005 (Autenticação e Dashboard) — vigente, estendida
O `AuthStore` ganha `role` e `isAdmin`; o aside ganha três itens e perde dois `disabled`.

### Spec 004 (Acesso Antecipado) — vigente, rebaixada na hierarquia visual
A lista de espera **sai das páginas públicas** (alteração de escopo no topo). O endpoint, a coleção e a
spec 004 continuam de pé: some o caminho até o formulário, não o que já foi coletado.

### Spec 003 (Comunidade) — continua Deprecated
Nada muda aqui.

### Spec 010 (Mural de Perguntas) — estende esta
Escrita depois, e citada aqui para quem ler esta primeiro não implementar a trilha sem saber o que vem:
a página da insígnia ganha as abas **Aulas** e **Perguntas Frequentes**, a tela de usuários do admin
ganha o campo `tier` ao lado do `grade`, e o aside ganha o **Mural**. A decisão 6 desta spec — trilha
não travada, insígnia vazia abre e avisa — continua valendo, e a aba de Perguntas Frequentes vazia segue
o mesmo padrão.

---

## Pontos em aberto

1. **O `/comunidade` continua existindo depois disto?** Ele ficou sendo a página de tiers, e sem preço
   sobra a trilha e a Grinding Arena — que a landing também conta. Escrito aqui como: continua, com os
   tiers sem preço. Vale reavaliar quando o Financeiro estiver de pé.
2. **O que a Grinding Arena mostra no lugar do preço?** Ela tem `price` próprio no modelo, exibido em
   `/comunidade`. Assumido: mesmo tratamento dos tiers — some da página, aparece no Financeiro dentro
   do Ultra e do Master.
3. **A mensagem do WhatsApp de upgrade é pré-preenchida com qual texto?** Assumido: *"Quero o <Tier>"*,
   com o nome do tier.
4. **Insígnia com vídeo mas ainda não conquistada mostra algo diferente?** Assumido: não. O cartão diz o
   estado, o conteúdo abre igual. Gate só quando existir assinatura.

---

## Resultado da execução (2026-08-18)

Sete fases, todas verdes: **199 testes** no Karma, `ng build` limpo, e a varredura do bundle de
produção atrás de valor monetário voltando **zero**.

> Uma armadilha na própria verificação, registrada porque custou tempo: varrer `dist/` inteiro com um
> padrão frouxo dá falso positivo. `dist/test-out/` guarda a saída do Karma, e o `INJECTOR$1` do
> Angular casa com `R$ ?\d`. A varredura que vale é sobre `dist/eduleno-front/` e com o padrão de
> valor completo — `R$ ?\d+[.,]\d{2}`.

### O que ficou de fora, e por quê

- **Arrastar e soltar na reordenação de vídeos** (Fase 06, Task 09). A decisão 7 já dizia que nada
  pode depender dele: os botões de subir/descer são o mecanismo primário e entregam a operação
  inteira, no dedo, no teclado e no leitor de tela. Entra quando houver demanda de quem administra no
  desktop.
- **Editar `tier` na tela de usuários** (Fase 06, Task 05). O campo não existe ainda — quem o cria é a
  **spec 010**, que precisa dele para o portão do Mural. Fazer a tela antes do campo seria escrever
  contra um dado imaginário.
- **Verificação em aparelho real** (Fase 07, Task 07). Precisa de um celular na mão; as regras de
  movimento existem por causa do aparelho fraco, e verificar no desktop é não verificar.

### Uma coisa que a execução ensinou

O `Intl.NumberFormat('pt-BR')` separa o símbolo do valor com **NBSP (U+00A0)**, não com espaço comum.
Um teste que compara com `'R$ 260,00'` digitado à mão falha por um caractere invisível. Onde a
asserção é sobre texto renderizado, o jeito legível é normalizar antes de comparar — está assim em
`financeiro.page.spec.ts`, com o comentário explicando.

### Ponto em aberto que a execução criou

**O upgrade abre o LinkedIn, não o WhatsApp.** O ponto em aberto 3 presumia uma mensagem
pré-preenchida (*"Quero o &lt;Tier&gt;"*), e ela precisa de um canal que aceite texto na URL. O único
contato configurado hoje é o LinkedIn, onde `?text=` não existe — inventar o parâmetro produziria um
link quebrado. O rótulo do botão já carrega o nome do tier, então a pessoa chega à conversa sabendo o
que pedir. Configurar um número de WhatsApp resolve, e a mudança é de uma linha.

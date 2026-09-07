# Spec 019: Vídeos Assistidos, XP e o Cartão do Membro

> **Emendada pela spec 023 (Arena de Treinamento).** O XP deixou de ter uma fonte só. A
> propriedade auditável desta spec — `xp` igual a `XP_PER_VIDEO` vezes a contagem de
> `watched_videos` — passa a valer como soma de três parcelas: vídeos, GYM Challenge e
> treinamentos. Cada parcela continua pagando no máximo uma vez, pelo mesmo mecanismo (caminho
> composto mais `create()` dentro de um `WriteBatch`), mas quem for conferir o total precisa
> saber que são três antes de concluir que o contador divergiu.

## Objetivo
A tela da insígnia lista vídeos e não guarda nada. Quem volta na terça não sabe onde parou na
quinta-feira anterior, e a única resposta que o produto dá para "estou avançando?" é o contador de
insígnias — que sobe de oito em oito semanas, quando sobe.

Esta spec põe três coisas na tela:

| Onde | O quê |
|---|---|
| Tela da insígnia, **abaixo do iframe** | Um check "Já assisti", que o membro marca à mão |
| Painel, **acima do contador de insígnias** | O XP, que sobe 10 a cada vídeo marcado pela primeira vez |
| Mural, no nome do autor | Um clique abre o cartão do membro: nome, bio, insígnia, XP e redes |

E uma quarta, que o cartão obriga a existir: **em Meu Perfil, um interruptor que decide se as redes ficam
visíveis para os outros membros** — desligado até que a pessoa o ligue.

O par desta spec no backend é a **019**, e as duas entram juntas. O XP é calculado lá; aqui não existe
uma multiplicação, e a decisão 1 explica por quê.

---

## Numeração
Os números são iguais nos dois repositórios: 017 é Respostas em Retrato, 018 é Termos e Privacidade, 019
é esta.

---

## Decisões

### 1. O front não sabe quanto vale um vídeo
O `xp` chega pronto em três lugares — no `GET /me`, na resposta do `PUT` que marca o vídeo, e no cartão
de cada membro. **O número 10 não existe neste repositório.**

A tentação aparece no segundo em que o check é clicado: somar 10 no signal e não esperar a resposta. Ela
é errada por um motivo específico, e não por purismo — **remarcar um vídeo não paga XP nenhum** (decisão 2
da 019 do backend). A soma local acertaria no primeiro clique de cada vídeo e erraria em todos os
seguintes, e o erro é invisível: o número fica alto, ninguém confere, e a primeira pessoa a notar é a que
recarrega a página e vê o XP cair.

É a mesma regra da `orientation` da spec 017 e da `phase` do Mural. **O servidor afirma, a tela obedece.**

### 2. O check é otimista, mas o XP não
Duas coisas mudam quando o membro clica, e elas têm origens diferentes:

| O que muda | De onde vem | Quando |
|---|---|---|
| O estado do check | do próprio clique | **na hora**, otimista, com reversão se o `PUT` falhar |
| O XP do painel | do corpo da resposta | **quando a resposta chega** |

O check é otimista porque é a reação direta a um toque, e um check que espera 400 ms de rede parece
travado no celular — e quem duvida clica de novo. O XP não é, porque ele não é reação a nada: é um número
que o servidor calculou, e chutá-lo é a decisão 1 sendo violada no único lugar em que ela é fácil de
violar sem perceber.

Se o `PUT` falhar, o check volta ao que era e uma linha discreta aparece. Nada de modal: falhar em marcar
um vídeo não é evento que mereça interromper a leitura.

### 3. Um `WatchedStore`, porque o XP mora numa tela e é alterado em outra
O check é clicado em `/dashboard/trilha/:badgeId`. O selo de XP vive no painel, em `/dashboard`. As duas
telas não se conhecem e nunca se conhecerão.

O `xp` já mora no `MemberProfile` do `AuthStore`, que o painel lê. Então a tela da insígnia **não guarda
XP nenhum**: ela chama o serviço, recebe o número novo e o escreve no `AuthStore` pelo método
`setXp(valor)`. Quando o membro volta ao painel, o selo já está certo, sem uma requisição a mais.

**Uma fonte, e é a que já existia.** Um segundo signal de XP em qualquer componente seria o que fica velho
na navegação de volta — e o sintoma seria o painel mostrando o XP de antes de o membro assistir a três
vídeos.

### 4. O check fica abaixo do iframe, e a proporção do vídeo não o alcança
Ele vai **fora** do `video__frame`, logo depois. Dentro, ele herdaria a caixa de proporção — a mesma que a
spec 017 usa para 9:16 e 16:9 — e um check dentro de uma caixa de proporção fixa é um check que muda de
tamanho conforme o vídeo é retrato ou paisagem.

E ele é um `input[type="checkbox"]` de verdade, com `label`, não um `div` com `click`. Ganha de graça o
foco por teclado, o espaço para alternar, o anúncio de "marcado" no leitor de tela e o alvo de toque que o
`label` estende para o texto inteiro — quatro coisas que uma reimplementação faz pela metade.

O rótulo é **"Já assisti"** e não "Marcar como assistido": a frase é do membro sobre si mesmo, não uma
instrução do sistema. Marcado, vira **"Assistido"**.

### 5. Desmarcar não devolve XP, e a tela precisa dizer isso antes do clique
O hint abaixo do check diz, em uma linha: *"Os 10 XP são seus para sempre — desmarcar só tira o check."*

Sem ela, o comportamento parece bug. Alguém desmarca esperando ver o número cair, ele não cai, e a
conclusão razoável é que a tela está quebrada. **A frase é mais barata que a dúvida**, e ela existe porque
a regra é deliberada (decisão 2 da 019 do backend), não porque o produto tem vergonha dela.

### 6. O interruptor das redes fica encostado nas redes, e o rótulo diz a verdade
Ele entra **dentro do bloco "Suas redes"** de Meu Perfil, logo abaixo dos campos de LinkedIn e Instagram.
Não numa seção "Privacidade", não numa aba, não numa tela de configurações.

A razão é a decisão 9 da 019 do backend: o padrão é **desligado**, e no dia do lançamento todo cartão abre
sem redes. Um interruptor desligado numa seção que ninguém abre é um recurso que não existe. Encostado nos
campos, ele é encontrado por quem já foi até ali para mexer nos links — que é exatamente a pessoa que quer
que eles sejam vistos.

**O rótulo é "Mostrar minhas redes para os outros membros"**, e o hint diz o que ele não faz: *"A
administração da Liga Dev continua vendo seus links, como vê seu e-mail e telefone."* Chamar isso de
"privado" seria vender uma garantia que não existe (decisão 10 do backend), e teatro de privacidade é pior
que ausência dela, porque alguém confia nele.

Ele grava sozinho, no clique, como o interruptor de e-mails ao lado — **não entra no formulário de redes**
e não espera "Salvar redes". Um interruptor que precisa de submit é um interruptor que fica meio ligado.

### 7. O cartão é modal, e não rota
Clicar no nome do autor abre um modal por cima do Mural. Não navega, não troca de URL, não perde a
rolagem, não perde o filtro de aba.

Ler quem é a pessoa é um desvio de dois segundos no meio da leitura do Mural — e uma rota faria o retorno
custar um `history.back()` que devolve a lista no topo. **É o mesmo julgamento do
`LegalAcceptDialog`** (spec 018, decisão 3): documento longo em modal, porque quem o abre está no meio de
outra coisa.

O preço: o cartão não é compartilhável por link. Está aceito — não há nada aqui que alguém queira enviar
para outra pessoa.

### 8. O nome só é clicável quando há para onde clicar
O backend manda `authorUid: string | null`, e **`null` é a pergunta anonimizada** de quem excluiu a conta
(decisão 11 do backend).

Quando é `null`, o nome é texto e mais nada — sem cursor de link, sem foco por teclado, sem `role`. Não
existe um "clicou e deu erro": o alvo não existe.

**O front não conhece o valor sentinela do backend**, não compara com string nenhuma e não tem constante
de uid anônimo. Ele testa se o campo é nulo. Uma comparação de sentinela aqui é o tipo de linha que
sobrevive a uma renomeação no backend e vira um cartão `404` em cima da pergunta de quem pediu para ser
esquecido.

### 9. O cartão pede seus dados ao abrir, sempre
Nenhum cache. Abrir o cartão da mesma pessoa duas vezes faz duas requisições.

O que está lá dentro muda — XP sobe, bio é editada, o interruptor das redes é ligado — e um cache faria a
tela mostrar o estado de dez minutos atrás sem nada que denunciasse. O ganho seria uma requisição num
gesto que acontece talvez três vezes por sessão.

**E `404` tem texto próprio:** *"Esse membro não faz mais parte da comunidade."* É o que acontece quando
alguém exclui a conta com o Mural aberto na outra aba, e é uma frase, não um erro genérico.

### 10. O selo de XP fica acima do contador de insígnias, e não do lado
No painel, a linha do cabeçalho já tem o nome à esquerda e o `BadgeCount` à direita. O XP entra **empilhado
sobre o contador**, na mesma coluna à direita.

Ao lado, os dois viram uma fileira de números que competem — e o contador de insígnias é o que conta a
história do produto (a Liga Dev, a Elite Four, a spec 008). O XP é o número menor: ele mede o esforço da
semana, e o contador mede a conquista. **A hierarquia visual diz isso**: XP menor, em cima; insígnia
maior, embaixo.

Componente próprio, `XpCount`, burro como o `BadgeCount` — recebe `xp` e desenha. Não sabe de onde veio,
não sabe quanto vale um vídeo, não formata regra nenhuma.

### 11. Zero `localStorage` para o que foi assistido
O check vem do servidor, em toda listagem, e vai para o servidor, em todo clique.

Guardar localmente teria a falha nas duas direções, e é a mesma da decisão 9 da spec 018: navegador limpo
faria quem já assistiu ver tudo desmarcado, e um estado gravado por engano esconderia para sempre um vídeo
que a pessoa quis marcar. **O XP é dado do membro, e dado do membro não mora no navegador dele.**

---

## Telas

| Rota / lugar | O que muda |
|---|---|
| `/dashboard` | Selo de XP acima do `BadgeCount` |
| `/dashboard/trilha/:badgeId` | Check "Já assisti" abaixo de cada iframe, nas duas abas |
| `/dashboard/mural` | Nome do autor clicável; modal `MemberCardDialog` |
| `/dashboard/perfil` | Interruptor "Mostrar minhas redes", dentro de "Suas redes" |

---

## Fora de escopo

- **Barra de progresso da insígnia** ("4 de 7 assistidos"). O dado já está na tela — os checks são
  visíveis — e um segundo indicador dizendo a mesma coisa em outro formato é a próxima coisa a divergir.
  Fácil de acrescentar depois, difícil de tirar.
- **Ranking ou comparação entre membros.** Decisão de produto, e ela está escrita na 019 do backend.
- **Cartão do membro em outros lugares** — na tela da insígnia, no balão da pergunta respondida (spec
  017), no aside. O Mural é onde os nomes aparecem em quantidade e onde a curiosidade acontece. Os outros
  entram quando alguém pedir.
- **Animação de "+10 XP" subindo do check.** Boa ideia, e ela depende de o XP ser previsível localmente —
  que é exatamente o que a decisão 1 recusa. Se um dia entrar, quem anima é a diferença entre o número
  antigo e o que o servidor devolveu, nunca um `+10` chutado.
- **Marcar todos os vídeos da insígnia de uma vez.** Um botão que paga XP em lote é o farm da decisão 1 do
  backend com interface própria.
- **Sincronizar entre abas.** Duas abas abertas mostram estados diferentes até a próxima carga. É o
  comportamento de todo o resto do produto.

---

## Specs afetadas

### Spec 009 (Trilha) — vigente, estendida
`BadgeVideo` ganha `watched`. A ordem continua vindo do servidor e o front continua **não reordenando**.

### Spec 010 e 016 (Mural) — vigentes, estendidas
`MuralQuestion` ganha `authorUid: string | null`, e o `QuestionCard` ganha um `output` de clique no nome.
Ele continua sendo **componente burro**: não decide fase, não compara `weekId`, e agora também **não abre
o modal** — ele emite, e quem abre é a página do Mural. Um componente de cartão que injeta serviço para
buscar membro é o que impede o Mural de ser testado sem HTTP.

### Spec 013 (Meu Perfil) — vigente, estendida
O bloco "Suas redes" ganha o interruptor. O formulário de redes não muda: os campos continuam salvando por
submit, e o interruptor continua salvando por clique — **são duas gravações diferentes no mesmo bloco**, e
a decisão 6 explica por que não viram uma.

### Spec 017 (Respostas em Retrato) — vigente
O check entra **fora** do `video__frame`, e a decisão 4 diz por quê. A caixa de proporção não muda.

### Spec 018 (Termos e Privacidade) — vigente
O `LegalAcceptDialog` é o molde do `MemberCardDialog`: mesmo overlay, mesmo fechamento por `Esc`, mesma
armadilha de foco. **O que não se copia é o rodapé** — o cartão não tem ação, não grava nada e fecha por
onde quiser.

---

## Pontos em aberto

1. **Todo cartão abre sem redes no lançamento.** É o ponto em aberto 2 da 019 do backend visto daqui, e a
   parte que cabe ao front já está feita: o interruptor mora encostado nos campos (decisão 6). Se ainda
   assim ninguém o ligar, a saída **não** é trocar o padrão — é convidar.
2. **O cartão não diz há quanto tempo a pessoa está na comunidade**, e é a primeira coisa que alguém vai
   pedir. `createdAt` não está no DTO público de propósito (decisão 8 do backend): campo novo entra por
   escolha escrita, não por conveniência de tela.
3. **O check num vídeo que o membro não pode ver.** Hoje não existe gate de conteúdo — a spec 009 decidiu
   não derivar acesso de `grade`, e `devTierFree` está lá para o dia em que existir. Quando existir, o
   check precisa sumir junto com o player, e não ficar sozinho embaixo de uma caixa trancada.
4. **O XP aparece com um quadro de atraso na primeira carga.** Ele vem do `GET /me`, e não da resposta de
   sessão (decisão de escopo do backend). O painel monta, o `GET /me` chega, o selo aparece. Enquanto não
   chega, o lugar do selo fica vazio — e vazio é melhor que um `0` que pisca e vira `340`.

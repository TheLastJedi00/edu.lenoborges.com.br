# Spec 021: Respostas na Trilha

## Objetivo
Uma resposta hoje só existe na aba **Perguntas Frequentes** da insígnia, e quem está seguindo a trilha nunca
a encontra — a aba fica ao lado, e ninguém troca de aba no meio de uma sequência para conferir se apareceu
algo novo. A resposta que existe justamente para destravar a aula seguinte é a que menos gente vê.

Esta spec deixa o admin **posicionar uma resposta dentro da trilha**, e é uma correção visual: o vídeo já
existe, a API já sabe listá-lo, e o que muda é **como ele aparece**.

Na trilha, uma resposta **não desenha um player**:

```
┌─────────────────────────────────────┐
│ Herança e composição, na prática    │   ← o título da plataforma, como em toda aula
│                                     │
│ "Como saber quando usar herança     │   ← a pergunta, em destaque
│  em vez de composição?"             │
│                                     │
│ Ana Prado · 9 de agosto             │   ← autor e data, na tipografia mono
│                                     │
│  [ Ver a resposta ]                 │   ← o botão que abre o modal
└─────────────────────────────────────┘
```

O vídeo abre **num modal**, em retrato, com o check "Já assisti" embaixo dele.

Do lado do professor, o formulário de resposta ganha **um toggle**. Desligado — o padrão —, tudo acontece
como hoje: a resposta entra na aba de Perguntas Frequentes. Ligado, ela entra no fim da trilha e o admin cai
na etapa de posicioná-la com as setas, exatamente como faz com uma aula.

O par desta spec no backend é a **021**, e as duas entram juntas: o campo `tab` diz em qual lista o vídeo
vive, e sem ele esta tela não tem o que desenhar.

---

## Numeração
Os números são iguais nos dois repositórios, com a exceção conhecida da 008 (Liga Dev, só no front). 019 é
Vídeos Assistidos e XP, 020 é Contatos, Plano em Breve e a Tela de Senha, 021 é esta.

---

## Dependência de ordem
As Fases 02 e 03 consomem o que a spec **021 do backend** entrega — `tab` no `BadgeVideoDto`, `?tab=` no
lugar de `?kind=` nas três rotas, e `tab` aceito no `POST`. A Fase 01 é só de modelo e serviço, e é a que
alinha os nomes: **ela quebra o front com a API antiga**, porque o parâmetro muda de nome nos dois lados ao
mesmo tempo. Backend primeiro.

---

## O que vem pronto do servidor, e por quê

**`tab: 'aula' | 'resposta'`.** A lista em que o vídeo vive, que **não é a mesma coisa que `kind`**. `kind`
continua sendo a natureza — resposta tem pergunta, tem balão, é Short — e `tab` é o endereço. Os dois
divergem em exatamente um caso, e é o desta spec: a resposta posicionada na trilha tem `kind: 'resposta'` e
`tab: 'aula'`.

**`orientation` continua vindo do servidor e continua `retrato` nessas respostas.** O front não deriva
proporção de `kind` nem de `tab` — a decisão 4 da spec 017 não é revogada em nada. O que muda é **onde** o
retrato é pintado: dentro do modal, e não na coluna da trilha.

---

## Decisões

### 1. Na trilha, a pergunta ocupa o lugar do player — e o player vai para um modal
A conta da decisão 3 da spec 017 continua valendo e é o que decide isto: um 9:16 com largura de desktop tem
mais de mil pixels de altura. Numa aba só de respostas, aquilo foi resolvido travando a largura. **Na trilha
não dá para resolver assim**, porque o problema deixa de ser altura e passa a ser ritmo: uma coluna de
cartões 16:9 com um cartão estreito e altíssimo no meio não parece uma sequência, parece um erro de layout.

Além disso, um card de trilha com player é um convite a assistir **ali**, em ordem. A resposta não é etapa da
mesma natureza: ela é a dúvida de alguém, e o que a torna útil na sequência é **a pergunta ser legível de
relance**. Quem já sabe aquilo passa direto; quem tem a mesma dúvida abre.

O modal também paga sozinho um custo que o player embutido tem hoje: **oito iframes do YouTube numa página
são oito players carregados**. No cartão de pergunta não há iframe nenhum até o clique.

### 2. O título continua vindo primeiro, e a pergunta não o substitui
É a decisão 1 da spec 017 outra vez, e ela não muda por o cartão ter mudado de forma: o título é o que o
admin escreveu para a trilha, a pergunta é o que o aluno escreveu para o Mural. **Um cartão que só mostra a
pergunta some da leitura de quem está varrendo a sequência para achar onde parou** — a pergunta é longa, é
específica, e não diz do que a etapa trata.

### 3. O modal é um só, na página, e não um por cartão
Um `<dialog>` por cartão numa lista de doze é doze diálogos no DOM para uma coisa que é singular por
natureza — só um está aberto por vez, sempre. A página guarda `respostaAberta: BadgeVideo | null`, e o
diálogo desenha o que estiver ali.

### 4. O iframe nasce ao abrir e **morre ao fechar**, e isso não é otimização
Um player do YouTube escondido continua tocando. Fechar o modal deixando o iframe no DOM é áudio saindo de
uma página sem vídeo nenhum à vista, e a pessoa procurando qual aba do navegador está falando com ela.

Então o conteúdo do modal fica dentro de um `@if (respostaAberta())`: fechar destrói o elemento, e destruir o
elemento é o único jeito confiável de parar um iframe de terceiros sem falar a API de player dele.

### 5. O check "Já assisti" vai para dentro do modal
No cartão de aula ele fica fora do player, como a spec 019 decidiu. Aqui ele acompanha o vídeo: **o check é o
gesto de quem assistiu, e no cartão de pergunta ainda não houve o que assistir.** Um check no cartão fechado
deixaria marcar sem abrir, o que é ruim; e mais que isso, é XP oferecido a um clique de distância de quem só
estava rolando a página.

Dentro do modal ele é o mesmo componente de sempre — `input[type="checkbox"]` dentro de um `label`, com a
mesma frase dos 10 XP definitivos.

### 6. O cartão fechado diz se já foi assistido, e essa é a consequência da decisão 5
Com o check dentro do modal, quem varre a trilha perde a informação que todo cartão de aula dá de graça. Sem
isso a pessoa abre o modal só para descobrir se já viu — que é exatamente o gesto que a decisão 1 queria
evitar.

Então o cartão de pergunta mostra a marca de assistido, discreta, na mesma tipografia mono do resto. É
leitura, não controle: **desmarcar continua sendo coisa de dentro do modal**, porque a marca no cartão é
resposta a "já vi isso?" e não a botão.

### 7. O balão perde o rabicho quando não há vídeo abaixo
O rabicho da spec 017 existe para dizer que **aquele** vídeo responde **aquela** pergunta, numa lista onde os
dois são blocos vizinhos. No cartão da trilha não há vídeo abaixo: há um botão. O rabicho apontaria para o
botão, o que é uma frase que ninguém quis dizer.

Na aba de Perguntas Frequentes **nada muda**: balão com rabicho, player logo abaixo, exatamente como a 017
desenhou.

### 8. Na aba de respostas, tudo continua como está
A aba de Perguntas Frequentes não ganha modal, não ganha botão e não perde o player embutido. Lá a lista
**é** de respostas, o retrato é a forma da lista inteira, e a decisão 3 da spec 017 já resolveu a largura.

O que a aba passa a ter é menos itens: a resposta posicionada na trilha sai de lá. Uma resposta tem um
endereço.

### 9. O toggle do admin só existe em modo resposta, e nasce desligado
O formulário já tem dois modos (spec 017, decisão 6). O toggle aparece **só** no modo resposta, porque em
modo aula ele não teria significado: aula vive na trilha e ponto.

Nasce desligado, e o padrão é a decisão: o comportamento de hoje continua sendo o que acontece quando
ninguém decide nada. Ligado, ele diz na própria etiqueta o que faz — a resposta entra na trilha e **sai** da
aba de Perguntas Frequentes —, porque "posicionar na trilha" sozinho não diz que é uma troca de lugar.

### 10. Publicar com o toggle ligado leva o admin para a trilha, e não para a lista onde ele estava
Hoje a tela empurra o vídeo novo no fim da lista que está na tela. Com o toggle ligado isso seria **um vídeo
aparecendo na aba errada** — o admin veio da pauta do Mural, está na aba Respostas, e o vídeo foi para a
trilha.

Então a publicação com o toggle ligado **troca para a aba Aulas e recarrega**. É o que a etapa de posicionar
exige de qualquer forma: a lista precisa vir do servidor com as posições certas antes de as setas fazerem
sentido. E uma linha diz onde o vídeo ficou — no fim da trilha — e o que fazer com as setas, porque um vídeo
que aparece no fim de uma lista de doze é um vídeo que a pessoa não vê sem rolar.

### 11. O painel do admin marca quais itens da trilha são respostas
Na lista da aba Aulas, um item com `kind: 'resposta'` é indistinguível de uma aula: os dois mostram título e
id do YouTube. O admin precisa saber o que está movendo — e precisa saber por que aquele item não é uma aula
quando for procurar a aula que ele jurava ter publicado.

Uma etiqueta discreta na linha, e nada mais. Sem coluna nova, sem filtro, sem contagem.

### 12. Nenhuma rota nova, nenhuma tela nova
Duas telas mudam por dentro. O roteador não sabe de nada disso, e **o modal não é uma rota**: uma URL para a
resposta aberta seria um estado a restaurar no F5 e um botão Voltar que fecha o vídeo em vez de sair da
página — para um player que se abre com um clique e se fecha com Esc.

---

## Telas tocadas

| Tela | O que muda |
|---|---|
| `/dashboard/trilha/:badgeId` | Na aba Aulas, o vídeo com pergunta vira cartão de pergunta com "Ver a resposta", e o player abre num modal com o check dentro. A aba Perguntas Frequentes não muda |
| `/dashboard/admin/trilha/:badgeId` | O formulário em modo resposta ganha o toggle. Publicar com ele ligado troca para a aba Aulas e recarrega. A lista da trilha marca quais itens são respostas |

---

## Fora de escopo

- **Mover uma resposta já publicada para a trilha, ou tirar de lá.** O backend não oferece — é a decisão 3 da
  spec 021 de lá — e a tela não inventa. O conserto de um engano é remover e republicar.
- **Uma resposta aparecendo nas duas listas.** Ver a decisão 8.
- **Link direto para a resposta aberta (`?resposta={id}` na trilha do aluno).** Ver a decisão 12.
- **Autoplay ao abrir o modal.** Continua sendo não, pelo mesmo motivo do ponto em aberto 4 da spec 017: o
  gesto de quem abriu é "quero ver", não "toque agora" — e um vídeo que começa sozinho faz procurar o botão
  de parar.
- **Mudar o cartão de aula.** A aula continua exatamente como está, com player embutido e check ao lado.
- **Mudar a aba de Perguntas Frequentes.** Ver a decisão 8.
- **Marcar como assistido a partir do cartão fechado.** Ver a decisão 6.

---

## Specs afetadas

### Spec 017 (Respostas em Retrato) — vigente, com duas emendas de tela
O balão, a foto da pergunta e a proporção vinda de `orientation` continuam inteiros. As emendas: o balão
aparece **sem rabicho** quando não há vídeo abaixo dele (decisão 7), e o retrato passa a ter um segundo lugar
onde é pintado — dentro do modal, com a mesma classe e a mesma folha de estilo.

### Spec 019 (Vídeos Assistidos e XP) — vigente, com uma emenda de tela
A decisão 4 da 019 tira o check de dentro do `video__frame` para ele não herdar a caixa de proporção. Isso
continua valendo — dentro do modal, o check fica **fora** do frame, abaixo dele. O que muda é só onde o bloco
inteiro mora, e a regra de XP não muda em nada: os 10 XP são pagos uma vez e são definitivos.

### Spec 010 (Mural de Perguntas) — vigente
A aba de Perguntas Frequentes continua existindo, com o mesmo texto de vazio convidando para o Mural.

### Spec 009 (Financeiro, Administração e Trilha) — vigente, com uma emenda de tela
A reordenação por setas não muda. A lista da aba Aulas passa a poder conter respostas, e a etiqueta da
decisão 11 é o que torna isso legível.

---

## Pontos em aberto

1. **O cartão de pergunta deveria mostrar a descrição do vídeo?** Escrito como não por ora — a pergunta já é
   texto longo, e a descrição embaixo dela empurraria o botão para fora da primeira dobra no celular. Se
   fizer falta, o lugar dela é dentro do modal, junto do player.
2. **O modal deveria ter navegação entre respostas (próxima, anterior)?** Não. Respostas não são uma
   sequência dentro da sequência, e um "próxima" ali competiria com a ordem da trilha, que é a única ordem
   que a tela promete.
3. **Uma resposta na trilha deveria contar para o progresso da insígnia de forma diferente?** Não existe
   progresso por insígnia hoje além do XP, e o XP já é igual para todo vídeo — é a decisão 6 da spec 021 do
   backend. Quando existir uma barra de progresso, esta pergunta volta.
4. **O que acontece se um dia existir uma resposta na trilha sem `question`?** Hoje é impossível: só a
   publicação desta spec põe resposta na trilha, e ela sempre carrega a pergunta. A tela desenha o cartão
   normal — título e player — quando `question` for nulo, sem estado de erro, que é a mesma escolha da decisão
   9 da spec 017.

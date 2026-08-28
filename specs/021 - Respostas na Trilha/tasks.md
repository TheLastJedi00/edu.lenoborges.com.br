> **Dependência de ordem:** a spec **021 do backend** entra primeiro. A Fase 01 renomeia o parâmetro de
> `?kind=` para `?tab=` nos três lugares em que o front o envia, e **a partir dela o front não conversa mais
> com a API antiga** — não é uma fase neutra como a Fase 01 da spec 017 foi. As Fases 02 e 03 consomem `tab`
> na resposta e no corpo da publicação.

# Fase 01: O contrato na tela [x]
Branch: `feat/021-contrato`

Nenhuma tela muda de aparência. Ao fim desta fase o front sabe dizer em que lista um vídeo vive, e sabe pedir
a publicação de uma resposta que vai para a trilha.

- [x] Task 01: O modelo do vídeo. Arquivo: `src/app/models/track.model.ts`. Objetivo: `BadgeVideoTab =
  'aula' | 'resposta'` e `tab: BadgeVideoTab` em `BadgeVideo`. O comentário registra a frase que evita a
  confusão inteira desta spec — **`kind` é a natureza do vídeo e `tab` é a lista em que ele aparece** — e que
  os dois divergem em exatamente um caso: a resposta posicionada na trilha, com `kind: 'resposta'` e
  `tab: 'aula'`. Registra também que **`orientation` continua saindo do servidor** e não passa a ser derivada
  de `tab`: a decisão 4 da spec 017 não é revogada.
- [x] Task 02: O modelo da publicação. Arquivo: `src/app/models/admin.model.ts`. Objetivo: `tab?:
  BadgeVideoTab` em `CreateVideoRequest`. O comentário registra que ele só é enviado em modo resposta — em
  modo aula ele não teria significado — e que **`kind: 'aula'` com `tab: 'resposta'` é 400 no backend**, o
  terceiro estado incoerente da família que a spec 017 abriu.
- [x] Task 03: O `?tab=` nos três envios. Arquivos: `src/app/services/admin.service.ts`,
  `src/app/services/track.service.ts`. Objetivo: `listVideos`, `reorderVideos` e `TrackService.getVideos`
  passam a mandar `tab` no lugar de `kind`, com o parâmetro renomeado também nas assinaturas — o nome do
  argumento é o que faz a próxima pessoa mandar a coisa certa. O comentário registra a decisão 7 da spec 021
  do backend: **depois dela `?kind=aula` devolveria vídeos cujo `kind` é `resposta`**, e o parâmetro passou a
  nomear a lista, não a natureza.
- [x] Task 04 (TDD + implementação): Os testes dos serviços. Arquivos: `admin.service.spec.ts`,
  `track.service.spec.ts`. Objetivo: os testes que hoje afirmam `?kind=` passam a afirmar `?tab=` — e é
  deliberado que eles **falhem antes de mudar**, porque um teste que não notasse a troca de parâmetro seria um
  teste que não olha a requisição.

  > **Achado na execução:** os specs dos **serviços** não afirmavam `?kind=` — nenhum deles inspecionava
  > a query. Quem afirmava eram os specs das **páginas** (`insignia.page.spec.ts` e
  > `insignia-admin.page.spec.ts`), e foram esses que falharam antes da troca, como previsto. Os testes
  > que faltavam nos serviços foram escritos aqui.

# Fase 02: O cartão de pergunta e o modal [x]
Branch: `feat/021-cartao-e-modal`

A fase que o aluno vê. Ao fim dela, uma resposta posicionada na trilha aparece como pergunta com botão, e o
vídeo abre por cima.

- [x] Task 01: O cartão de pergunta. Arquivos: `pages/trilha/insignia/insignia.page.html`, `.scss`.
  Objetivo: na aba Aulas, um vídeo com `question` desenha **título, balão e o botão "Ver a resposta"**, e
  **nenhum iframe**. Na aba Perguntas Frequentes, tudo continua como está — balão com rabicho e player
  abaixo. A condição é a aba corrente somada à existência de `question`, e não uma leitura de `kind` no
  template: a página já sabe qual lista está mostrando, e essa é a informação mais barata e mais difícil de
  errar que ela tem. Comentário registrando a decisão 2 — **o título continua vindo primeiro**, porque uma
  coluna só de perguntas some para quem está procurando onde parou.
- [x] Task 02: O balão sem rabicho. Arquivo: `insignia.page.scss`. Objetivo: uma classe modificadora que
  desliga o `::after` da spec 017. O comentário diz por quê: o rabicho aponta para o vídeo, e no cartão da
  trilha o que está abaixo é um botão — apontar para ele é dizer uma frase que ninguém quis dizer.
- [x] Task 03: O modal. Arquivos: `insignia.page.html`, `.ts`, `.scss`. Objetivo: um `<dialog>` **único na
  página**, alimentado por `respostaAberta: BadgeVideo | null`, com o player em `video__frame--retrato` — a
  mesma classe e a mesma folha da spec 017, sem uma segunda proporção escrita aqui. Fecha por Esc, por clique
  no botão de fechar, e **devolve o foco ao botão "Ver a resposta" que o abriu**. O conteúdo fica dentro de um
  `@if (respostaAberta())` — comentário registrando a decisão 4: um iframe do YouTube escondido **continua
  tocando**, e destruir o elemento é o único jeito confiável de parar um player de terceiros sem falar a API
  dele.
- [x] Task 04: O check dentro do modal. Arquivos: `insignia.page.html`, `.scss`. Objetivo: o mesmo bloco
  `visto` de hoje — `input[type="checkbox"]` dentro de `label`, a frase dos 10 XP definitivos, a linha de erro
  — abaixo do player e **fora do `video__frame`**, que é a decisão 4 da spec 019 e continua valendo dentro do
  modal. Nada da lógica de `alternarVisto` muda.
- [x] Task 05: A marca de assistido no cartão fechado. Arquivos: `insignia.page.html`, `.scss`. Objetivo: no
  cartão de pergunta, quando `video.watched`, uma marca discreta na tipografia mono. **É leitura, não
  controle**: não é um checkbox, não é clicável, e desmarcar continua sendo coisa de dentro do modal.
  Comentário registrando a decisão 6 — sem ela, a pessoa abre o modal só para descobrir se já viu, que é
  exatamente o gesto que o cartão existe para evitar.
- [x] Task 06 (TDD + implementação): Os testes da tela. Arquivo: `insignia.page.spec.ts`. Objetivo:
  testes-trava de que (a) na aba Aulas, um vídeo com `question` **não renderiza iframe** e renderiza o botão;
  (b) na aba Perguntas Frequentes, o mesmo vídeo renderiza o iframe embutido — as duas abas desenham formas
  diferentes de propósito, e um teste só de uma delas deixa a outra ser "unificada" na próxima refatoração;
  (c) abrir o modal cria o iframe e **fechar o remove do DOM**, que é o teste da decisão 4 e o único jeito de
  provar que o áudio para; (d) um vídeo sem `question` na aba Aulas continua sendo o cartão de aula de sempre,
  com player embutido — o caso do ponto em aberto 4.

# Fase 03: O toggle e a etapa de posicionar
Branch: `feat/021-toggle-do-admin`

A fase que o professor vê. Ao fim dela, publicar uma resposta é escolher entre dois lugares.

- [ ] Task 01: O toggle no formulário. Arquivo: `src/app/components/video-form/video-form.ts`. Objetivo: um
  checkbox `posicionarNaTrilha` que **só existe quando `question()` estiver preenchida** (modo resposta),
  nascendo desligado, e que no `submit` vira `tab: 'aula'` — e nada, quando desligado. A etiqueta diz que é
  uma **troca de lugar**, não uma adição: a resposta entra na trilha e sai da aba de Perguntas Frequentes. O
  comentário registra a decisão 9: em modo aula o toggle não teria significado, e o padrão desligado é o que
  mantém o comportamento de hoje como o que acontece quando ninguém decide nada.
- [ ] Task 02 (TDD + implementação): O teste do formulário. Arquivo: o spec do `VideoForm`. Objetivo:
  testes-trava de que (a) sem pergunta, o toggle **não é renderizado** e `tab` nunca sai no corpo; (b) com
  pergunta e toggle desligado, o corpo tem `kind: 'resposta'` e `questionId` e **não tem `tab`** — o servidor
  deriva, e mandar `tab: 'resposta'` explicitamente seria só ruído; (c) com pergunta e toggle ligado, o corpo
  tem `kind: 'resposta'`, `questionId` e `tab: 'aula'`.
- [ ] Task 03: A etapa de posicionar. Arquivo: `src/app/pages/admin/trilha/insignia-admin.page.ts`.
  Objetivo: no `create`, quando o vídeo criado tiver `tab` diferente da aba corrente, **não empurrar na lista
  em memória**: trocar para a aba do vídeo e recarregar do servidor. Comentário registrando a decisão 10 — o
  empurrão de hoje poria o vídeo na aba errada, e a etapa de posicionar precisa da lista vinda do servidor com
  as posições certas antes de as setas fazerem sentido.
- [ ] Task 04: A linha que diz onde o vídeo ficou. Arquivos: `insignia-admin.page.html`, `.ts`, `.scss`.
  Objetivo: depois de uma publicação que trocou de aba, uma linha dizendo que a resposta entrou **no fim da
  trilha** e que as setas a movem. Some na próxima ação. É a mesma forma dos avisos que a tela já tem — uma
  linha, nunca um modal —, e existe porque um vídeo que aparece no fim de uma lista de doze é um vídeo que a
  pessoa não vê sem rolar.
- [ ] Task 05: A etiqueta de resposta na lista da trilha. Arquivos: `insignia-admin.page.html`, `.scss`.
  Objetivo: na aba Aulas, o item com `kind: 'resposta'` ganha uma etiqueta discreta. Sem coluna nova, sem
  filtro e sem contagem. Comentário registrando a decisão 11: sem ela, o admin move um item sem saber que não
  é aula, e vai procurar a aula que jurava ter publicado.
- [ ] Task 06 (TDD + implementação): Os testes do painel. Arquivo: `insignia-admin.page.spec.ts`. Objetivo:
  testes-trava de que (a) publicar estando na aba Respostas um vídeo que voltou com `tab: 'aula'` **troca a
  aba e refaz o `listVideos`**, e não acrescenta o vídeo à lista na tela — é o bug que a decisão 10 evita, e
  ele é invisível até alguém recarregar a página; (b) publicar uma resposta com `tab: 'resposta'` continua
  fazendo o que faz hoje, sem troca de aba; (c) a etiqueta aparece no item de `kind: 'resposta'` e não no de
  aula.

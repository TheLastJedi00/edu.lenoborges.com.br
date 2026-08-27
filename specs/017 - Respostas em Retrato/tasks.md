> **Dependência de ordem:** as Fases 02 a 04 consomem o que a spec **017 do backend** entrega —
> `orientation` e `question` em `GET /badges/:badgeId/videos`, `kind` e `questionId` aceitos no `POST`, e o
> `?kind=` no `GET` do admin. A Fase 01 é só de modelo e serviço e pode entrar antes. **A Fase 04 depende do
> backend rodando nesta máquina**, e é a mesma ressalva que as specs 015 e 016 registraram.

# Fase 01: O contrato na tela [x]
Branch: `feat/017-contrato`

Nenhuma tela muda. Ao fim desta fase o front sabe descrever uma resposta e sabe pedir a publicação de uma.

- [x] Task 01: O modelo do vídeo. Arquivo: `src/app/models/track.model.ts`. Objetivo:
  `VideoOrientation = 'paisagem' | 'retrato'` e `AnsweredQuestion { id, title, authorName, askedAt }`, com
  `orientation: VideoOrientation` e `question: AnsweredQuestion | null` em `BadgeVideo`. Dois comentários que
  não podem faltar: **`orientation` vem do servidor e não se deriva de `kind`** — derivar aqui espalharia a
  regra por template, folha e teste, e faria o conserto de um caso raro exigir deploy do front; e
  **`question` é uma foto do momento da publicação**, então pode divergir do texto atual da pergunta no
  mural, e é `null` em toda aula e em todo vídeo anterior a esta spec.
- [x] Task 02: O modelo da publicação. Arquivo: `src/app/models/admin.model.ts`. Objetivo: `kind?:
  BadgeVideoKind` e `questionId?: string` em `CreateVideoRequest`. O comentário registra que os dois andam
  juntos nos dois sentidos — **resposta sem pergunta e aula com pergunta são os dois 400 do backend** — e
  que quem garante isso é o modo do formulário, não uma validação espalhada.
- [x] Task 03: O `kind` no serviço do admin. Arquivo: `src/app/services/admin.service.ts`. Objetivo:
  `listVideos(badgeId, kind?)` passa `?kind=` quando recebe a aba, na mesma forma que `TrackService.getVideos`
  já usa. Comentário registrando por que isto entra agora: **a reordenação valida contra uma aba**, e a lista
  misturada que a tela manda hoje passa a levar 400 assim que existir a primeira resposta.
- [x] Task 04: A data por extenso, num lugar só. Arquivo: um utilitário compartilhado — não um método
  privado de página. Objetivo: a função que escreve "9 de agosto", com o ano só quando não for o ano
  corrente. Ela **não existe hoje**: a única formatação de data do produto é o `dataCurta` privado da
  `usuarios.page.ts`, que escreve `dd/mm/aaaa` e não serve aqui. Esta task cria a função exportada e
  **migra o `dataCurta` para ela**, com o formato curto como uma segunda opção da mesma origem. É o momento
  certo de fazer isso, porque esta spec seria a segunda formatação de data — e **duas formatações de data no
  produto é a coisa que o usuário nota e que ninguém procura.**

# Fase 02: O balão e o retrato na trilha [x]
Branch: `feat/017-balao-na-trilha`

A fase que o aluno vê.

- [x] Task 01: A moldura obedece a `orientation`. Arquivos:
  `pages/trilha/insignia/insignia.page.html`, `.scss`. Objetivo: `video__frame--retrato` e
  `video__frame--paisagem`, com a proporção em cada classe e **nenhum `aspect-ratio` inline no template**.
  Comentário na folha registrando por quê: a proporção precisa ser alterável por media query, e um `style`
  inline é exatamente o lugar onde ela deixa de ser.
- [x] Task 02: O retrato não engole a página. Arquivo: `insignia.page.scss`. Objetivo: mobile first — no
  celular o retrato ocupa a largura toda, com teto de altura em `vh` para caber junto do balão; a partir do
  tablet ele para de crescer numa largura fixa e fica **alinhado à esquerda**, sob o balão, e não
  centralizado. Comentário registrando a conta que motiva a decisão 3: 9:16 com largura de desktop dá mais
  de mil pixels de altura, e três respostas viram quatro rolagens.
- [x] Task 03: O balão. Arquivos: `insignia.page.html`, `.scss`. Objetivo: acima do iframe, quando
  `video.question` existir, o bloco com a pergunta em destaque e `autor · data` na tipografia mono, com o
  rabicho apontando para o vídeo. A pergunta entra num `<blockquote>` com `<cite>` para o autor — é citação
  de texto de outra pessoa, e a marcação certa é de graça. O rabicho é `::after` com borda, **e não uma
  imagem**: ele acompanha a cor do tema sem segundo arquivo.
- [x] Task 04: A frase genérica sai. Arquivo: `insignia.page.html`. Objetivo: remover
  *"Resposta a uma pergunta do Mural"*. Quando `question` for `null` num vídeo `resposta` — vídeo anterior a
  esta spec — **não desenhar nada**: sem balão, sem espaço reservado e sem aviso (decisão 9). Comentário
  registrando que um balão vazio explicando dado faltando é pior que a ausência dele.
- [x] Task 05 (TDD + implementação): Os testes da tela. Arquivo: `insignia.page.spec.ts`. Objetivo:
  testes-trava de que (a) vídeo com `orientation: 'retrato'` recebe a classe de retrato e o de paisagem a
  outra — **e o teste não olha `kind`**, que é o que impede alguém "simplificar" derivando a proporção;
  (b) o balão mostra o título da pergunta, o autor e a data por extenso; (c) resposta com `question: null`
  renderiza o cartão **sem balão e sem erro**; (d) o título da plataforma continua aparecendo acima de tudo,
  em resposta e em aula.

# Fase 03: O painel publica resposta [x]
Branch: `feat/017-publicar-resposta`

- [x] Task 01: As abas do painel. Arquivos: `pages/admin/trilha/insignia-admin.page.ts`, `.html`, `.scss`.
  Objetivo: Aulas e Respostas, com o mesmo desenho das abas da trilha do aluno, recarregando por `kind` na
  troca. A reordenação passa a mandar a aba corrente. **Vem primeiro na fase de propósito:** publicar a
  primeira resposta sem isto quebra a reordenação da tela de vez (decisão 8).
- [x] Task 02: O modo do formulário. Arquivo: `components/video-form/video-form.ts`. Objetivo: um `input`
  opcional com a pergunta a responder — `AnsweredQuestion | null`. Preenchido, o formulário está em modo
  resposta e emite `kind: 'resposta'` e `questionId`; nulo, emite exatamente o que emite hoje. A pergunta
  **não é um campo do formulário**: ela é entrada do componente, não é editável, e não participa da
  validação. Comentário registrando que um campo editável ali só criaria a chance de colar um id errado.
- [x] Task 03: O formulário em modo resposta se parece com o resultado. Arquivos: `video-form.ts`
  (template e estilos). Objetivo: a pergunta, o autor e a data no topo, com o mesmo desenho do balão da Fase
  02 — o admin vê o que o aluno vai ver —, o botão dizendo **"Publicar a resposta"**, e o texto de ajuda do
  campo de link dizendo que **link de Shorts serve**. Os três juntos numa task só porque são a mesma
  decisão: o modo muda o formulário inteiro, e não um campo escondido (decisão 6).
- [x] Task 04: A pergunta chega pela URL. Arquivos: `insignia-admin.page.ts`, `.html`. Objetivo: com
  `?resposta={questionId}`, a tela abre o formulário **já aberto e já em modo resposta**. Título, autor e
  data vêm da pauta — a mesma chamada que a tela do mural já faz —, procurando o `questionId` na lista.
  **Sem rota nova:** a pauta é uma leitura que já existe, e criar um "buscar pergunta por id" só para esta
  tela seria um endpoint a mais para um dado que já está na mão. Se o parâmetro apontar para uma pergunta
  que não está na pauta, a tela abre em modo aula e **não** mostra erro: o backend recusaria de qualquer
  jeito, e um erro na abertura da tela por causa de um parâmetro de query é ruído.
- [x] Task 05: O link da pauta carrega a pergunta. Arquivo: `pages/admin/mural/mural-admin.page.html`.
  Objetivo: `[queryParams]="{ resposta: linha.question!.id }"` no `routerLink` que já existe. Uma linha, e é
  a que fecha o caminho da pauta até o vídeo.
- [x] Task 06: A mensagem do 400. Arquivo: `insignia-admin.page.ts`. Objetivo: a mensagem atual sugere que o
  formato do link é o problema, e ela passa a mentir para quem colou um Short — que agora é aceito. Trocar
  por uma que **lista o que serve**, Shorts incluído. Comentário registrando que mensagem de erro que não
  diz o formato aceito faz a pessoa tentar de novo com a mesma coisa.
- [x] Task 07 (TDD + implementação): Os testes do painel. Arquivos: `insignia-admin.page.spec.ts`,
  `components/video-form/video-form.spec.ts` (novo, se não existir). Objetivo: testes-trava de que (a) com
  `?resposta=`, o `POST` sai com `kind: 'resposta'` e o `questionId` da URL; (b) **sem o parâmetro, o corpo
  do `POST` é byte a byte o de antes** — sem `kind`, sem `questionId` —, que é o teste que garante que a
  publicação de aula não mudou; (c) trocar de aba relê a lista com `?kind=` e a reordenação manda a aba
  corrente; (d) o formulário em modo resposta mostra o texto da pergunta.

# Fase 04: Verificação [ ]
Branch: `feat/017-verificacao`

> **Não executada, e o motivo não é falta de tempo.** Não há emulador nesta máquina — o Firebase exige Java
> e ele não está no PATH —, então "o backend rodando" aqui significa **o backend de produção**. E publicar
> um vídeo dispara a notificação da spec 012 **e a campanha de e-mail da 014 para a base inteira**: um
> vídeo de teste sairia na caixa de entrada de todo mundo, e e-mail enviado não volta. As quatro tasks
> abaixo ficam para uma máquina com o emulador, ou para uma sessão em que essa publicação seja intencional.

- [ ] Task 01 (**exige o backend rodando nesta máquina**): O caminho inteiro, no navegador. Objetivo: da
  pauta do mural, clicar em "Cadastrar o vídeo de resposta", colar um link de Shorts real, publicar, e
  conferir na trilha do aluno que o cartão sai com o balão certo e em retrato. É o único lugar onde as duas
  specs 017 se encontram de verdade.
- [ ] Task 02 (**exige o backend rodando**): O retrato em três larguras. Objetivo: conferir o cartão de
  resposta em 360px, em tablet e em desktop largo. O que se procura é o da decisão 3: **o vídeo não pode
  empurrar o balão para fora da tela no celular, e não pode virar uma coluna de mil pixels no desktop.**
- [ ] Task 03 (**exige o backend rodando**): A insígnia mista. Objetivo: uma insígnia com duas aulas e duas
  respostas — trocar de aba, reordenar as respostas, e conferir que **a ordem das aulas não se mexeu**. É a
  prova de que a decisão 8 resolveu o 400 que a primeira resposta teria criado.
- [ ] Task 04: A regressão da aula. Objetivo: publicar uma aula pelo caminho de sempre, sem passar pela
  pauta, e conferir que nada mudou — formulário, mensagem, lista, ordem. Esta spec toca a tela de publicação
  inteira, e **a aula é 100% do que existe publicado hoje.**

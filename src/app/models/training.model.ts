import { QuestionDifficulty } from './games.model';

/**
 * A Arena de Treinamento (spec 023, evoluída pela 025).
 *
 * Desafios práticos de código dentro da trilha, entre a lista de vídeos e o GYM
 * Challenge. Concluir paga o XP do desafio **uma vez, para sempre**; comentar é
 * do Great Tier para cima.
 */
export interface Training {
  readonly id: string;
  readonly badgeId: string;
  readonly title: string;
  readonly description: string;
  /**
   * O resultado esperado do desafio (spec 025).
   *
   * Separado da `description` de propósito: a descrição conta o cenário, e o
   * objetivo diz onde se chega. Enquanto os dois moravam no mesmo texto, o
   * membro lia um parágrafo e adivinhava qual frase era o alvo.
   */
  readonly objective: string;
  /**
   * As dicas de raciocínio, na ordem em que o pensamento caminha (spec 025).
   *
   * **Não é mais o passo a passo da execução**, que era o que `steps` guardava
   * na spec 023: é a dica que o membro abre quando trava, e **cada uma custa
   * 1 XP** do prêmio do desafio. Por isso a ordem importa mais do que antes --
   * abrir a quinta antes da primeira entrega o final da história.
   *
   * A tela **não desenha todas de uma vez**: a dica fechada nem chega ao DOM.
   */
  readonly hints: readonly string[];
  /**
   * O vídeo de apoio, ou nulo quando não há anexo.
   *
   * **É a URL crua, e não o ID do YouTube** — ao contrário de `BadgeVideo`. Lá
   * o vídeo é o conteúdo e a plataforma monta o player; aqui ele é anexo do
   * enunciado, e o admin cola o que tiver na mão.
   */
  readonly videoUrl: string | null;
  /**
   * Quanto este desafio paga, uma vez só.
   *
   * **Vem do servidor e não é constante do front**: o admin pode ter escrito
   * outro valor, e um 30 gravado aqui mentiria no card do desafio que vale 80.
   */
  readonly xpAmount: number;
  readonly position: number;
  /**
   * Se **quem pediu esta lista** já concluiu o desafio.
   *
   * É o único campo que muda de membro para membro. Desafio sem registro chega
   * `false` — não existe "não sei", e a tela não precisa de um terceiro estado.
   */
  readonly completed: boolean;
  /**
   * O que **este membro** enviou ao concluir, ou nulo (spec 027).
   *
   * **So vem em `GET /trainings/:id`, nunca na listagem** -- e por isso e
   * opcional aqui: o `mainCode` chega a 20000 caracteres, e mandar isso por
   * desafio numa lista de vinte seria o corpo de uma tela inteira para desenhar
   * cartoes que nao mostram codigo. Campo ausente na lista, `null` no detalhe de
   * quem nao concluiu.
   *
   * **E a submissao da PRIMEIRA conclusao.** Concluir de novo nao escreve nada, e
   * a tela mostra este valor em leitura em vez de um formulario -- que prometeria
   * uma edicao que nao existe.
   */
  readonly submission?: TrainingSubmission | null;
}

/** O que o membro enviou ao concluir (spec 027). */
export interface TrainingSubmission {
  readonly mainCode: string | null;
  readonly resultImageUrl: string | null;
}

export interface TrainingList {
  readonly badgeId: string;
  /** Já na ordem que o servidor mandou. O front não reordena. */
  readonly trainings: readonly Training[];
}

/**
 * A resposta do admin a um comentário.
 *
 * **É um campo do comentário, e não um item da lista.** A lista é plana, sem
 * fios: cada comentário carrega no máximo uma resposta, e responder de novo
 * sobrescreve a anterior.
 */
export interface TrainingCommentReply {
  readonly content: string;
  /** Quem respondeu, fotografado na data da resposta. */
  readonly authorName: string;
  /** ISO 8601. */
  readonly repliedAt: string;
}

export interface TrainingComment {
  readonly id: string;
  readonly trainingId: string;
  /**
   * O nome de quem escreveu, **fotografado na criação**.
   *
   * Uma troca de nome no perfil não reescreve comentário antigo, e isso é o
   * certo: é o nome de quem escreveu naquele dia. **Não vem `uid`** — o
   * identificador serve para apagar o que é da pessoa quando ela pede para ser
   * esquecida, e para nada mais.
   */
  readonly authorName: string;
  readonly content: string;
  /** Nulo enquanto ninguém respondeu, que é o estado da grande maioria. */
  readonly adminReply: TrainingCommentReply | null;
  /** ISO 8601. */
  readonly createdAt: string;
}

export interface TrainingCommentList {
  /** Mais recentes primeiro. */
  readonly comments: readonly TrainingComment[];
  /**
   * O cursor da próxima página, ou nulo quando acabou.
   *
   * **Nulo é o que apaga o botão "Mostrar mais"**: um botão que devolve lista
   * vazia é um botão que mente.
   */
  readonly nextCursor: string | null;
}

/**
 * A resposta de `POST /trainings/:id/complete`.
 *
 * **O `xp` vem daqui, calculado pelo servidor.** Somar o `xpAmount` localmente
 * para a tela responder mais rápido acerta no primeiro clique de cada desafio e
 * erra em todos os seguintes — concluir de novo paga zero —, e o erro só aparece
 * quando alguém recarrega a página e vê o número cair. É a mesma armadilha do
 * `WatchedVideoResult` da spec 019.
 */
export interface TrainingCompletionResult {
  readonly trainingId: string;
  readonly completed: boolean;
  /** Quanto **esta chamada** pagou. Zero quando o desafio já estava concluído. */
  readonly xpAwarded: number;
  /** O total do membro depois da escrita. É este número que a tela pinta. */
  readonly xp: number;
}

/**
 * O corpo da conclusao de um desafio (spec 027).
 *
 * **Os tres sao opcionais, e isso e decisao.** O front e o back entram juntos mas
 * nao sobem no mesmo segundo, e na janela entre os dois deploys a tela antiga manda
 * `{}`. Com campo obrigatorio, essa janela seria um 400 em cima de quem acabou de
 * concluir um desafio.
 *
 * **Virou objeto em vez de argumentos posicionais** (era `complete(id, hintsUsed)`):
 * com tres campos, a ordem posicional e um lugar a mais para trocar dois valores do
 * mesmo tipo sem o compilador notar.
 */
export interface CompleteTrainingRequest {
  readonly hintsUsed?: number;
  /** O conteudo da classe `main`, colado pelo membro. Qualquer tier. */
  readonly mainCode?: string;
  /**
   * A URL que `POST /trainings/:id/result-image` devolveu.
   *
   * **Exclusiva do Great Dev Tier em diante**, e a API recusa qualquer URL que ela
   * mesma nao tenha cunhado para este membro e este desafio.
   */
  readonly resultImageUrl?: string;
}

/** A resposta de `POST /trainings/:id/result-image` (spec 027). */
export interface ResultImageResponse {
  readonly resultImageUrl: string;
}

export interface CreateTrainingRequest {
  readonly title: string;
  readonly description: string;
  readonly objective: string;
  readonly hints: readonly string[];
  readonly videoUrl?: string;
  readonly xpAmount?: number;
}

export type UpdateTrainingRequest = Partial<CreateTrainingRequest> & {
  readonly position?: number;
};

export interface CreateCommentRequest {
  readonly content: string;
}

/**
 * O pedido de geração por IA (spec 025).
 *
 * Espelha o `GenerateQuestionsRequest` de `games.model.ts`, inclusive no
 * `difficulty`, que reusa o mesmo tipo: são as mesmas três opções na mesma
 * tela de admin, e um segundo tipo idêntico divergiria na primeira mudança.
 */
export interface GenerateTrainingsRequest {
  readonly prompt: string;
  readonly difficulty: QuestionDifficulty;
  /** O teto é 10, e não 30 como nas questões: um treinamento é bem maior. */
  readonly count: number;
}

/** Um treinamento proposto pela IA. **Sem `id`, porque nada foi gravado.** */
export interface TrainingInput {
  readonly title: string;
  readonly description: string;
  readonly objective: string;
  readonly hints: readonly string[];
}

/**
 * O rascunho da IA (spec 025).
 *
 * **Nada foi gravado.** O que existe aqui é uma proposta; o que a torna
 * treinamento é o admin clicar em salvar, e aí a página dispara um
 * `POST /admin/badges/:badgeId/trainings` por rascunho aprovado -- **não existe
 * rota de `bulk` para treinamentos**.
 */
export interface GeneratedTrainings {
  readonly trainings: readonly TrainingInput[];
  /**
   * Quantos o modelo devolveu fora do formato e foram descartados.
   *
   * **A tela precisa mostrar este número**: sem ele, um rascunho de 3 quando se
   * pediu 5 parece um limite do produto em vez de um modelo que errou.
   */
  readonly discarded: number;
}

export interface ReorderTrainingsRequest {
  /**
   * A lista **inteira** de ids na ordem nova.
   *
   * Precisa bater exatamente com o conjunto que existe: o backend recusa com
   * 400 se faltar, sobrar ou repetir, antes de qualquer escrita.
   */
  readonly orderedIds: readonly string[];
}

export interface AdminReplyRequest {
  readonly content: string;
}

/**
 * Uma linha do painel centralizado do admin.
 *
 * Carrega o comentário e o mínimo do treinamento para a tela dizer de onde ele
 * veio. `trainingTitle` nulo significa desafio já excluído — o que não deveria
 * acontecer, porque a exclusão apaga os comentários, e é por isso que vale
 * saber.
 */
export interface AdminTrainingComment extends TrainingComment {
  readonly trainingTitle: string | null;
  readonly badgeId: string | null;
}

export interface AdminTrainingCommentList {
  readonly comments: readonly AdminTrainingComment[];
}

/**
 * A Arena de Treinamento (spec 023).
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
   * Os passos a executar, na ordem.
   *
   * É um array, e não um texto com quebras de linha: a tela desenha um `<ol>`
   * semântico. Achatá-lo aqui empurraria a numeração para o CSS.
   */
  readonly steps: readonly string[];
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

export interface CreateTrainingRequest {
  readonly title: string;
  readonly description: string;
  readonly steps: readonly string[];
  readonly videoUrl?: string;
  readonly xpAmount?: number;
}

export type UpdateTrainingRequest = Partial<CreateTrainingRequest> & {
  readonly position?: number;
};

export interface CreateCommentRequest {
  readonly content: string;
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

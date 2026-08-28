/**
 * O Mural de Perguntas (spec 010).
 *
 * O ciclo tem duas semanas vivas ao mesmo tempo: uma recebendo perguntas, a
 * outra recebendo votos. As fases chegam derivadas do servidor — o front nunca
 * as calcula a partir do relógio local.
 */

export type MuralPhase = 'coleta' | 'votacao' | 'encerrada';

/**
 * Para onde o admin pode adiantar uma pergunta (spec 016).
 *
 * **Separado de `MuralPhase` porque `'coleta'` não é um destino possível**: a
 * promoção é de mão única e a API recusa despromover na própria validação. Um
 * tipo que aceita o que a API recusa é um `if` esperando para ser esquecido.
 */
export type PromotionTarget = 'votacao' | 'encerrada';

/**
 * De onde uma linha da pauta veio (spec 016).
 *
 * `voto` é a vencedora da semana, escolhida pela comunidade; `adiantada` é a
 * que o admin empurrou. Sem o rótulo, a tela não distingue a escolha da
 * comunidade da do próprio admin — e as duas pedem vídeos de peso diferente.
 */
export type WinnerOrigin = 'voto' | 'adiantada';

export interface MuralQuestion {
  readonly id: string;
  readonly weekId: string;
  readonly phase: MuralPhase;
  readonly badgeId: string;
  /** Primeiro nome de quem perguntou, de quando perguntou. */
  readonly authorName: string;
  /**
   * O uid do autor, para abrir o cartão dele (spec 019).
   *
   * **`null` é a pergunta anônima**, de quem excluiu a conta — e o nome só é
   * clicável quando este campo existe.
   *
   * O front **não conhece o valor sentinela do backend**, não compara com string
   * nenhuma e não tem constante de uid anônimo: ele testa se o campo é nulo. Uma
   * comparação de sentinela aqui sobrevive a uma renomeação do outro lado e vira
   * um cartão 404 em cima da pergunta de quem pediu para ser esquecido.
   */
  readonly authorUid: string | null;
  readonly title: string;
  readonly body: string | null;
  readonly voteCount: number;
  readonly hasVoted: boolean;
  readonly isMine: boolean;
  readonly answerVideoId: string | null;
  /**
   * O adiantamento do admin, quando houve (spec 016).
   *
   * **Não substitui `phase` e não se deriva dela.** `phase` diz onde a pergunta
   * está; `promotedTo` diz se ela chegou lá pelo relógio ou pela mão do admin.
   * Sem o segundo, a tela não tem como escrever "Adiantada" nem como saber qual
   * botão de promoção ainda faz sentido — e deduzir um do outro, ou do
   * `weekId`, seria reimplementar a regra do lado errado, com o mesmo
   * resultado: um cartão desenhado como coleta com voto aberto por baixo.
   */
  readonly promotedTo: PromotionTarget | null;
  /**
   * Quando a pergunta foi feita, em ISO 8601 (spec 017).
   *
   * **Não é o `weekId`**: aquele é o domingo que abre a semana, e a pergunta
   * pode ter nascido na quinta. É esta data que vai no balão da resposta, na
   * trilha e na pré-visualização do painel.
   */
  readonly createdAt: string;
}

export interface MuralState {
  readonly currentWeekId: string;
  readonly votingWeekId: string;
  /** Instante da virada, em UTC. É meia-noite em São Paulo, não em UTC. */
  readonly currentWeekEndsAt: string;
  /**
   * Se o usuário pode escrever nesta semana.
   *
   * **Vem pronto da API, e o front NÃO recalcula a regra a partir do `tier`.**
   * Duas implementações da mesma regra divergem na primeira exceção — e aqui a
   * regra já tem duas partes: ser pagante e ainda não ter perguntado.
   */
  readonly canAsk: boolean;
  readonly myQuestionId: string | null;
  /**
   * A pergunta desta semana, inteira.
   *
   * É dela que o formulário de edição se preenche. Sem ela, quem clica em
   * "Editar minha pergunta" abre um formulário em branco e reescreve tudo do
   * zero — inclusive a insígnia obrigatória, que o `PUT` nem envia.
   *
   * `myQuestionId` continua ao lado dela: é um campo e não uma estrutura, a
   * tela ainda o usa para decidir qual botão mostrar, e tirá-lo agora é churn.
   */
  readonly myQuestion: MuralQuestion | null;
}

/**
 * Uma linha da pauta: o que está esperando vídeo.
 *
 * A lista tem duas origens desde a spec 016 — as vencedoras das semanas
 * encerradas e as perguntas que o admin adiantou para responder. Separar em
 * duas listas faria a tela perguntar ao leitor uma coisa que ele não precisa
 * decidir.
 */
export interface MuralWinner {
  readonly weekId: string;
  /** Nulo quando a semana passou em branco. Não é erro, é informação. */
  readonly question: MuralQuestion | null;
  readonly origem: WinnerOrigin;
}

export interface CreateQuestionRequest {
  readonly badgeId: string;
  readonly title: string;
  readonly body?: string;
}

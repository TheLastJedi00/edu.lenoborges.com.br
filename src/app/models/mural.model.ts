/**
 * O Mural de Perguntas (spec 010).
 *
 * O ciclo tem duas semanas vivas ao mesmo tempo: uma recebendo perguntas, a
 * outra recebendo votos. As fases chegam derivadas do servidor — o front nunca
 * as calcula a partir do relógio local.
 */

export type MuralPhase = 'coleta' | 'votacao' | 'encerrada';

export interface MuralQuestion {
  readonly id: string;
  readonly weekId: string;
  readonly phase: MuralPhase;
  readonly badgeId: string;
  /** Primeiro nome de quem perguntou, de quando perguntou. */
  readonly authorName: string;
  readonly title: string;
  readonly body: string | null;
  readonly voteCount: number;
  readonly hasVoted: boolean;
  readonly isMine: boolean;
  readonly answerVideoId: string | null;
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
}

export interface MuralWinner {
  readonly weekId: string;
  /** Nulo quando a semana passou em branco. Não é erro, é informação. */
  readonly question: MuralQuestion | null;
}

export interface CreateQuestionRequest {
  readonly badgeId: string;
  readonly title: string;
  readonly body?: string;
}

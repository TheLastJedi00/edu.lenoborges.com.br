/**
 * Os tipos de Jogos, GYM Challenge e Ranking (spec 022).
 *
 * **Nenhum tipo aqui carrega a resposta certa antes de a pergunta ser
 * respondida.** `RoundQuestion` tem três campos e a ausência do quarto é o
 * ponto: num questionário, o gabarito no tráfego é cola. O que a tela recebe
 * depois de responder é o `correctAlternativeIndex` do `AnswerResult`, e só
 * então.
 *
 * **E nenhum tipo carrega a fórmula de XP.** O front mede o tempo e manda o
 * `clientElapsedMs`; o servidor decide o resto. É a mesma regra do
 * `XP_PER_VIDEO` da spec 019: o servidor afirma, a tela obedece.
 */

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Os quatro estados do card do GYM Challenge.
 *
 * **Quatro, e não três.** A spec descreve três condições de entrada — sem
 * questões, sem XP, pode jogar — e a tela precisa de um quarto valor para quem
 * já conquistou: um `disponivel` com `badgeUnlocked: true` obrigaria todo
 * template a combinar dois campos para escolher a cor da borda, e o primeiro que
 * esquecesse mostraria "Iniciar GYM Challenge" para quem já terminou.
 */
export type ChallengeStatus =
  | 'em-breve'
  | 'xp-insuficiente'
  | 'disponivel'
  | 'conquistada';

export interface RoundState {
  readonly round: number;
  readonly difficulty: QuestionDifficulty;
  readonly passed: boolean;
  /** Acertos da última tentativa consolidada, ou `null` se nunca jogou. */
  readonly score: number | null;
}

export interface ChallengeState {
  readonly badgeId: string;
  readonly badgeTitle: string;
  readonly status: ChallengeStatus;
  readonly currentRound: number;
  readonly rounds: readonly RoundState[];
  /** XP mínimo para participar. Zero é sem exigência. */
  readonly requiredXp: number;
  /**
   * O XP do membro **agora**, para a barra de progresso do card.
   *
   * Vem daqui e não do `AuthStore` para a barra não desenhar com um número
   * velho: o store só se atualiza no `GET /me`, e o card pode abrir depois de
   * uma rodada inteira ter sido jogada em outra aba.
   */
  readonly currentXp: number;
  readonly badgeUnlocked: boolean;
  /** Há rodada aberta: é o que troca "Iniciar" por "Continuar". */
  readonly hasActiveRound: boolean;
  /** A próxima rodada é treino e não paga XP (decisão 17 do front). */
  readonly replay: boolean;
}

export interface ChallengeList {
  readonly challenges: readonly ChallengeState[];
}

/**
 * Uma questão como o membro a recebe.
 *
 * **Três campos, e a ausência do quarto é o desenho.** Sem `correctIndex`, sem
 * `correctAlternativeIndex` e sem o id da questão — o `answer` a identifica pelo
 * `index` da rodada.
 */
export interface RoundQuestion {
  /** A posição na rodada, de 0 a 9. É por ele que a resposta é enviada. */
  readonly index: number;
  readonly question: string;
  /** Já embaralhadas pelo servidor: a ordem aqui é a ordem da tela. */
  readonly alternatives: readonly string[];
}

export interface StartedRound {
  readonly round: number;
  readonly difficulty: QuestionDifficulty;
  /** Rodada de treino: nenhuma questão paga XP, e a tela mostra o selo. */
  readonly replay: boolean;
  readonly questions: readonly RoundQuestion[];
}

/**
 * O que o front envia ao responder.
 *
 * O `clientElapsedMs` é medido com `performance.now()`, **nunca derivado do
 * contador visual**: aquele acumula erro de `setInterval` e é estrangulado pelo
 * navegador em aba de fundo, e o tempo roubado sairia do XP do membro.
 */
export interface AnswerRequest {
  readonly questionIndex: number;
  readonly chosenIndex: number;
  readonly clientElapsedMs: number;
}

export interface AnswerResult {
  readonly correct: boolean;
  /** Qual era a certa **nesta rodada**, já na ordem embaralhada da tela. */
  readonly correctAlternativeIndex: number;
  /** O XP desta questão. Zero quando erra, e zero no modo treino. */
  readonly xpAwarded: number;
  readonly replay: boolean;
  /**
   * O XP total **depois** desta resposta.
   *
   * É este número que vai para o `AuthStore`. Somar `xp + xpAwarded` localmente
   * erra no replay e em toda resposta errada — o mesmo erro que a spec 019
   * evitou no check de vídeo.
   */
  readonly totalXp: number;
  readonly roundComplete?: boolean;
  readonly score?: number;
  readonly roundPassed?: boolean;
  readonly badgeUnlocked?: boolean;
  /** O `grade` depois da conquista. Pode não ter subido: ele avança em ordem. */
  readonly grade?: number;
  readonly nextRound?: number;
}

/** Uma linha do Ranking da Liga. */
export interface RankingEntry {
  readonly position: number;
  readonly uid: string;
  readonly nickname: string;
  readonly xp: number;
  readonly badgeCount: number;
  /**
   * Quantas posições subiu desde o último snapshot.
   *
   * Positivo é subida, negativo é queda, e **`null` é "ainda não sei"** — o
   * primeiro dia do membro no placar. A tela não desenha selo nenhum com `null`;
   * zero diria "não mudou", que é outra afirmação.
   */
  readonly positionChange: number | null;
}

export interface RankingPage {
  readonly entries: readonly RankingEntry[];
  /** A posição do membro logado, mesmo que ele não esteja nesta página. */
  readonly myPosition: number | null;
  readonly myEntry: RankingEntry | null;
  /** O cursor da próxima página, ou `null` no fim. **Opaco**: devolva-o intacto. */
  readonly nextCursor: string | null;
}

/**
 * Uma questão como a **administração** a vê.
 *
 * Este é o único tipo do front que carrega `correctIndex`, e ele só chega por
 * rotas de admin.
 */
export interface GymQuestion {
  readonly id: string;
  readonly badgeId: string;
  readonly difficulty: QuestionDifficulty;
  readonly question: string;
  readonly alternatives: readonly string[];
  readonly correctIndex: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface QuestionCounts {
  readonly easy: number;
  readonly medium: number;
  readonly hard: number;
  readonly total: number;
  /**
   * Se o desafio pode sair de "Em breve".
   *
   * Olha os **três níveis** no mínimo de 30, e não o total: 90 fáceis e nenhuma
   * difícil somam 90 e não montam uma rodada 3. A tela não recalcula isto.
   */
  readonly ready: boolean;
}

export interface QuestionList {
  readonly questions: readonly GymQuestion[];
  readonly counts: QuestionCounts;
}

/** O corpo de criação e edição de questão. Sem `id` e sem `badgeId`. */
export interface QuestionInput {
  readonly difficulty: QuestionDifficulty;
  readonly question: string;
  readonly alternatives: readonly string[];
  readonly correctIndex: number;
}

export interface GenerateQuestionsRequest {
  readonly prompt: string;
  readonly difficulty: QuestionDifficulty;
  readonly count: number;
}

/**
 * O rascunho da IA.
 *
 * **Sem `id`, porque nada foi gravado.** O que existe aqui é uma proposta; o que
 * a torna questão é o admin clicar em salvar.
 */
export interface GeneratedQuestions {
  readonly questions: readonly QuestionInput[];
  /**
   * Quantas o modelo devolveu fora do formato e foram descartadas.
   *
   * **A tela precisa mostrar este número**: sem ele, um rascunho de 7 quando se
   * pediu 10 parece um limite do produto em vez de um modelo que errou.
   */
  readonly discarded: number;
}

export interface ChallengeConfig {
  readonly badgeId: string;
  readonly requiredXp: number;
  /** Se o admin já salvou. Distingue "não configurado" de "configurado com 0". */
  readonly configured: boolean;
  readonly counts: QuestionCounts;
}

/** O rótulo em português de cada nível, num lugar só. */
export const DIFFICULTY_LABELS: Readonly<Record<QuestionDifficulty, string>> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil'
};

/**
 * O mínimo de questões por nível que liga o desafio.
 *
 * **Duplicado do servidor de propósito, e só para desenhar "28/30".** Quem
 * decide se o desafio existe é o `ready` que a API manda — este número não entra
 * em nenhum `if`. É a mesma duplicação declarada dos `BADGE_IDS`: um rótulo, e
 * não uma regra.
 */
export const MIN_QUESTIONS_PER_DIFFICULTY = 30;

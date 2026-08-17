import { EliteRound, StagePhase } from '../../models/community.model';

/**
 * O único lugar que sabe traduzir `grade` em texto.
 *
 * `grade` é um número de 0 a 13 vindo da API, e sozinho ele não diz nada: 8 é a
 * última insígnia, 12 é o título, 13 é pós-game. Sem um módulo próprio, o selo do
 * dashboard reimplementaria essa tabela, e a régua da comunidade de novo, e as
 * duas divergiriam na primeira mudança.
 *
 * Ver a decisão 4 da spec 008.
 */

export const TOTAL_BADGES = 8;
export const MAX_GRADE = 13;

/** Ordem das rodadas da Elite Four, indexada a partir de `grade` 9. */
const ELITE_ROUNDS: readonly EliteRound[] = [
  'oitavas',
  'quartas',
  'semifinais',
  'final'
];

export interface Progress {
  /** Quantas etapas o membro concluiu, já normalizado para a faixa válida. */
  readonly grade: number;
  readonly phase: StagePhase;
  /** Insígnias conquistadas, no máximo 8. */
  readonly badges: number;
  /** Preenchido só durante a Elite Four. */
  readonly round?: EliteRound;
  /** Texto curto para selo e leitor de tela. */
  readonly label: string;
}

/**
 * Gruda o valor na faixa em vez de estourar.
 *
 * `grade` vem do banco, não do usuário: um valor fora da faixa é defeito nosso, e
 * derrubar a tela por causa dele troca um selo errado por um painel em branco.
 */
function clampGrade(grade: number): number {
  if (!Number.isFinite(grade)) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(grade), 0), MAX_GRADE);
}

export function describeProgress(rawGrade: number): Progress {
  const grade = clampGrade(rawGrade);

  if (grade >= MAX_GRADE) {
    return {
      grade,
      phase: 'frontier',
      badges: TOTAL_BADGES,
      label: 'Battle Frontier'
    };
  }

  if (grade > TOTAL_BADGES) {
    const round = ELITE_ROUNDS[grade - TOTAL_BADGES - 1];
    return {
      grade,
      phase: 'elite',
      badges: TOTAL_BADGES,
      round,
      // Vencer a Final é ser campeão. As outras três rodadas se anunciam pelo
      // nome, porque "Quartas" já diz onde a pessoa está.
      label: round === 'final' ? 'Campeão' : ELITE_LABEL[round]
    };
  }

  return {
    grade,
    phase: 'gym',
    badges: grade,
    label: grade === 0 ? 'Nenhuma insígnia' : `Insígnia ${grade} / ${TOTAL_BADGES}`
  };
}

const ELITE_LABEL: Readonly<Record<EliteRound, string>> = {
  oitavas: 'Oitavas da Elite Four',
  quartas: 'Quartas da Elite Four',
  semifinais: 'Semifinais da Elite Four',
  final: 'Final da Elite Four'
};

/** Quantas insígnias faltam. Nunca negativo: quem passou das oito não deve nada. */
export function badgesRemaining(rawGrade: number): number {
  return Math.max(TOTAL_BADGES - clampGrade(rawGrade), 0);
}

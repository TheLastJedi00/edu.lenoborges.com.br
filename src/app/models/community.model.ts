/**
 * Domínio da Liga Dev, a comunidade. É separado de `profile.model.ts` de propósito:
 * a comunidade não é o currículo do Leno, e os dois evoluem por motivos diferentes.
 *
 * O vocabulário é de Pokémon e cada termo tem dono (spec 008):
 * insígnia se conquista numa GYM Battle, as quatro Elite Battles formam a Elite Four,
 * e a Battle Frontier é o pós-game.
 */

/** Identifica o ícone SVG correspondente em `components/icons`. */
export type TrackIconId =
  | 'java'
  | 'git-github'
  | 'spring'
  | 'html-css'
  | 'ts-js'
  | 'angular'
  | 'nestjs'
  | 'vercel'
  | 'firebase'
  | 'supabase'
  | 'docker'
  | 'gcp'
  | 'ia';

/**
 * A natureza de uma etapa, e não só o peso dela.
 *
 * Existe para os três tipos conviverem na mesma lista ordenada sem que cada
 * componente precise deduzir pelo índice quem é insígnia e quem é prêmio.
 */
export type StagePhase = 'gym' | 'elite' | 'frontier';

/** Rótulo exibível de cada natureza. Fica aqui para não ser reescrito em cada tela. */
export const STAGE_PHASE_LABEL: Readonly<Record<StagePhase, string>> = {
  gym: 'GYM Battle',
  elite: 'Elite Battle',
  frontier: 'Battle Frontier'
};

/** As quatro Elite Battles, na ordem em que são disputadas. */
export type EliteRound = 'oitavas' | 'quartas' | 'semifinais' | 'final';

export const ELITE_ROUND_LABEL: Readonly<Record<EliteRound, string>> = {
  oitavas: 'Oitavas',
  quartas: 'Quartas',
  semifinais: 'Semifinais',
  final: 'Final'
};

export interface CommunityIdentity {
  readonly name: string;
  readonly tagline: string;
  readonly summary: string;
  /** Estado atual da comunidade, exibido como selo no hero. */
  readonly status: string;
}

/**
 * Uma etapa da trilha de aprendizado.
 * `order` é dado, não enfeite: a sequência é a própria promessa da trilha.
 */
export interface TrackStage {
  readonly id: string;
  readonly order: number;
  readonly phase: StagePhase;
  /** Frente do conhecimento: Fundamentos, Back-End, Front-End, Cloud Computing, DevOps. */
  readonly area: string;
  readonly title: string;
  readonly icon: TrackIconId;
  readonly topics: readonly string[];
  /** Só nas etapas `elite`: qual das quatro rodadas ela é. */
  readonly round?: EliteRound;
}

/** Progressão das Insígnias: quantas existem e quantas o Dev Tier libera. */
export interface BadgeProgress {
  readonly totalBadges: number;
  readonly freeBadges: number;
}

/** Um tier de assinatura e o que ele entrega. Os tiers são cumulativos. */
export interface CommunityTier {
  readonly id: string;
  readonly name: string;
  /** O que o tier abre, em uma linha. Substituiu a faixa de Graus da spec 003. */
  readonly range: string;
  readonly price: string;
  readonly summary: string;
  readonly perks: readonly string[];
}

/** Um traço do que a comunidade é, exibido na seção de apresentação. */
export interface CommunityHighlight {
  readonly id: string;
  readonly icon: 'whatsapp' | 'youtube' | 'ranking' | 'share';
  readonly title: string;
  readonly detail: string;
}

/**
 * A Grinding Arena: a mentoria em grupo pequeno, benefício do Ultra Dev Tier.
 *
 * É paralela à trilha, não uma etapa dela: **insígnia não se conquista aqui**,
 * se conquista numa GYM Battle. Ver o guardrail da decisão 6 da spec 008.
 */
export interface GrindingArena {
  readonly title: string;
  readonly summary: string;
  readonly price: string;
  readonly duration: string;
  readonly cadence: string;
  readonly seats: number;
  readonly perks: readonly string[];
}

export interface Community {
  readonly identity: CommunityIdentity;
  readonly badges: BadgeProgress;
  readonly tiers: readonly CommunityTier[];
  readonly highlights: readonly CommunityHighlight[];
  readonly trackStages: readonly TrackStage[];
  readonly grindingArena: GrindingArena;
}

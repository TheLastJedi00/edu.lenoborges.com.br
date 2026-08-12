/**
 * Domínio da Seita Dev, a comunidade. É separado de `profile.model.ts` de propósito:
 * a comunidade não é o currículo do Leno, e os dois evoluem por motivos diferentes.
 */

/** Identifica o ícone SVG correspondente em `components/icons`. */
export type TrackIconId =
  | 'stacks'
  | 'java'
  | 'sql'
  | 'git-github'
  | 'spring'
  | 'gcp'
  | 'html-css'
  | 'vercel'
  | 'angular'
  | 'devops'
  | 'nestjs';

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
  /** Frente do conhecimento: Fundamentos, Back-End, Front-End, Cloud Computing, DevOps. */
  readonly area: string;
  readonly title: string;
  readonly icon: TrackIconId;
  readonly topics: readonly string[];
}

/** Progressão dos Graus: quanto é livre e quanto exige a assinatura simbólica. */
export interface GradeProgress {
  readonly totalGrades: number;
  readonly freeGrades: number;
}

/** Uma faixa de Graus e o que ela libera. */
export interface CommunityTier {
  readonly id: string;
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

/** O Conclave: a mentoria em grupo pequeno. */
export interface Conclave {
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
  readonly grades: GradeProgress;
  readonly tiers: readonly CommunityTier[];
  readonly highlights: readonly CommunityHighlight[];
  readonly trackStages: readonly TrackStage[];
  readonly conclave: Conclave;
}

export type IconName = 'linkedin' | 'instagram' | 'portfolio';

export interface SocialLink {
  readonly icon: IconName;
  readonly label: string;
  readonly handle: string;
  readonly url: string;
}

export interface Identity {
  readonly name: string;
  readonly role: string;
  readonly tagline: string;
  readonly summary: string;
  readonly languages: readonly string[];
  readonly links: readonly SocialLink[];
}

/** Identifica o ícone SVG correspondente em `components/icons`. */
export type TeachingStackId =
  | 'html-css'
  | 'java'
  | 'ts-js'
  | 'sql'
  | 'angular'
  | 'spring'
  | 'nestjs'
  | 'git-github';

export interface TeachingStackItem {
  readonly id: TeachingStackId;
  readonly label: string;
}

/**
 * Um passo da trilha entre a primeira mensagem e a primeira aula.
 * `order` é dado, não enfeite: a sequência é o que o aluno precisa saber.
 */
export interface LessonStep {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly detail: string;
  readonly meta: string;
}

export type ExperienceTrack = 'dev' | 'educator';

export interface Experience {
  readonly id: string;
  readonly role: string;
  readonly org: string;
  readonly mode: string;
  readonly period: string;
  readonly current: boolean;
  readonly track: ExperienceTrack;
  readonly highlights: readonly string[];
  readonly stack: readonly string[];
}

export interface Stat {
  readonly value: string;
  readonly label: string;
}

export interface Education {
  readonly id: string;
  readonly title: string;
  readonly org: string;
  readonly period: string;
  readonly detail: string;
}

export interface Profile {
  readonly identity: Identity;
  readonly teachingStack: readonly TeachingStackItem[];
  readonly lessonSteps: readonly LessonStep[];
  readonly experiences: readonly Experience[];
  readonly stats: readonly Stat[];
  readonly education: readonly Education[];
}

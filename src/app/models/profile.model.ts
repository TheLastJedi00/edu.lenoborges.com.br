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

/** Categoria de tecnologia — o "tipo" que colore o chip. */
export type StackTone = 'code' | 'framework' | 'architecture' | 'cloud' | 'ai' | 'data';

export interface StackGroup {
  readonly id: string;
  readonly label: string;
  readonly tone: StackTone;
  readonly items: readonly string[];
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
  readonly stack: readonly StackGroup[];
  readonly experiences: readonly Experience[];
  readonly stats: readonly Stat[];
  readonly education: readonly Education[];
}

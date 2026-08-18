import type { TierId } from './auth.model';
/** Administração da Liga Dev (spec 009). */

export interface AdminUser {
  readonly id: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly disabled: boolean;
  readonly role: 'admin' | null;
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
  /**
   * Nulos aqui são informação, não ausência de dado: é o retrato de quem criou
   * conta e parou antes do onboarding — a pessoa que o admin mais precisa ver.
   */
  readonly name: string | null;
  readonly phone: string | null;
  readonly grade: number | null;
  readonly profileCompleted: boolean;
  /**
   * Tier de acesso (spec 010).
   *
   * **Acesso, nao conquista.** Fica visivelmente separado do `grade` na tela:
   * encostados sem explicacao, os dois viram a mesma coisa na cabeca de quem
   * clica -- e a spec 008 inteira depende de nao virarem.
   */
  readonly tier: TierId;
}

export interface AdminUserPage {
  readonly users: readonly AdminUser[];
  /** Token do Firebase Auth. Nulo no fim da listagem. */
  readonly nextPageToken: string | null;
}

export interface CreateVideoRequest {
  readonly title: string;
  readonly description?: string;
  /** A URL como o admin colou. A API extrai o ID. */
  readonly youtubeUrl: string;
}

export interface UpdateVideoRequest {
  readonly title?: string;
  readonly description?: string;
}

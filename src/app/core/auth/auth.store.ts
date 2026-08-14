import { Injectable, computed, signal } from '@angular/core';
import { AuthStatus, MemberProfile, MemberUser, Session } from '../../models/auth.model';

/**
 * Único dado de sessão que toca o armazenamento do navegador, e de propósito não
 * é um dado: é um booleano. Ver `hasSessionHint`.
 */
const SESSION_HINT_KEY = 'eduleno.session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  /**
   * Token JWT mantido estritamente em memória.
   * NUNCA utilizar localStorage ou sessionStorage para tokens para prevenir ataques XSS.
   */
  readonly accessToken = signal<string | null>(null);
  readonly user = signal<MemberUser | null>(null);
  /** Perfil completo, carregado por `GET /me`. Nulo até alguma page pedir. */
  readonly profile = signal<MemberProfile | null>(null);
  readonly status = signal<AuthStatus>('unknown');

  /**
   * `profileCompleted` e `grade` chegam na resposta da sessão, achatados, e são
   * guardados aqui separados do perfil completo. Os guards rodam antes de
   * qualquer page pedir `GET /me`, então precisam de uma resposta que já esteja
   * em memória: sem isso, o F5 dentro do painel devolve o usuário ao onboarding.
   */
  private readonly sessionProfileCompleted = signal(false);
  private readonly sessionGrade = signal(1);

  readonly isLoggedIn = computed(() => this.status() === 'authenticated');

  /** O perfil carregado manda quando existe, porque é o dado mais recente. */
  readonly profileCompleted = computed(
    () => this.profile()?.profileCompleted ?? this.sessionProfileCompleted()
  );

  readonly grade = computed(() => this.profile()?.grade ?? this.sessionGrade());

  /** URL tentada por usuário não autenticado para redirecionamento pós-login. */
  readonly intendedUrl = signal<string | null>(null);

  /** Controle global do modal de autenticação. */
  readonly isAuthDialogOpen = signal<boolean>(false);
  readonly authDialogTab = signal<'login' | 'signup'>('login');

  setSession(session: Session): void {
    const trocouDeUsuario = this.user()?.id !== session.user.id;

    this.accessToken.set(session.accessToken);
    this.user.set(session.user);
    this.sessionProfileCompleted.set(session.profileCompleted);
    this.sessionGrade.set(session.grade);
    this.status.set('authenticated');
    this.markSessionHint();

    // Perfil de outra pessoa não pode sobreviver a um login novo. Num refresh do
    // mesmo usuário ele é mantido, para a tela não piscar sem nome.
    if (trocouDeUsuario) {
      this.profile.set(null);
    }
  }

  setProfile(profile: MemberProfile): void {
    this.profile.set(profile);
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.user.set(null);
    this.profile.set(null);
    this.sessionProfileCompleted.set(false);
    this.sessionGrade.set(1);
    this.status.set('anonymous');
    this.clearSessionHint();
  }

  /**
   * Marca que este navegador chegou a ter sessão.
   *
   * Não é credencial e não serve para autenticar nada: é um booleano que responde
   * "vale a pena tentar o /auth/refresh na abertura?". O refresh token de verdade
   * está no cookie HttpOnly, invisível para o JS, e por isso o app não conseguiria
   * responder essa pergunta sozinho. Sem a marca, todo visitante anônimo da
   * landing esperaria uma requisição de sessão que nunca teria como dar certo.
   */
  hasSessionHint(): boolean {
    try {
      return globalThis.localStorage?.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      // Navegador com armazenamento bloqueado: sem marca, sem tentativa.
      return false;
    }
  }

  private markSessionHint(): void {
    try {
      globalThis.localStorage?.setItem(SESSION_HINT_KEY, '1');
    } catch {
      // Sem armazenamento o app segue funcionando; só perde a restauração no F5.
    }
  }

  private clearSessionHint(): void {
    try {
      globalThis.localStorage?.removeItem(SESSION_HINT_KEY);
    } catch {
      // Idem.
    }
  }

  setAnonymous(): void {
    this.clearSession();
  }

  setIntendedUrl(url: string | null): void {
    this.intendedUrl.set(url);
  }

  openAuthDialog(tab: 'login' | 'signup' = 'login'): void {
    this.authDialogTab.set(tab);
    this.isAuthDialogOpen.set(true);
  }

  closeAuthDialog(): void {
    this.isAuthDialogOpen.set(false);
  }
}

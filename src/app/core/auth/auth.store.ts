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
  readonly profile = signal<MemberProfile | null>(null);
  readonly status = signal<AuthStatus>('unknown');

  readonly isLoggedIn = computed(() => this.status() === 'authenticated');
  readonly profileCompleted = computed(() => this.profile()?.profileCompleted ?? false);

  /** URL tentada por usuário não autenticado para redirecionamento pós-login. */
  readonly intendedUrl = signal<string | null>(null);

  /** Controle global do modal de autenticação. */
  readonly isAuthDialogOpen = signal<boolean>(false);
  readonly authDialogTab = signal<'login' | 'signup'>('login');

  setSession(session: Session): void {
    this.accessToken.set(session.accessToken);
    this.user.set(session.user);
    this.profile.set(session.profile);
    this.status.set('authenticated');
    this.markSessionHint();
  }

  setProfile(profile: MemberProfile): void {
    this.profile.set(profile);
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.user.set(null);
    this.profile.set(null);
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

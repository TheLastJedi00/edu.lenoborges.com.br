import { Injectable, computed, signal } from '@angular/core';
import { AuthStatus, MemberProfile, MemberUser, Session } from '../../models/auth.model';

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
  }

  setProfile(profile: MemberProfile): void {
    this.profile.set(profile);
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.user.set(null);
    this.profile.set(null);
    this.status.set('anonymous');
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

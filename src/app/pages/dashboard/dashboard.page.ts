import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { BadgeCount } from '../../components/badge-count/badge-count';
import { Logo } from '../../shared/logo/logo';
import { IconBilling } from '../../components/icons/icon-billing';
import { IconGames } from '../../components/icons/icon-games';
import { IconMural } from '../../components/icons/icon-mural';
import { IconShield } from '../../components/icons/icon-shield';
import { IconTrack } from '../../components/icons/icon-track';
import { IconUser } from '../../components/icons/icon-user';
import { IconWhatsapp } from '../../components/icons/icon-whatsapp';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    BadgeCount,
    IconTrack,
    IconBilling,
    IconMural,
    IconWhatsapp,
    IconUser,
    IconGames,
    IconShield,
    Logo
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit {
  /**
   * `protected` e não `private` porque o cartão de Administração lê o
   * `isAdmin()` direto no template, como o aside faz. É signal, então o OnPush
   * reage sozinho quando o papel chega depois da sessão -- copiar para uma
   * propriedade comum congelaria o valor no instante da montagem.
   */
  protected readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * A resposta da sessão traz só `profileCompleted` e `grade`. O nome vem de
   * `GET /me`, e é a page que pede, conforme a regra 7 do clauderc. Enquanto não
   * chega, o cabeçalho cai no prefixo do e-mail em vez de ficar vazio.
   */
  ngOnInit(): void {
    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  readonly whatsappUrl = environment.whatsappGroupUrl;
  readonly hasWhatsappUrl = computed(() => Boolean(this.whatsappUrl && this.whatsappUrl.trim().length > 0));

  readonly firstName = computed(() => {
    const fullName = this.authStore.profile()?.name || '';
    if (fullName.trim()) {
      return fullName.trim().split(' ')[0];
    }
    const email = this.authStore.user()?.email || '';
    if (email) {
      return email.split('@')[0];
    }
    return 'Membro';
  });

  /** Vem da sessão até o perfil chegar, então o selo nunca pisca uma insígnia errada. */
  readonly grade = this.authStore.grade;
}

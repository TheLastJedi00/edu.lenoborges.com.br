import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { GradeBadge } from '../../components/grade-badge/grade-badge';
import { IconGames } from '../../components/icons/icon-games';
import { IconTrack } from '../../components/icons/icon-track';
import { IconUser } from '../../components/icons/icon-user';
import { IconWhatsapp } from '../../components/icons/icon-whatsapp';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    GradeBadge,
    IconTrack,
    IconWhatsapp,
    IconUser,
    IconGames
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit {
  private readonly authStore = inject(AuthStore);
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

  /** Vem da sessão até o perfil chegar, então o selo nunca pisca um Grau errado. */
  readonly grade = this.authStore.grade;
}

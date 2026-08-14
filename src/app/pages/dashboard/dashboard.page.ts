import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { GradeBadge } from '../../components/grade-badge/grade-badge';
import { IconGames } from '../../components/icons/icon-games';
import { IconTrack } from '../../components/icons/icon-track';
import { IconUser } from '../../components/icons/icon-user';
import { IconWhatsapp } from '../../components/icons/icon-whatsapp';
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
export class DashboardPage {
  private readonly authStore = inject(AuthStore);

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

  readonly grade = computed(() => {
    return this.authStore.profile()?.grade ?? 1;
  });
}

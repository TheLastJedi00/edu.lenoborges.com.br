import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { BadgeCard } from '../../components/badge-card/badge-card';
import { Reveal } from '../../directives/reveal';
import { Logo } from '../../shared/logo/logo';
import { AuthStore } from '../../core/auth/auth.store';
import { CommunityService } from '../../services/community.service';
import { describeProgress } from '../../core/progress/progress';

@Component({
  selector: 'app-trilha-page',
  standalone: true,
  imports: [BadgeCard, Reveal, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trilha.page.html',
  styleUrl: './trilha.page.scss'
})
export class TrilhaPage {
  private readonly community = inject(CommunityService);
  private readonly authStore = inject(AuthStore);

  protected readonly progress = computed(() =>
    describeProgress(this.authStore.grade())
  );

  /** As oito GYM Battles, na ordem. */
  protected readonly gyms = computed(() =>
    this.community.trackStages().filter((stage) => stage.phase === 'gym')
  );

  /** A Elite Four e a Battle Frontier, separadas por um vão do resto. */
  protected readonly endgame = computed(() =>
    this.community.trackStages().filter((stage) => stage.phase !== 'gym')
  );

  /**
   * Se a etapa já foi concluída.
   *
   * `grade` conta etapas concluídas, então `order <= grade` é a leitura correta —
   * e ela vale igual para insígnia, Elite Battle e Frontier, porque a ordem da
   * trilha é contínua de 1 a 13.
   *
   * **Isto informa, nunca impede.** O cartão de uma etapa não conquistada abre
   * do mesmo jeito: a trilha não é presa (decisão 6).
   */
  protected conquered(order: number): boolean {
    return order <= this.progress().grade;
  }
}

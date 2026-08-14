import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommunityService } from '../../services/community.service';

/**
 * Exibe o nível do membro ("Grau N") em relação ao total de graus da comunidade.
 * Dumb component que obtém o total diretamente de CommunityService.
 */
@Component({
  selector: 'app-grade-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grade-badge u-mono"
      [attr.aria-label]="'Grau ' + grade() + ' de ' + totalGrades() + ' Graus'"
    >
      <span class="grade-badge__current">Grau {{ grade() }}</span>
      <span class="grade-badge__divider" aria-hidden="true">/</span>
      <span class="grade-badge__total" aria-hidden="true">{{ totalGrades() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .grade-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border: var(--border-w) solid var(--screen-deep);
      border-radius: 999px;
      background: var(--screen);
      color: var(--ink);
      font-size: var(--step--1);
      font-weight: 700;
      letter-spacing: 0.03em;
      box-shadow: var(--shadow-hard-sm);
    }

    .grade-badge__current {
      color: var(--accent-deep);
    }

    .grade-badge__divider {
      color: var(--ink-soft);
      opacity: 0.6;
    }

    .grade-badge__total {
      color: var(--ink-soft);
      font-size: 0.85em;
    }
  `
})
export class GradeBadge {
  private readonly communityService = inject(CommunityService);

  readonly grade = input<number>(1);
  readonly totalGrades = computed(() => this.communityService.grades().totalGrades);
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommunityTier, GradeProgress } from '../../models/community.model';
import { Reveal } from '../../directives/reveal';

/**
 * Progressão dos 33 Graus: mostra até onde se joga de graça e o que a assinatura
 * simbólica destrava. A régua é decorativa; a informação está no texto das faixas.
 */
@Component({
  selector: 'app-grade-ladder',
  imports: [Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ladder" appReveal>
      <p class="ladder__caption">
        <strong>{{ progress().freeGrades }}</strong> dos
        <strong>{{ progress().totalGrades }}</strong> Graus são livres para qualquer pessoa
      </p>

      <ol class="ladder__rail" aria-hidden="true">
        @for (grade of grades(); track grade) {
          <li class="ladder__step" [class.ladder__step--free]="grade <= progress().freeGrades"></li>
        }
      </ol>
    </div>

    <ul class="tiers">
      @for (tier of tiers(); track tier.id) {
        <li class="tier" [class.tier--paid]="tier.price !== 'Gratuito'" appReveal>
          <p class="tier__range u-mono">{{ tier.range }}</p>
          <p class="tier__price">{{ tier.price }}</p>
          <p class="tier__summary">{{ tier.summary }}</p>
          <ul class="tier__perks">
            @for (perk of tier.perks; track perk) {
              <li>{{ perk }}</li>
            }
          </ul>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .ladder {
      display: grid;
      gap: 0.75rem;
    }

    .ladder__caption {
      color: var(--ink-soft);
    }

    .ladder__caption strong {
      color: var(--accent-deep);
      font-family: var(--font-display);
      font-size: var(--step-1);
    }

    .ladder__rail {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .ladder__step {
      flex: 1 1 0.5rem;
      min-width: 0.35rem;
      height: 0.75rem;
      border-radius: 999px;
      background: var(--screen);
    }

    .ladder__step--free {
      background: var(--gradient-accent);
      box-shadow: var(--shadow-glow);
    }

    .tiers {
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .tier {
      display: grid;
      gap: 0.5rem;
      padding: 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      transition:
        transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .tier:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-hard);
    }

    .tier--paid {
      background: var(--gradient-panel);
    }

    .tier__range {
      font-weight: 700;
      color: var(--accent-deep);
    }

    .tier__price {
      font-family: var(--font-display);
      font-size: var(--step-2);
      font-weight: 700;
      line-height: 1.1;
      color: var(--ink);
    }

    .tier__summary {
      color: var(--ink-soft);
      line-height: 1.55;
    }

    .tier__perks {
      display: grid;
      gap: 0.4rem;
      margin: 0.25rem 0 0;
      padding: 0;
      list-style: none;
      color: var(--ink-soft);
    }

    .tier__perks li {
      position: relative;
      padding-left: 1rem;
      line-height: 1.5;
    }

    .tier__perks li::before {
      content: '';
      position: absolute;
      top: 0.6em;
      left: 0;
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: var(--accent);
    }

    @media (min-width: 48rem) {
      .tiers {
        grid-template-columns: repeat(2, 1fr);
      }

      .tier {
        padding: 1.6rem;
      }
    }
  `
})
export class GradeLadder {
  readonly progress = input.required<GradeProgress>();
  readonly tiers = input.required<readonly CommunityTier[]>();

  protected readonly grades = computed(() =>
    Array.from({ length: this.progress().totalGrades }, (_, index) => index + 1)
  );
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Identity } from '../../models/profile.model';
import { IconCartridge } from '../icons/icon-cartridge';

/** Cartão de treinador: identidade do topo da página. */
@Component({
  selector: 'app-trainer-card',
  imports: [IconCartridge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <p class="u-mono card__eyebrow">Professor particular de programação</p>
      <div class="card__body">
        <div class="badge">
          <app-icon-cartridge />
        </div>
        <div>
          <h1 class="card__name">{{ identity().name }}</h1>
          <p class="card__role">{{ identity().role }}</p>
          <p class="card__tagline">{{ identity().tagline }}</p>
        </div>
      </div>
      <dl class="card__meta u-mono">
        <div>
          <dt>Base</dt>
          <dd>Blumenau, SC e remoto</dd>
        </div>
        <div>
          <dt>Idiomas</dt>
          <dd>{{ identity().languages.join(' · ') }}</dd>
        </div>
      </dl>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .card {
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      overflow: hidden;
      /* Respiração contínua: o cartão nunca fica totalmente parado. */
      animation: anim-float 7s ease-in-out infinite alternate;
    }

    .card__eyebrow {
      padding: 0.6rem 1.25rem;
      background: var(--gradient-accent-strong);
      color: #fff;
      font-weight: 700;
    }

    .card__body {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1.25rem;
    }

    .badge {
      flex: 0 0 4.5rem;
    }

    .card__name {
      font-size: var(--step-3);
    }

    .card__role {
      margin-top: 0.35rem;
      color: var(--accent-deep);
      font-weight: 600;
    }

    .card__tagline {
      margin-top: 0.75rem;
      font-size: var(--step-1);
      font-weight: 500;
      line-height: 1.35;
      color: var(--ink-soft);
    }

    .card__meta {
      display: grid;
      gap: 0.5rem;
      padding: 0.9rem 1.25rem;
      border-top: var(--border-w) solid var(--border-soft);
      background: var(--screen-lit);
    }

    .card__meta dt {
      color: var(--ink-soft);
    }

    .card__meta dd {
      margin: 0;
      font-weight: 700;
    }

    @media (min-width: 48rem) {
      .card__body {
        gap: 1.5rem;
        padding: 1.75rem;
      }

      .badge {
        flex-basis: 6.5rem;
      }

      .card__meta {
        grid-template-columns: 1fr 1fr;
      }
    }
  `
})
export class TrainerCard {
  readonly identity = input.required<Identity>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Stat } from '../../models/profile.model';

/** Número de impacto: o antes e depois de uma automação. */
@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="value">{{ stat().value }}</p>
    <p class="label">{{ stat().label }}</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.1rem 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--ink);
      box-shadow: var(--shadow-hard-sm);
      color: var(--screen-lit);
    }

    .value {
      font-family: var(--font-display);
      font-size: var(--step-2);
      font-weight: 700;
      line-height: 1.1;
      color: var(--accent);
    }

    .label {
      margin-top: 0.5rem;
      font-size: var(--step--1);
      line-height: 1.5;
    }
  `
})
export class StatTile {
  readonly stat = input.required<Stat>();
}

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
      border: var(--border-w) solid var(--ink);
      border-radius: var(--radius);
      background: var(--ink);
      box-shadow: 4px 4px 0 var(--accent-deep);
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

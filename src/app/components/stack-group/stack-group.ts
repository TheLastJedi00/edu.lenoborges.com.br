import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StackGroup } from '../../models/profile.model';

/** Grupo de tecnologias — cada categoria tem sua cor, como um tipo. */
@Component({
  selector: 'app-stack-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'toneClass()' },
  template: `
    <h3 class="title u-mono">{{ group().label }}</h3>
    <ul class="chips">
      @for (item of group().items; track item) {
        <li class="chip">{{ item }}</li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      --chip-bg: var(--paper);
      --chip-fg: var(--ink);
    }

    :host(.tone-code) {
      --chip-bg: var(--link-blue);
      --chip-fg: var(--paper);
    }

    :host(.tone-framework) {
      --chip-bg: var(--violet);
      --chip-fg: var(--paper);
    }

    :host(.tone-architecture) {
      --chip-bg: var(--ink);
      --chip-fg: var(--screen-lit);
    }

    :host(.tone-cloud) {
      --chip-bg: var(--screen-deep);
      --chip-fg: var(--ink);
    }

    :host(.tone-ai) {
      --chip-bg: var(--accent);
      --chip-fg: var(--ink);
    }

    .title {
      color: var(--ink-soft);
      font-weight: 700;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
      padding: 0;
      list-style: none;
    }

    .chip {
      padding: 0.35rem 0.7rem;
      border: 3px solid var(--ink);
      border-radius: var(--radius);
      background: var(--chip-bg);
      box-shadow: 3px 3px 0 var(--ink);
      color: var(--chip-fg);
      font-family: var(--font-mono);
      font-size: var(--step--1);
      font-weight: 700;
    }
  `
})
export class StackGroupCard {
  readonly group = input.required<StackGroup>();
  protected readonly toneClass = computed(() => `tone-${this.group().tone}`);
}

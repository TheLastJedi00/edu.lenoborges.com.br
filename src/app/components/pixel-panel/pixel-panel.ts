import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PanelTone = 'screen' | 'lit' | 'ink' | 'accent';

/** Superfície base do sistema: borda sólida, sombra deslocada, sem blur. */
@Component({
  selector: 'app-pixel-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'toneClass()'
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      border: var(--border-w) solid var(--ink);
      border-radius: var(--radius);
      box-shadow: var(--shadow-hard);
      padding: 1.25rem;
    }

    :host(.tone-screen) {
      background: var(--paper);
    }

    :host(.tone-lit) {
      background: var(--screen-lit);
    }

    :host(.tone-ink) {
      background: var(--ink);
      color: var(--screen-lit);
      box-shadow: 6px 6px 0 var(--accent-deep);
    }

    :host(.tone-accent) {
      background: var(--accent);
    }

    @media (min-width: 48rem) {
      :host {
        padding: 2rem;
      }
    }
  `
})
export class PixelPanel {
  readonly tone = input<PanelTone>('screen');
  protected readonly toneClass = computed(() => `tone-${this.tone()}`);
}

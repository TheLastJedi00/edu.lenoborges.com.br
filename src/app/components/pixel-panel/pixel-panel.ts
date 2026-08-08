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
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-hard-sm);
      padding: 1.25rem;
    }

    :host(.tone-screen) {
      background: var(--paper);
    }

    :host(.tone-lit) {
      background: var(--gradient-panel);
    }

    :host(.tone-ink) {
      border-color: transparent;
      background: var(--ink);
      color: var(--screen-lit);
      box-shadow: var(--shadow-hard);
    }

    :host(.tone-accent) {
      border-color: transparent;
      background: var(--gradient-accent);
      color: #fff;
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

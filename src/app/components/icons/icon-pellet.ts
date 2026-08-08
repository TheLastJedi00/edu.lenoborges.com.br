import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marcador simples usado em listas. */
@Component({
  selector: 'app-icon-pellet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 8 8" width="8" height="8" fill="currentColor" focusable="false">
      <circle cx="4" cy="4" r="4" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `
})
export class IconPellet {}

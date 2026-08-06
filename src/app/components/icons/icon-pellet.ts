import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pastilha usada como marcador de lista. */
@Component({
  selector: 'app-icon-pellet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 8 8" width="10" height="10" fill="currentColor" focusable="false">
      <path d="M2 0h4v2H2zM0 2h8v4H0zM2 6h4v2H2z" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      shape-rendering: crispEdges;
    }
  `
})
export class IconPellet {}

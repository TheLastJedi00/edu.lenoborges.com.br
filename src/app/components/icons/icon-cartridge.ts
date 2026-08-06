import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Sprite do cartucho: retrato do cartão de treinador. */
@Component({
  selector: 'app-icon-cartridge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 64 76" width="100%" height="100%" focusable="false">
      <g stroke="var(--ink)" stroke-width="4" stroke-linejoin="miter">
        <path
          d="M6 2h52v54H6zM6 56h12v10H6zM26 56h12v10H26zM46 56h12v10H46z"
          fill="var(--link-blue)"
        />
        <rect x="14" y="10" width="36" height="26" fill="var(--paper)" />
        <path d="M20 44h24" stroke-width="4" />
      </g>
      <g fill="var(--ink)">
        <rect x="19" y="17" width="5" height="8" />
        <rect x="34" y="17" width="5" height="8" />
        <rect x="24" y="28" width="16" height="4" />
        <rect x="10" y="60" width="4" height="4" />
        <rect x="30" y="60" width="4" height="4" />
        <rect x="50" y="60" width="4" height="4" />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: block;
      shape-rendering: crispEdges;
    }
  `
})
export class IconCartridge {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Selo de identidade: monograma sobre o gradiente de acento. */
@Component({
  selector: 'app-icon-cartridge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 64 64" width="100%" height="100%" focusable="false">
      <circle cx="32" cy="32" r="31" fill="url(#monogram-gradient)" />
      <text x="32" y="41" text-anchor="middle" class="mark">LB</text>
      <defs>
        <linearGradient id="monogram-gradient" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stop-color="#488fff" />
          <stop offset="1" stop-color="#3986ff" />
        </linearGradient>
      </defs>
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    .mark {
      fill: #fff;
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
    }
  `
})
export class IconCartridge {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-ia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 11h4M10 14h4" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconIa {}

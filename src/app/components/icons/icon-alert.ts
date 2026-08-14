import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconAlert {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-close',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      focusable="false"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconClose {}

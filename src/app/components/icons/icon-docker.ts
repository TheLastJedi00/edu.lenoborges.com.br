import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-docker',
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
      <rect x="3" y="11" width="4" height="4" rx="0.5" />
      <rect x="8" y="11" width="4" height="4" rx="0.5" />
      <rect x="13" y="11" width="4" height="4" rx="0.5" />
      <rect x="8" y="6" width="4" height="4" rx="0.5" />
      <path d="M3 15c0 3.5 3 5.5 7 5.5s8-2.5 9-6.5c1.5.6 2.5.2 3-1-1-1-2.5-1-3.5-.5" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconDocker {}

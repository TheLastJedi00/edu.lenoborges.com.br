import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-share',
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
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4" />
      <path d="m8.2 13.2 7.6 4" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconShare {}

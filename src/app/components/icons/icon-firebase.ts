import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-firebase',
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
      <path d="m4 18 2.5-13 3.5 5.5" />
      <path d="m4 18 9.5-14.5L20 18l-8 3-8-3Z" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconFirebase {}

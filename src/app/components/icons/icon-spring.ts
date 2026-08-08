import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-spring',
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
      <path d="M6 18C6 9 12 4 20 4c0 8-5 14-14 14Z" />
      <path d="M6 18c3-6 7-9 12-11" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconSpring {}

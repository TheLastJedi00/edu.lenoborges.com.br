import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-ts-js',
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
      <path d="M9 3c-2 0-3 1-3 3v3c0 1-.7 1.5-2 1.5 1.3 0 2 .5 2 1.5v3c0 2 1 3 3 3" />
      <path d="M15 3c2 0 3 1 3 3v3c0 1 .7 1.5 2 1.5-1.3 0-2 .5-2 1.5v3c0 2-1 3-3 3" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconTsJs {}

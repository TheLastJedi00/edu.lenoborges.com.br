import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-devops',
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
      <path d="M20 12a8 8 0 0 1-13.7 5.6" />
      <path d="M4 12a8 8 0 0 1 13.7-5.6" />
      <path d="M17.5 3v3.5H14" />
      <path d="M6.5 21v-3.5H10" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconDevops {}

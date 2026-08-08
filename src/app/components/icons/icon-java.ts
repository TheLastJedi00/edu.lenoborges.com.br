import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-java',
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
      <path d="M5 9h11a3 3 0 0 1 0 6h-1" />
      <path d="M5 9v6a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3v-1" />
      <path d="M9 4c-1 1-1 2 0 3" />
      <path d="M13 4c-1 1-1 2 0 3" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconJava {}

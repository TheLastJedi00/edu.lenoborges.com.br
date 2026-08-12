import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-gcp',
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
      <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 3.9 3.9 0 0 0 7 18Z" />
      <path d="M10 13.5h4" />
      <path d="M12 11.5v4" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconGcp {}

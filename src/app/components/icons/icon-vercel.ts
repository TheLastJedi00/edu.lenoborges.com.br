import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-vercel',
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
      <path d="M12 4.5 21 19H3l9-14.5Z" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconVercel {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-ranking',
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
      <path d="M4 20h4v-7H4z" />
      <path d="M10 20h4V4h-4z" />
      <path d="M16 20h4v-10h-4z" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconRanking {}

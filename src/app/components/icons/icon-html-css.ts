import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-html-css',
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
      <path d="M9 4 3 12l6 8" />
      <path d="M15 4l6 8-6 8" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconHtmlCss {}

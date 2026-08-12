import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-whatsapp',
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
      <path d="M3.5 20.5 5 16.4A8 8 0 1 1 8.1 19.4l-4.6 1.1Z" />
      <path
        d="M9.2 9.1c0 2.4 2.6 5.1 5.1 5.1.6 0 1.2-.4 1.4-1l-1.8-1-.9.9c-1-.5-1.9-1.4-2.4-2.4l.9-.9-1-1.8c-.6.2-1.3.6-1.3 1.1Z"
      />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconWhatsapp {}

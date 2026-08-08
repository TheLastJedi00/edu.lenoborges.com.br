import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-nestjs',
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
      <path d="M12 3 19.8 7.5v9L12 21l-7.8-4.5v-9L12 3Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconNestjs {}

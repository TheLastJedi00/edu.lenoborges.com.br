import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-angular',
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
      <path d="M12 3 20 6.5 18.8 17 12 21 5.2 17 4 6.5 12 3Z" />
      <path d="M12 7.5 16.3 18M12 7.5 7.7 18M9.3 14.5h5.4" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconAngular {}

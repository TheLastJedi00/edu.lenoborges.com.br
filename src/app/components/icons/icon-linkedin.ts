import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-linkedin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" focusable="false">
      <path
        d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2.6 7.4v7h2.8v-7H6.6Zm1.4-1.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm3.4 8.2h2.8v-3.9c0-1 .2-2 1.5-2s1.3 1.2 1.3 2.1v3.8h2.8v-4.4c0-2.4-.5-4-3.3-4a2.9 2.9 0 0 0-2.6 1.4h-.04V10.4h-2.5v7Z"
      />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconLinkedin {}

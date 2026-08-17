import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-supabase',
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
      <path d="M13 2 4 13.5h8v8.5L20 10.5h-8V2Z" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconSupabase {}

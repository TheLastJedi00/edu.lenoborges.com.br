import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-git-github',
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
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="9" r="2.2" />
      <path d="M6 8.2v7.6" />
      <path d="M6 8.2c0 4 3 5.8 8 5.8" />
      <path d="M18 11.2v3.6" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconGitGithub {}

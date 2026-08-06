import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="u-shell">
      <h1>Leno Borges</h1>
    </main>
  `
})
export class LandingPage {}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../../directives/reveal';
import { TeachingStackItem } from '../../models/profile.model';
import { IconAngular } from '../icons/icon-angular';
import { IconGitGithub } from '../icons/icon-git-github';
import { IconHtmlCss } from '../icons/icon-html-css';
import { IconJava } from '../icons/icon-java';
import { IconNestjs } from '../icons/icon-nestjs';
import { IconSpring } from '../icons/icon-spring';
import { IconSql } from '../icons/icon-sql';
import { IconTsJs } from '../icons/icon-ts-js';

/** Grade de tecnologias ensinadas: ícone + rótulo, uma por stack. */
@Component({
  selector: 'app-teaching-stack-grid',
  imports: [
    IconHtmlCss,
    IconJava,
    IconTsJs,
    IconSql,
    IconAngular,
    IconSpring,
    IconNestjs,
    IconGitGithub,
    Reveal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="grid">
      @for (item of items(); track item.id) {
        <li class="tile" appReveal>
          <span class="tile__icon">
            @switch (item.id) {
              @case ('html-css') {
                <app-icon-html-css />
              }
              @case ('java') {
                <app-icon-java />
              }
              @case ('ts-js') {
                <app-icon-ts-js />
              }
              @case ('sql') {
                <app-icon-sql />
              }
              @case ('angular') {
                <app-icon-angular />
              }
              @case ('spring') {
                <app-icon-spring />
              }
              @case ('nestjs') {
                <app-icon-nestjs />
              }
              @case ('git-github') {
                <app-icon-git-github />
              }
            }
          </span>
          <span class="tile__label">{{ item.label }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .tile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.1rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--gradient-panel);
      box-shadow: var(--shadow-hard-sm);
      transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .tile:hover {
      transform: translateY(-3px);
    }

    .tile__icon {
      display: inline-flex;
      flex: none;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--gradient-accent);
      color: #fff;
    }

    .tile__label {
      font-weight: 700;
      color: var(--ink);
    }

    @media (min-width: 30rem) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (min-width: 48rem) {
      .grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `
})
export class TeachingStackGrid {
  readonly items = input.required<readonly TeachingStackItem[]>();
}

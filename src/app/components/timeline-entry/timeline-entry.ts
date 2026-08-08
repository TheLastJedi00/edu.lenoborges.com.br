import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Experience } from '../../models/profile.model';
import { IconPellet } from '../icons/icon-pellet';

/** Uma posição da linha do tempo. O período é o marcador — a ordem é cronológica de fato. */
@Component({
  selector: 'app-timeline-entry',
  imports: [IconPellet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="entry">
      <header class="entry__head">
        <p class="entry__period u-mono">
          {{ experience().period }}
          @if (experience().current) {
            <span class="badge">ativo</span>
          }
        </p>
        <h3 class="entry__role">{{ experience().role }}</h3>
        <p class="entry__org">{{ experience().org }} · {{ experience().mode }}</p>
      </header>

      <ul class="entry__list">
        @for (highlight of experience().highlights; track highlight) {
          <li>
            <app-icon-pellet />
            <span>{{ highlight }}</span>
          </li>
        }
      </ul>

      <ul class="entry__stack u-mono">
        @for (tech of experience().stack; track tech) {
          <li>{{ tech }}</li>
        }
      </ul>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .entry {
      padding: 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
    }

    .entry__period {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      color: var(--ink-soft);
      font-weight: 700;
    }

    .badge {
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      background: var(--gradient-accent);
      color: #fff;
      font-size: 0.7rem;
    }

    .entry__role {
      margin-top: 0.4rem;
      font-size: var(--step-2);
    }

    .entry__org {
      margin-top: 0.15rem;
      font-weight: 600;
      color: var(--ink-soft);
    }

    .entry__list {
      display: grid;
      gap: 0.6rem;
      margin: 1rem 0 0;
      padding: 0;
      list-style: none;
    }

    .entry__list li {
      display: grid;
      grid-template-columns: 1rem 1fr;
      gap: 0.6rem;
      align-items: start;
    }

    .entry__list app-icon-pellet {
      margin-top: 0.45rem;
      color: var(--link-blue);
    }

    .entry__stack {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 1.1rem 0 0;
      padding-top: 0.9rem;
      border-top: var(--border-w) solid var(--border-soft);
      list-style: none;
    }

    .entry__stack li {
      color: var(--ink-soft);
    }

    .entry__stack li + li::before {
      content: '/';
      margin-right: 0.4rem;
      color: var(--screen-deep);
    }

    @media (min-width: 48rem) {
      .entry {
        padding: 1.75rem;
      }
    }
  `
})
export class TimelineEntry {
  readonly experience = input.required<Experience>();
}

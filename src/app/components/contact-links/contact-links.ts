import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SocialLink } from '../../models/profile.model';
import { IconSocial } from '../icons/icon-social';

/** Lista de canais de contato. */
@Component({
  selector: 'app-contact-links',
  imports: [IconSocial],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="links">
      @for (link of links(); track link.url) {
        <li>
          <a class="link" [href]="link.url" target="_blank" rel="noopener noreferrer">
            <app-icon-social [name]="link.icon" />
            <span class="link__text">
              <span class="link__label">{{ link.label }}</span>
              <span class="link__handle u-mono">{{ link.handle }}</span>
            </span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    .links {
      display: grid;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .link {
      display: flex;
      gap: 0.85rem;
      align-items: center;
      padding: 0.9rem 1rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      color: var(--ink);
      text-decoration: none;
      transition:
        transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .link:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-hard);
    }

    .link__text {
      display: grid;
    }

    .link__label {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
    }

    .link__handle {
      color: var(--ink-soft);
    }

    @media (min-width: 48rem) {
      .links {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `
})
export class ContactLinks {
  readonly links = input.required<readonly SocialLink[]>();
}

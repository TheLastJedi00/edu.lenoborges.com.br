import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TrackStage } from '../../models/community.model';
import { Reveal } from '../../directives/reveal';
import { IconAngular } from '../icons/icon-angular';
import { IconCaret } from '../icons/icon-caret';
import { IconDevops } from '../icons/icon-devops';
import { IconGcp } from '../icons/icon-gcp';
import { IconGitGithub } from '../icons/icon-git-github';
import { IconHtmlCss } from '../icons/icon-html-css';
import { IconJava } from '../icons/icon-java';
import { IconNestjs } from '../icons/icon-nestjs';
import { IconSpring } from '../icons/icon-spring';
import { IconSql } from '../icons/icon-sql';
import { IconStacks } from '../icons/icon-stacks';
import { IconVercel } from '../icons/icon-vercel';

/**
 * Trilha da Seita Dev: uma timeline vertical em que cada etapa é um accordion.
 * Usa `<details>` nativo, então abre e fecha por teclado e continua legível sem JavaScript.
 */
@Component({
  selector: 'app-track-timeline',
  imports: [
    IconStacks,
    IconJava,
    IconSql,
    IconGitGithub,
    IconSpring,
    IconGcp,
    IconHtmlCss,
    IconVercel,
    IconAngular,
    IconDevops,
    IconNestjs,
    IconCaret,
    Reveal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="track">
      <span class="track__spine" aria-hidden="true"></span>

      @for (stage of stages(); track stage.id) {
        <li class="stage" appReveal>
          <span class="stage__node" aria-hidden="true">
            <span class="stage__order">{{ stage.order }}</span>
          </span>

          <details class="stage__box" [attr.name]="single() ? group : null">
            <summary class="stage__head">
              <span class="stage__icon" aria-hidden="true">
                @switch (stage.icon) {
                  @case ('stacks') {
                    <app-icon-stacks />
                  }
                  @case ('java') {
                    <app-icon-java />
                  }
                  @case ('sql') {
                    <app-icon-sql />
                  }
                  @case ('git-github') {
                    <app-icon-git-github />
                  }
                  @case ('spring') {
                    <app-icon-spring />
                  }
                  @case ('gcp') {
                    <app-icon-gcp />
                  }
                  @case ('html-css') {
                    <app-icon-html-css />
                  }
                  @case ('vercel') {
                    <app-icon-vercel />
                  }
                  @case ('angular') {
                    <app-icon-angular />
                  }
                  @case ('devops') {
                    <app-icon-devops />
                  }
                  @case ('nestjs') {
                    <app-icon-nestjs />
                  }
                }
              </span>

              <span class="stage__text">
                <span class="stage__area u-mono">{{ stage.area }}</span>
                <span class="stage__title">{{ stage.title }}</span>
              </span>

              <span class="stage__caret"><app-icon-caret /></span>
            </summary>

            <ul class="stage__topics">
              @for (topic of stage.topics; track topic) {
                <li>{{ topic }}</li>
              }
            </ul>
          </details>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
    }

    .track {
      position: relative;
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0 0 0 2.75rem;
      list-style: none;
    }

    /* Traço contínuo entre as etapas: a trilha é uma sequência, não uma lista solta. */
    .track__spine {
      position: absolute;
      top: 1rem;
      bottom: 1rem;
      left: 1.05rem;
      width: 2px;
      border-radius: 2px;
      background: linear-gradient(180deg, var(--accent) 0%, var(--violet) 100%);
      opacity: 0.35;
    }

    .stage {
      position: relative;
    }

    .stage__node {
      position: absolute;
      top: 0.7rem;
      left: -2.75rem;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 2.15rem;
      height: 2.15rem;
      border-radius: 50%;
      background: var(--paper);
      box-shadow: 0 0 0 2px var(--screen);
      color: var(--accent-deep);
      transition:
        box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1),
        color 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .stage__order {
      font-family: var(--font-mono);
      font-size: var(--step--1);
      font-weight: 700;
      line-height: 1;
    }

    .stage:hover .stage__node,
    .stage:focus-within .stage__node {
      box-shadow: 0 0 0 2px var(--accent), var(--shadow-glow);
    }

    .stage__box {
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      transition: box-shadow 260ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .stage__box[open] {
      box-shadow: var(--shadow-hard);
    }

    .stage__head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1rem;
      border-radius: inherit;
      cursor: pointer;
      list-style: none;
    }

    .stage__head::-webkit-details-marker {
      display: none;
    }

    .stage__head:focus-visible {
      outline: 3px solid var(--link-blue);
      outline-offset: 2px;
    }

    .stage__icon {
      display: inline-flex;
      flex: none;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--gradient-accent);
      color: #fff;
    }

    .stage__text {
      display: grid;
      gap: 0.1rem;
      min-width: 0;
      flex: 1;
    }

    .stage__area {
      font-size: var(--step--1);
      font-weight: 700;
      color: var(--accent-deep);
    }

    .stage__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.2;
      color: var(--ink);
    }

    .stage__caret {
      display: inline-flex;
      flex: none;
      color: var(--ink-soft);
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .stage__box[open] .stage__caret {
      transform: rotate(180deg);
    }

    .stage__topics {
      display: grid;
      gap: 0.5rem;
      margin: 0;
      padding: 0 1.25rem 1.1rem 3.4rem;
      list-style: none;
      color: var(--ink-soft);
      line-height: 1.5;
      animation: anim-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .stage__topics li {
      position: relative;
    }

    .stage__topics li::before {
      content: '';
      position: absolute;
      top: 0.6em;
      left: -1rem;
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: var(--accent);
    }

    @media (prefers-reduced-motion: reduce) {
      .stage__topics {
        animation: none;
      }
    }

    @media (min-width: 48rem) {
      .track {
        gap: 1.15rem;
      }

      .stage__head {
        padding: 1.1rem 1.35rem;
      }

      .stage__topics {
        grid-template-columns: repeat(2, 1fr);
        padding-bottom: 1.35rem;
      }
    }
  `
})
export class TrackTimeline {
  readonly stages = input.required<readonly TrackStage[]>();

  /** Quando verdadeiro, abrir uma etapa fecha a anterior (`name` compartilhado do `<details>`). */
  readonly single = input(false);

  protected readonly group = 'trilha-seita';
}

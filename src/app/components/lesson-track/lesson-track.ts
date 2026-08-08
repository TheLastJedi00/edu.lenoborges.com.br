import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../../directives/reveal';
import { LessonStep } from '../../models/profile.model';

/**
 * Trilha da primeira aula: a sequência de passos entre a mensagem e o projeto publicado.
 * O traço vertical é desenhado conforme a página rola (`animation-timeline: view()`);
 * onde isso não existe, ele já nasce inteiro — nenhuma informação depende do movimento.
 */
@Component({
  selector: 'app-lesson-track',
  imports: [Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="track">
      <span class="track__spine" aria-hidden="true"></span>

      @for (step of steps(); track step.id) {
        <li class="step" appReveal>
          <span class="step__node" aria-hidden="true">
            <span class="step__order">{{ step.order }}</span>
          </span>
          <div class="step__body">
            <p class="step__meta u-mono">{{ step.meta }}</p>
            <h3 class="step__title">{{ step.title }}</h3>
            <p class="step__detail">{{ step.detail }}</p>
          </div>
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
      gap: 1.75rem;
      margin: 0;
      padding: 0 0 0 2.75rem;
      list-style: none;
    }

    /* Calha da trilha: o traço apagado que o gradiente percorre. */
    .track__spine {
      position: absolute;
      top: 0.75rem;
      bottom: 0.75rem;
      left: 1.05rem;
      width: 2px;
      border-radius: 2px;
      background: var(--screen);
      overflow: hidden;
    }

    .track__spine::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(180deg, var(--accent) 0%, var(--violet) 100%);
      transform-origin: top;
      transform: scaleY(1);
    }

    /* Onde o navegador sabe animar por scroll, o traço acompanha a leitura. */
    @supports (animation-timeline: view()) {
      .track__spine::after {
        animation: anim-draw linear both;
        animation-timeline: view();
        animation-range: cover 12% cover 68%;
      }
    }

    .step {
      position: relative;
    }

    .step__node {
      position: absolute;
      top: 0.15rem;
      left: -2.75rem;
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

    .step__order {
      font-family: var(--font-mono);
      font-size: var(--step--1);
      font-weight: 700;
      line-height: 1;
    }

    .step:hover .step__node,
    .step:focus-within .step__node {
      box-shadow: 0 0 0 2px var(--accent), var(--shadow-glow);
    }

    .step__body {
      padding: 1.1rem 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      transition:
        transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 260ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .step:hover .step__body {
      transform: translateY(-4px);
      box-shadow: var(--shadow-hard);
    }

    .step__meta {
      color: var(--accent-deep);
      font-weight: 700;
    }

    .step__title {
      margin-top: 0.35rem;
      font-size: var(--step-1);
      line-height: 1.25;
    }

    .step__detail {
      margin-top: 0.5rem;
      color: var(--ink-soft);
      line-height: 1.55;
    }

    @media (min-width: 48rem) {
      .track {
        gap: 2rem;
      }

      .step__body {
        padding: 1.5rem 1.75rem;
      }
    }
  `
})
export class LessonTrack {
  readonly steps = input.required<readonly LessonStep[]>();
}

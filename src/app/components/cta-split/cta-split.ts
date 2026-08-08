import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelButton } from '../pixel-button/pixel-button';

/** Duas chamadas lado a lado: instituição e estudante. O destino de cada uma vem da smart page. */
@Component({
  selector: 'app-cta-split',
  imports: [PixelButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="split">
      <article class="option">
        <p class="option__eyebrow u-mono">Para instituições</p>
        <h3 class="option__title">Quer levar aulas de programação para sua equipe ou turma?</h3>
        <p class="option__desc">Parcerias, capacitação de times e turmas fechadas sob medida.</p>
        <app-pixel-button [href]="institutionHref()" [external]="true">
          Falar sobre parceria
        </app-pixel-button>
      </article>

      <article class="option option--accent">
        <p class="option__eyebrow u-mono">Para estudantes</p>
        <h3 class="option__title">Quer aprender programação com aula particular?</h3>
        <p class="option__desc">
          Aulas individuais para criança, jovem ou adulto, no ritmo de cada aluno.
        </p>
        <app-pixel-button [href]="studentHref()" [external]="true" variant="ghost">
          Agendar aula particular
        </app-pixel-button>
      </article>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .split {
      display: grid;
      gap: 1rem;
    }

    .option {
      padding: 1.5rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--gradient-panel);
      box-shadow: var(--shadow-hard-sm);
    }

    .option--accent {
      background: var(--gradient-accent-strong);
      box-shadow: var(--shadow-hard);
    }

    .option__eyebrow {
      color: var(--accent-deep);
      font-weight: 700;
    }

    .option--accent .option__eyebrow {
      color: #fff;
    }

    /* Cor explícita: o card claro pode estar dentro de um painel escuro, e sem
       isto o título herda o texto claro do painel e some no próprio fundo. */
    .option__title {
      margin-top: 0.5rem;
      color: var(--ink);
      font-size: var(--step-1);
      line-height: 1.3;
    }

    .option--accent .option__title {
      color: #fff;
    }

    .option__desc {
      margin-top: 0.5rem;
      color: var(--ink-soft);
      line-height: 1.5;
    }

    .option--accent .option__desc {
      color: #fff;
    }

    .option app-pixel-button {
      display: block;
      margin-top: 1.25rem;
    }

    @media (min-width: 40rem) {
      .split {
        grid-template-columns: 1fr 1fr;
      }
    }
  `
})
export class CtaSplit {
  readonly institutionHref = input.required<string>();
  readonly studentHref = input.required<string>();
}

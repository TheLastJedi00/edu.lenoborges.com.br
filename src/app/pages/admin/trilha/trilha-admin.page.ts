import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityService } from '../../../services/community.service';
import { STAGE_PHASE_LABEL } from '../../../models/community.model';

/**
 * Escolha da insígnia a administrar.
 *
 * Sem contagem de vídeos por etapa, e isso é uma escolha: a contagem exigiria
 * treze requisições na abertura da tela, ou um endpoint novo. O admin abre a
 * insígnia e vê a lista — que é o passo seguinte de qualquer jeito.
 */
@Component({
  selector: 'app-admin-trilha-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header>
        <p class="u-mono page__eyebrow">Administração</p>
        <h1 class="page__title">Conteúdo da trilha</h1>
        <p class="page__lead">
          Escolha a insígnia para publicar, editar e reordenar os vídeos dela.
        </p>
      </header>

      <ul class="stages">
        @for (stage of stages(); track stage.id) {
          <li>
            <a class="stage" [routerLink]="['/dashboard/admin/trilha', stage.id]">
              <span class="stage__phase u-mono">{{ phaseLabel(stage.phase) }}</span>
              <span class="stage__title">{{ stage.title }}</span>
              <span class="stage__area u-mono">{{ stage.area }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .page {
      display: grid;
      gap: 1.25rem;
      padding: 1.25rem 1rem 4rem;
    }

    .page__eyebrow {
      color: var(--accent-deep);
      font-size: var(--step--1);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .page__title {
      font-family: var(--font-display);
      font-size: var(--step-3);
      line-height: 1.05;
      margin: 0.2rem 0 0;
    }

    .page__lead {
      margin: 0.5rem 0 0;
      color: var(--ink-soft);
    }

    .stages {
      display: grid;
      gap: 0.6rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    @media (min-width: 48rem) {
      .stages {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 64rem) {
      .stages {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .stage {
      display: grid;
      gap: 0.2rem;
      height: 100%;
      min-height: 4.5rem;
      padding: 0.85rem 1rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      color: var(--ink);
      text-decoration: none;
    }

    .stage__phase {
      font-size: 0.65rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .stage__title {
      font-weight: 700;
      line-height: 1.2;
    }

    .stage__area {
      font-size: var(--step--1);
      color: var(--accent-deep);
    }

    @media (hover: hover) {
      .stage:hover {
        border-color: var(--accent-deep);
      }
    }
  `
})
export class AdminTrilhaPage {
  private readonly community = inject(CommunityService);

  protected readonly stages = computed(() => this.community.trackStages());

  protected phaseLabel(phase: 'gym' | 'elite' | 'frontier'): string {
    return STAGE_PHASE_LABEL[phase];
  }
}

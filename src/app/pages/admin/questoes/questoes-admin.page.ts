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
 * Escolha da insígnia cujo banco de questões será administrado (spec 022,
 * decisão 9).
 *
 * **As treze aparecem, e não as oito.** A Elite Four e a Battle Frontier não têm
 * GYM Challenge (ponto Q.2) e a API responde `404` para elas — e é ela quem diz
 * isso, num lugar só. Esconder as cinco aqui duplicaria a regra no front, e a
 * cópia envelheceria calada no dia em que a Elite Four ganhasse desafio.
 *
 * Sem contagem por etapa, pela mesma razão escrita no `AdminTrilhaPage`: ela
 * exigiria treze requisições na abertura da tela, e o admin abre a insígnia
 * mesmo assim.
 */
@Component({
  selector: 'app-admin-questoes-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <a routerLink="/dashboard/admin" class="back u-mono">← Administração</a>

      <header>
        <h1 class="page__title">Banco de questões</h1>
        <p class="page__lead">
          Escolha a insígnia para cadastrar, revisar e gerar as questões do GYM Challenge
          dela. São 30 por nível — 90 no total — para o desafio sair de "Em breve".
        </p>
      </header>

      <ul class="stages">
        @for (stage of stages(); track stage.id) {
          <li>
            <a class="stage" [routerLink]="['/dashboard/admin/questoes', stage.id]">
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

    /*
     * O caminho de volta para a Administração.
     *
     * **Toda página filha do painel tem o dela.** Sem ele a única saída é o botão
     * do navegador, e a barra lateral leva para o painel inteiro em vez de um
     * passo atrás.
     */
    .back {
      justify-self: start;
      min-height: 2.75rem;
      display: inline-flex;
      align-items: center;
      color: var(--ink-soft);
      font-size: var(--step--1);
      text-decoration: none;
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
      max-width: 56ch;
      color: var(--ink-soft);
      line-height: 1.55;
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
export class AdminQuestoesPage {
  private readonly community = inject(CommunityService);

  protected readonly stages = computed(() => this.community.trackStages());

  protected phaseLabel(phase: 'gym' | 'elite' | 'frontier'): string {
    return STAGE_PHASE_LABEL[phase];
  }
}

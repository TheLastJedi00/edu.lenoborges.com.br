import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STAGE_PHASE_LABEL, TrackStage } from '../../models/community.model';

/**
 * Uma etapa da trilha, como cartão selecionável.
 *
 * **Nenhum estado impede o clique.** A trilha não é presa: o aluno escolhe qual
 * insígnia quer conquistar e pode pular. O cartão informa onde ele está — se já
 * conquistou, se há conteúdo — e nada mais. Ver a decisão 6 da spec 009.
 */
@Component({
  selector: 'app-badge-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="badge"
      [class.badge--conquered]="conquered()"
      [routerLink]="['/dashboard/trilha', stage().id]"
    >
      <span class="badge__phase u-mono">{{ phaseLabel() }}</span>

      <span class="badge__title">{{ stage().title }}</span>

      <span class="badge__area u-mono">{{ stage().area }}</span>

      <span class="badge__state" [class.badge__state--conquered]="conquered()">
        @if (conquered()) {
          Conquistada
        } @else {
          Disponível
        }
      </span>
    </a>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .badge {
      display: grid;
      gap: 0.3rem;
      align-content: start;
      height: 100%;
      /* 44px é o piso de toque, e um cartão de trilha tem de ser bem maior que
         isso — mas o min-height evita que uma etapa de título curto encolha até
         virar um alvo difícil no polegar. */
      min-height: 7rem;
      padding: 1rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      color: var(--ink);
      text-decoration: none;
      box-shadow: var(--shadow-hard-sm);
      transition:
        transform var(--motion-2, 200ms) var(--ease-out, ease),
        box-shadow var(--motion-2, 200ms) var(--ease-out, ease);
    }

    .badge--conquered {
      border-color: var(--accent-deep);
      background: var(--gradient-panel);
    }

    /*
     * Conquista comemora, e comemora UMA vez.
     *
     * O pulso roda no selo de estado, não no cartão inteiro, e não entra em
     * loop: movimento que pulsa sozinho na tela cansa em três segundos e rouba a
     * atenção de quem está lendo os títulos ao lado. Só transform, para não
     * forçar layout.
     */
    .badge__state--conquered {
      animation: badge-pulse var(--motion-3, 320ms) var(--ease-out, ease) 1;
      transform-origin: left center;
    }

    @keyframes badge-pulse {
      0% {
        transform: scale(1);
      }
      55% {
        transform: scale(1.12);
      }
      100% {
        transform: scale(1);
      }
    }

    .badge__phase {
      font-size: 0.65rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .badge__title {
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      line-height: 1.15;
    }

    .badge__area {
      font-size: var(--step--1);
      color: var(--accent-deep);
    }

    .badge__state {
      margin-top: 0.35rem;
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    .badge__state--conquered {
      color: var(--accent-deep);
      font-weight: 700;
    }

    .badge:active {
      transform: scale(0.985);
    }

    @media (hover: hover) {
      .badge:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-hard);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .badge {
        transition: none;
      }

      .badge:active,
      .badge:hover {
        transform: none;
      }
    }
  `
})
export class BadgeCard {
  readonly stage = input.required<TrackStage>();
  /** Se o membro já concluiu esta etapa. Informa, nunca impede. */
  readonly conquered = input<boolean>(false);

  protected readonly phaseLabel = computed(
    () => STAGE_PHASE_LABEL[this.stage().phase]
  );
}

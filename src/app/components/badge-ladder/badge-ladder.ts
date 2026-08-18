import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeProgress, CommunityTier } from '../../models/community.model';
import { Reveal } from '../../directives/reveal';

/**
 * Progressão das oito Insígnias e o que cada tier abre.
 *
 * A régua tem duas naturezas no mesmo desenho, de propósito: os oito passos de
 * insígnia são escada, e as quatro Elite Battles do fim são o prêmio. Um vão
 * separa os dois, para as últimas não lerem como "mais quatro degraus".
 */
@Component({
  selector: 'app-badge-ladder',
  imports: [Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ladder" appReveal>
      <p class="ladder__caption">
        <strong>{{ progress().freeBadges }}</strong> das
        <strong>{{ progress().totalBadges }}</strong> Insígnias são livres para qualquer pessoa
      </p>

      <ol class="ladder__rail" aria-hidden="true">
        @for (badge of badges(); track badge) {
          <li class="ladder__step" [class.ladder__step--free]="badge <= progress().freeBadges"></li>
        }
        <li class="ladder__gap"></li>
        @for (round of eliteRounds(); track round) {
          <li class="ladder__step ladder__step--elite"></li>
        }
      </ol>

      <p class="ladder__legend u-mono">8 GYM Battles, depois a Elite Four</p>
    </div>

    <ul class="tiers">
      @for (tier of tiers(); track tier.id) {
        <li class="tier" [class.tier--paid]="tier.paid" appReveal>
          <p class="tier__name">{{ tier.name }}</p>
          <p class="tier__range u-mono">{{ tier.range }}</p>
          <p class="tier__price" [class.tier__price--hint]="tier.paid">{{ tier.priceHint }}</p>
          <p class="tier__summary">{{ tier.summary }}</p>
          <ul class="tier__perks">
            @for (perk of tier.perks; track perk) {
              <li>{{ perk }}</li>
            }
          </ul>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .ladder {
      display: grid;
      gap: 0.75rem;
    }

    .ladder__caption {
      color: var(--ink-soft);
    }

    .ladder__caption strong {
      color: var(--accent-deep);
      font-family: var(--font-display);
      font-size: var(--step-1);
    }

    .ladder__rail {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .ladder__step {
      flex: 1 1 0.5rem;
      min-width: 0.35rem;
      height: 0.75rem;
      border-radius: 999px;
      background: var(--screen);
    }

    .ladder__step--free {
      background: var(--gradient-accent);
      box-shadow: var(--shadow-glow);
    }

    /* O vão é o que impede as Elite Battles de lerem como mais quatro degraus. */
    .ladder__gap {
      flex: 0 0 1.25rem;
    }

    .ladder__step--elite {
      flex: 0 0 1.1rem;
      border: var(--border-w) solid var(--accent-deep);
      background: transparent;
    }

    .ladder__legend {
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    .tiers {
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .tier {
      display: grid;
      gap: 0.5rem;
      padding: 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      transition:
        transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .tier:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-hard);
    }

    .tier--paid {
      background: var(--gradient-panel);
    }

    .tier__name {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.1;
      color: var(--ink);
    }

    .tier__range {
      font-weight: 700;
      color: var(--accent-deep);
    }

    .tier__price {
      font-family: var(--font-display);
      font-size: var(--step-2);
      font-weight: 700;
      line-height: 1.1;
      color: var(--ink);
    }

    /*
     * "Preço na plataforma" não é um preço e não pode ter o peso de um: ele diz
     * por que o espaço está vazio. Com o mesmo tamanho do "Gratuito", o olho lê
     * os dois como a mesma categoria de informação, e o cartão pago passa a
     * parecer que esconde algo em vez de apontar para onde a informação está.
     */
    .tier__price--hint {
      font-family: var(--font-body);
      font-size: var(--step--1);
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .tier__summary {
      color: var(--ink-soft);
      line-height: 1.55;
    }

    .tier__perks {
      display: grid;
      gap: 0.4rem;
      margin: 0.25rem 0 0;
      padding: 0;
      list-style: none;
      color: var(--ink-soft);
    }

    .tier__perks li {
      position: relative;
      padding-left: 1rem;
      line-height: 1.5;
    }

    .tier__perks li::before {
      content: '';
      position: absolute;
      top: 0.6em;
      left: 0;
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: var(--accent);
    }

    /* Com quatro tiers (spec 009), empilhar no celular vira uma rolagem longa
       demais para uma comparação — e quatro colunas espremidas não são uma
       tabela, são um problema. O carrossel com scroll-snap mantém o gesto
       natural do polegar e deixa um cartão inteiro por vez na tela. */
    @media (max-width: 47.999rem) {
      .tiers {
        grid-auto-flow: column;
        grid-auto-columns: 85%;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        /* O padding lateral deixa o cartão vizinho aparecendo, que é o que
           denuncia haver mais coisa ao lado. Sem ele, o carrossel parece uma
           coluna só. */
        padding: 0.25rem 1rem 0.75rem 0;
        scrollbar-width: thin;
      }

      .tier {
        scroll-snap-align: start;
      }

      /* Sem isto o cartão sobe para fora da área visível ao ser tocado, porque
         o :hover do desktop também dispara no primeiro toque em telas de toque. */
      .tier:hover {
        transform: none;
      }
    }

    /* Os tiers passaram de dois para três na spec 008 e de três para quatro na
       009. Em telas médias eles ficam em duas colunas, o que é honesto: dois
       degraus por linha ainda leem como escada. A grade de quatro só entra
       quando cabe inteira — meia linha órfã destacaria um tier sem intenção. */
    @media (min-width: 48rem) {
      .tiers {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 75rem) {
      .tiers {
        grid-template-columns: repeat(4, 1fr);
      }

      .tier {
        padding: 1.6rem;
      }
    }
  `
})
export class BadgeLadder {
  readonly progress = input.required<BadgeProgress>();
  readonly tiers = input.required<readonly CommunityTier[]>();

  protected readonly badges = computed(() =>
    Array.from({ length: this.progress().totalBadges }, (_, index) => index + 1)
  );

  /** As quatro Elite Battles. Fixas: a Elite Four é quatro por definição. */
  protected readonly eliteRounds = computed(() => [1, 2, 3, 4]);
}

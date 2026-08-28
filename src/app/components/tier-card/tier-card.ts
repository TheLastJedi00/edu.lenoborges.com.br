import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BillingTier } from '../../models/billing.model';
import { formatBRL } from '../../core/money';

/**
 * Um degrau da escada de tiers, com preço.
 *
 * Só existe dentro do painel: é o único componente do app que renderiza valor em
 * reais, e ele nunca é montado a partir de conteúdo local — o preço chega de
 * `GET /billing/tiers`, que exige sessão.
 */
@Component({
  selector: 'app-tier-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="card"
      [class.card--current]="current()"
      [class.card--free]="tier().period === 'gratuito'"
    >
      @if (current()) {
        <p class="card__flag u-mono">Seu plano hoje</p>
      }

      <h3 class="card__name">{{ tier().name }}</h3>

      <p class="card__price">
        {{ price() }}
        @if (tier().period === 'mensal') {
          <span class="card__period">/mês</span>
        }
      </p>

      <p class="card__summary">{{ tier().summary }}</p>

      <ul class="card__perks">
        @for (perk of tier().perks; track perk; let i = $index) {
          <!--
            O primeiro item de todo tier pago é "Tudo do <anterior>", e ele entra
            apagado de propósito: repetir por extenso a lista inteira do degrau
            de baixo em quatro cartões vira um muro, principalmente no celular.
            Apagado, ele diz "isto você já tem" sem gastar a atenção.
          -->
          <li [class.card__perk--inherited]="i === 0 && tier().price > 0">{{ perk }}</li>
        }
      </ul>

      @if (!current()) {
        <button
          type="button"
          class="card__cta"
          [disabled]="!upgradeDisponivel()"
          (click)="upgrade.emit(tier())"
        >
          @if (upgradeDisponivel()) {
            Quero o {{ tier().name }}
          } @else {
            Em breve
          }
        </button>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .card {
      display: grid;
      /* auto-rows + o CTA no fim alinham os botões entre cartões de altura
         diferente, sem depender de os textos terem o mesmo tamanho. */
      grid-template-rows: auto auto auto auto 1fr auto;
      gap: 0.6rem;
      height: 100%;
      padding: 1.4rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      transition:
        transform var(--motion-2, 200ms) var(--ease-out, ease),
        box-shadow var(--motion-2, 200ms) var(--ease-out, ease);
    }

    .card--current {
      border-color: var(--accent-deep);
      background: var(--gradient-panel);
    }

    .card__flag {
      align-self: start;
      justify-self: start;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: var(--accent-deep);
      color: var(--paper);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .card__name {
      font-family: var(--font-display);
      font-size: var(--step-1);
      line-height: 1.1;
      margin: 0;
    }

    .card__price {
      font-family: var(--font-display);
      font-size: var(--step-3);
      font-weight: 700;
      line-height: 1;
      margin: 0;
      color: var(--accent-deep);
    }

    .card__period {
      font-family: var(--font-body);
      font-size: var(--step--1);
      font-weight: 600;
      color: var(--ink-soft);
    }

    .card__summary {
      margin: 0;
      color: var(--ink-soft);
      line-height: 1.5;
    }

    .card__perks {
      display: grid;
      gap: 0.35rem;
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--ink);
    }

    .card__perks li::before {
      content: '▸ ';
      color: var(--accent-deep);
    }

    .card__perk--inherited {
      color: var(--ink-soft);
      opacity: 0.75;
    }

    .card__cta {
      /* 44px de alvo, no mínimo: é a régua de toque da spec 009. */
      min-height: 2.75rem;
      padding: 0.7rem 1rem;
      border: var(--border-w) solid var(--ink);
      border-radius: var(--radius-sm);
      background: var(--ink);
      color: var(--paper);
      font-family: var(--font-body);
      font-size: var(--step-0);
      font-weight: 700;
      cursor: pointer;
      transition: transform var(--motion-1, 120ms) var(--ease-out, ease);
    }

    .card__cta:active {
      transform: scale(0.98);
    }

    .card__cta:disabled {
      border-color: var(--border-soft);
      background: var(--border-soft);
      color: var(--ink-soft);
      cursor: not-allowed;
    }

    .card__cta:disabled:active {
      transform: none;
    }

    @media (hover: hover) {
      .card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-hard);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .card,
      .card__cta {
        transition: none;
      }
    }
  `
})
export class TierCard {
  readonly tier = input.required<BillingTier>();
  readonly current = input<boolean>(false);

  /**
   * Liga e desliga o botão de troca de plano.
   *
   * **O cartão continua burro**: ele não conhece a constante que decide isto,
   * não sabe de sessão e não sabe por que está desabilitado. Quem sabe é a
   * página do Financeiro, que é quem tem o contexto (decisão 4 da spec 020).
   *
   * `disabled` sozinho é silencioso para quem navega por teclado — o botão
   * simplesmente não recebe foco — e por isso o aviso de "em breve" é texto na
   * página, e não uma frase por cartão.
   */
  readonly upgradeDisponivel = input<boolean>(true);

  readonly upgrade = output<BillingTier>();

  /**
   * O rótulo da API é fallback, nunca fonte.
   *
   * Formatar aqui, a partir dos centavos, é o que garante que a tela inteira
   * fale a mesma língua — dois formatadores discordando mostram `R$ 260` num
   * lugar e `R$ 260,00` no outro.
   */
  protected readonly price = computed(() => {
    const tier = this.tier();
    return tier.period === 'gratuito' ? 'Gratuito' : formatBRL(tier.price);
  });
}

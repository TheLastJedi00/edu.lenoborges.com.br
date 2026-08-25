import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';
import { IconBell } from '../icons/icon-bell';

/**
 * O sino do painel (spec 012).
 *
 * Componente burro: recebe a contagem e o estado do painel, emite o toque. Quem
 * sabe o que é uma notificação é a casca do painel.
 *
 * **Ele vive em dois lugares**, e não em um: o `<header>` do painel só existe no
 * celular, então no desktop o sino mora no topo do menu lateral. Um sino "no
 * header" simplesmente não apareceria para quem usa computador, e criar um
 * header de desktop para hospedar um ícone seria reorganizar o painel inteiro.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [IconBell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="bell"
      [class.bell--calling]="calling()"
      [attr.aria-expanded]="open()"
      aria-controls="painel-notificacoes"
      aria-haspopup="dialog"
      [attr.aria-label]="label()"
      (click)="toggle.emit()"
    >
      <app-icon-bell class="bell__icon" />

      @if (count() > 0) {
        <span class="bell__count" aria-hidden="true">{{ shortCount() }}</span>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .bell {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /* 44px de alvo real. O sino fica na barra do topo, que é a pior região
         para o polegar, e o alvo compensa o que a posição não pode. */
      min-width: 2.75rem;
      min-height: 2.75rem;
      padding: 0.4rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--ink-soft);
      cursor: pointer;
      transition:
        background var(--motion-1) var(--ease-out),
        color var(--motion-1) var(--ease-out);
    }

    .bell:hover,
    .bell[aria-expanded='true'] {
      background: var(--screen-lit);
      color: var(--ink);
    }

    /*
     * Com não lidas o sino balança por 700ms a cada 8s, e o brilho pulsa no
     * mesmo compasso.
     *
     * Periódico, e não contínuo, de propósito: animação sem pausa é a diferença
     * entre "tem novidade" e "tem uma coisa piscando no canto da tela". A
     * primeira faz olhar; a segunda ensina a não olhar, e este ícone fica na
     * tela a sessão inteira.
     */
    .bell--calling .bell__icon {
      color: var(--ink);
      animation: anim-bell-shake 8s var(--ease-out) infinite;
      transform-origin: 50% 15%;
    }

    .bell--calling::before {
      content: '';
      position: absolute;
      inset: 0.15rem;
      border-radius: var(--radius-sm);
      background: radial-gradient(
        circle at 50% 45%,
        rgba(255, 138, 43, 0.5) 0%,
        rgba(255, 138, 43, 0) 70%
      );
      animation: anim-bell-glow 8s ease-in-out infinite;
      pointer-events: none;
    }

    .bell__icon {
      position: relative;
    }

    .bell__count {
      position: absolute;
      top: 0.3rem;
      right: 0.3rem;
      min-width: 1.05rem;
      padding: 0 0.25rem;
      border-radius: 999px;
      background: var(--gradient-accent-strong);
      color: #fff;
      font-family: var(--font-mono);
      font-size: 0.66rem;
      line-height: 1.05rem;
      text-align: center;
    }

    @keyframes anim-bell-shake {
      0%,
      91.25%,
      100% {
        transform: rotate(0deg);
      }

      92.5% {
        transform: rotate(-11deg);
      }

      94.5% {
        transform: rotate(9deg);
      }

      96.5% {
        transform: rotate(-6deg);
      }

      98.5% {
        transform: rotate(3deg);
      }
    }

    @keyframes anim-bell-glow {
      0%,
      88%,
      100% {
        opacity: 0;
      }

      93% {
        opacity: 1;
      }
    }

    /*
     * Quem pediu menos movimento continua sabendo que há notificação: some a
     * animação, não a informação. O contador é estático e fica.
     *
     * Um ícone que sacode a cada oito segundos é exatamente o padrão que dispara
     * desconforto vestibular, e ele fica na tela a sessão inteira.
     */
    @media (prefers-reduced-motion: reduce) {
      .bell--calling .bell__icon {
        animation: none;
      }

      .bell--calling::before {
        animation: none;
        opacity: 0;
      }
    }
  `
})
export class NotificationBell {
  readonly count = input<number>(0);
  readonly open = input<boolean>(false);

  readonly toggle = output<void>();

  /** Balança só quando há o que ler, e para assim que o painel abre. */
  protected readonly calling = computed(() => this.count() > 0 && !this.open());

  /**
   * `9+` acima de nove.
   *
   * Sem número, "tem alguma coisa" e "tem oito coisas" seriam o mesmo ponto, e a
   * pessoa abriria o painel só para descobrir o tamanho do trabalho.
   */
  protected readonly shortCount = computed(() =>
    this.count() > 9 ? '9+' : String(this.count())
  );

  /** Por extenso, que é o que faz o recurso existir para quem usa leitor de tela. */
  protected readonly label = computed(() => {
    const total = this.count();

    if (total === 0) {
      return 'Notificações, nenhuma não lida';
    }

    return `Notificações, ${total} não ${total === 1 ? 'lida' : 'lidas'}`;
  });
}

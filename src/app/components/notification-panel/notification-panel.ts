import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { AppNotification } from '../../models/notification.model';
import { describeNotificationTime } from '../../core/notifications/notification-time';
import { CommunityService } from '../../services/community.service';
import { IconCheck } from '../icons/icon-check';

/**
 * A lista de não lidas, deslizando por cima do painel (spec 012).
 *
 * Componente burro: recebe a lista, emite o que a pessoa tocou. Quem busca,
 * marca e desfaz é a casca do painel, com o store.
 */
@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [IconCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  },
  template: `
    @if (open()) {
      <!-- Fecha ao tocar fora. Sem isto, o único jeito de fechar seria voltar
           ao sino, que no celular é o canto mais longe do polegar. -->
      <div class="backdrop" aria-hidden="true" (click)="close.emit()"></div>

      <section
        id="painel-notificacoes"
        class="panel animate-enter--fade"
        [class.panel--start]="align() === 'start'"
        role="dialog"
        aria-label="Notificações"
      >
        <header class="panel__head">
          <h2 class="panel__title u-mono">Notificações</h2>
        </header>

        @if (notifications().length === 0) {
          <p class="panel__empty">Nada novo por aqui</p>
        } @else {
          <ul class="panel__list">
            @for (item of notifications(); track item.id) {
              <li class="row">
                <!--
                  A linha e o check são botões IRMÃOS, nunca aninhados: botão
                  dentro de botão é HTML inválido, e o navegador resolve isso do
                  jeito dele. Em alguns, o toque no check dispararia os dois, e a
                  pessoa marcaria como lida e abriria o modal de uma vez.
                -->
                <button
                  type="button"
                  class="row__open"
                  (click)="select.emit(item)"
                >
                  <span class="row__badge u-mono">{{ badge(item.badgeId) }}</span>
                  <span class="row__title">{{ item.title }}</span>
                </button>

                <span class="row__time u-mono" aria-hidden="true">
                  {{ time(item.createdAt) }}
                </span>

                <button
                  type="button"
                  class="row__check"
                  [attr.aria-label]="'Marcar como lida: ' + item.title"
                  (click)="markRead.emit(item.id)"
                >
                  <app-icon-check />
                </button>
              </li>
            }
          </ul>

          <footer class="panel__foot">
            <button type="button" class="panel__all" (click)="markAllRead.emit()">
              Marcar todas como lidas
            </button>
          </footer>
        }
      </section>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: transparent;
    }

    /*
     * Sobrepõe, e nunca empurra o conteúdo.
     *
     * Empurrar reflui a página inteira: a tela salta, o que estava sendo lido
     * muda de lugar, e fechar salta de volta. Sobrepor custa um z-index.
     */
    .panel {
      position: absolute;
      z-index: 61;
      top: calc(100% + 0.5rem);
      right: 0;
      width: min(22rem, calc(100vw - 2rem));
      display: flex;
      flex-direction: column;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      overflow: hidden;
      animation: anim-panel-down var(--motion-2) var(--ease-out) both;
    }

    /*
     * O painel abre para o lado que sobra, e quem sabe o lado é quem o coloca
     * na tela.
     *
     * O padrão right: 0 cresce 22rem PARA A ESQUERDA, que é o certo para o sino
     * da barra do celular — encostado na borda direita, é a única direção que
     * existe. No desktop o sino mudou de lado: mora no .aside__head, numa coluna
     * fixed; left: 0, e crescer para a esquerda joga o cartão para fora da
     * janela. Com o menu recolhido some quase inteiro.
     *
     * FORA das media queries de celular, de propósito: abaixo de 48rem o painel
     * é folha, com left e right próprios, e nada ali muda.
     */
    .panel--start {
      left: 0;
      right: auto;
    }

    .panel__head {
      padding: 0.85rem 1rem 0.6rem;
      border-bottom: var(--border-w) solid var(--border-soft);
    }

    .panel__title {
      font-size: var(--step--1);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .panel__empty {
      padding: 1.5rem 1rem;
      text-align: center;
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    .panel__list {
      /* Rola dentro do cartão: o painel nunca cresce além da janela. */
      max-height: 24rem;
      overflow-y: auto;
      /* Chegar ao fim da lista não pode arrastar a página atrás. */
      overscroll-behavior: contain;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 0.25rem;
      border-bottom: var(--border-w) solid var(--border-soft);
    }

    .row:last-child {
      border-bottom: none;
    }

    .row__open {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-height: 2.75rem;
      padding: 0.7rem 0.25rem 0.7rem 1rem;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }

    .row__open:hover {
      background: var(--screen-lit);
    }

    .row__badge {
      font-size: 0.66rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .row__title {
      font-size: var(--step--1);
      line-height: 1.35;
      color: var(--ink);
      /*
       * Abreviar é do CSS, não do TypeScript. Cortar string em código dá
       * reticências no lugar errado em cada largura de tela, e a mesma linha
       * some inteira num aparelho estreito.
       */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .row__time {
      font-size: 0.66rem;
      color: var(--ink-soft);
      white-space: nowrap;
    }

    /*
     * O check fica no extremo oposto do que o polegar cruza ao rolar, com alvo
     * próprio de 44px. Colado no título, toda rolagem viraria uma chance de
     * apagar o aviso sem ler -- e não há como desfazer, porque não há histórico.
     */
    .row__check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.75rem;
      min-height: 2.75rem;
      margin-right: 0.25rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--ink-soft);
      cursor: pointer;
      transition: color var(--motion-1) var(--ease-out);
    }

    .row__check:hover {
      color: var(--accent-deep);
      background: var(--screen-lit);
    }

    .row__check app-icon-check {
      width: 1.15rem;
      height: 1.15rem;
    }

    .row__check :where(svg) {
      width: 1.15rem;
      height: 1.15rem;
    }

    .panel__foot {
      padding: 0.5rem;
      border-top: var(--border-w) solid var(--border-soft);
      background: var(--screen-lit);
    }

    .panel__all {
      width: 100%;
      min-height: 2.75rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--link-blue);
      font-size: var(--step--1);
      cursor: pointer;
    }

    .panel__all:hover {
      background: var(--paper);
    }

    @keyframes anim-panel-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* No celular o painel é folha: largura cheia, ancorado no topo. */
    @media (max-width: 47.999rem) {
      .panel {
        position: fixed;
        top: 3.75rem;
        right: 0.75rem;
        left: 0.75rem;
        width: auto;
      }

      .panel__list {
        max-height: 70svh;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .panel {
        animation: none;
      }
    }
  `
})
export class NotificationPanel {
  private readonly community = inject(CommunityService);

  readonly open = input<boolean>(false);
  readonly notifications = input<readonly AppNotification[]>([]);
  /**
   * De que borda do sino o painel se ancora.
   *
   * **`'end'` é o padrão porque é o comportamento de hoje e é o certo para a
   * barra do celular.** Um input obrigatório faria o host que já está certo
   * declarar o que já fazia.
   */
  readonly align = input<'start' | 'end'>('end');

  readonly select = output<AppNotification>();
  readonly markRead = output<string>();
  readonly markAllRead = output<void>();
  readonly close = output<void>();

  protected badge(badgeId: string): string {
    return this.community.badgeTitle(badgeId);
  }

  protected time(createdAt: string): string {
    return describeNotificationTime(createdAt);
  }

  protected onEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }
}

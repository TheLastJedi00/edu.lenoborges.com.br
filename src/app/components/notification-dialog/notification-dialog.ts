import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { AppNotification } from '../../models/notification.model';
import { CommunityService } from '../../services/community.service';

/**
 * O modal de uma notificação (spec 012).
 *
 * Uma frase, um botão, nenhuma escolha. Ele existe para dar o contexto que a
 * linha abreviada não cabe: **de qual insígnia é** e **que tipo de coisa é**.
 * Se ganhar um segundo botão vira uma tela, e ninguém abre uma tela para ver um
 * aviso.
 *
 * Usa `<dialog>` nativo pelo mesmo motivo do `confirm-dialog`: foco preso e Esc
 * já vêm resolvidos, e reimplementar isso à mão é onde a acessibilidade se
 * perde.
 */
@Component({
  selector: 'app-notification-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" (close)="close.emit()">
      @if (notification(); as item) {
        <p class="modal__kind u-mono">{{ kindLabel() }}</p>
        <h2 class="modal__title">{{ item.title }}</h2>
        <p class="modal__text">{{ sentence() }}</p>

        <button type="button" class="modal__go" (click)="go.emit(item)">
          {{ actionLabel() }}
        </button>
      }
    </dialog>
  `,
  styles: `
    .modal {
      width: min(26rem, calc(100vw - 2rem));
      padding: 1.5rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--paper);
      color: var(--ink);
      box-shadow: var(--shadow-hard);
    }

    .modal::backdrop {
      background: rgba(16, 24, 40, 0.45);
    }

    .modal[open] {
      animation: anim-pop var(--motion-3) var(--ease-out) both;
    }

    .modal__kind {
      font-size: 0.68rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .modal__title {
      margin-top: 0.35rem;
      font-size: var(--step-1);
      line-height: 1.3;
    }

    .modal__text {
      margin-top: 0.75rem;
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    .modal__go {
      width: 100%;
      min-height: 2.75rem;
      margin-top: 1.25rem;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--gradient-accent-strong);
      color: #fff;
      font-family: var(--font-body);
      font-size: var(--step-0);
      cursor: pointer;
      transition: filter var(--motion-1) var(--ease-out);
    }

    .modal__go:hover {
      filter: brightness(1.08);
    }

    @media (prefers-reduced-motion: reduce) {
      .modal[open] {
        animation: none;
      }
    }
  `
})
export class NotificationDialog {
  private readonly community = inject(CommunityService);
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('dialog');

  /** Nulo com o modal fechado. É o próprio dado que abre e fecha a caixa. */
  readonly notification = input<AppNotification | null>(null);

  readonly go = output<AppNotification>();
  readonly close = output<void>();

  protected readonly kindLabel = computed(() =>
    this.notification()?.kind === 'video' ? 'Vídeo novo' : 'Pergunta nova'
  );

  /**
   * A frase tem sempre a mesma forma, e é isso que a faz ser lida de relance.
   *
   * O nome da insígnia sai do catálogo da trilha, que já é a fonte dele nas
   * outras telas. A API manda só o `badgeId`.
   */
  protected readonly sentence = computed(() => {
    const item = this.notification();
    if (!item) {
      return '';
    }

    const badge = this.community.badgeTitle(item.badgeId);

    return item.kind === 'video'
      ? `Vídeo novo na ${badge}.`
      : `Pergunta nova no Mural, na ${badge}.`;
  });

  protected readonly actionLabel = computed(() =>
    this.notification()?.kind === 'video' ? 'Ver na trilha' : 'Ver no Mural'
  );

  constructor() {
    // Abrir e fechar seguem o dado, e não um método que alguém precisa lembrar
    // de chamar: com dois caminhos até o modal, um `open()` esquecido seria um
    // clique que não faz nada.
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) {
        return;
      }

      if (this.notification() && !element.open) {
        element.showModal();
      } else if (!this.notification() && element.open) {
        element.close();
      }
    });
  }
}

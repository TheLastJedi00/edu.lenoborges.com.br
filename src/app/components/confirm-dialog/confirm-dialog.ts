import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild
} from '@angular/core';

/**
 * Modal genérico e acessível de confirmação.
 * Utiliza `<dialog>` nativo, captura tecla Esc como cancelamento e prende o foco.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" (close)="onNativeClose()">
      <div class="modal__head">
        <h2 class="modal__title">{{ title() }}</h2>
      </div>

      <p class="modal__message">{{ message() }}</p>

      <div class="modal__actions">
        <button type="button" class="btn btn--cancel" (click)="cancel()">
          {{ cancelLabel() }}
        </button>
        <button
          #confirmBtn
          type="button"
          class="btn btn--confirm"
          [class.btn--danger]="danger()"
          (click)="confirm()"
        >
          {{ confirmLabel() }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(26rem, calc(100vw - 2rem));
      inset: 0;
      margin: auto;
      padding: 1.5rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      color: var(--ink);
    }

    .modal::backdrop {
      background: rgba(16, 24, 40, 0.6);
      backdrop-filter: blur(4px);
    }

    .modal[open] {
      animation: anim-rise 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .modal__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.25;
      color: var(--ink);
    }

    .modal__message {
      margin-top: 0.75rem;
      color: var(--ink-soft);
      font-size: var(--step-0);
      line-height: 1.5;
    }

    .modal__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.2rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-display);
      font-size: var(--step--1);
      font-weight: 700;
      cursor: pointer;
      transition: all 160ms ease-out;
    }

    .btn--cancel {
      border: var(--border-w) solid var(--screen-deep);
      background: var(--screen);
      color: var(--ink);
    }

    .btn--cancel:hover {
      background: var(--screen-lit);
    }

    .btn--confirm {
      border: none;
      background: var(--gradient-accent-strong);
      color: #fff;
      box-shadow: var(--shadow-hard-sm);
    }

    .btn--confirm:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-glow);
    }

    .btn--danger {
      background: #c0392b;
      color: #fff;
    }

    .btn--danger:hover {
      background: #a5281b;
    }

    @media (prefers-reduced-motion: reduce) {
      .modal[open] {
        animation: none;
      }
    }
  `
})
export class ConfirmDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  readonly title = input<string>('Confirmar ação');
  readonly message = input<string>('Deseja prosseguir com esta ação?');
  readonly confirmLabel = input<string>('Confirmar');
  readonly cancelLabel = input<string>('Cancelar');
  readonly danger = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private wasConfirmed = false;

  open(): void {
    this.wasConfirmed = false;
    this.dialog().nativeElement.showModal();
    setTimeout(() => {
      this.confirmBtn()?.nativeElement.focus();
    }, 50);
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  confirm(): void {
    this.wasConfirmed = true;
    this.dialog().nativeElement.close();
    this.confirmed.emit();
  }

  cancel(): void {
    this.wasConfirmed = false;
    this.dialog().nativeElement.close();
    this.cancelled.emit();
  }

  onNativeClose(): void {
    if (!this.wasConfirmed) {
      this.cancelled.emit();
    }
  }
}

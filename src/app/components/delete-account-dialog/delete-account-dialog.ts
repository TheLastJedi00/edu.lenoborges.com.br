import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

/**
 * A confirmação da exclusão de conta (spec 013, decisão 9).
 *
 * Não é o `confirm-dialog`, e a diferença é deliberada: esta é a única
 * confirmação do produto que **pede a senha no meio** e a única em que **o foco
 * inicial é o Cancelar**. O padrão daquele componente é focar o confirmar — aqui
 * é exceção declarada, não descuido, porque é a única tela do produto onde o
 * botão perigoso não pode estar a um Enter de distância.
 *
 * Sem "digite EXCLUIR para confirmar": digitar uma palavra prova atenção,
 * digitar a senha prova identidade — e identidade é o que uma operação
 * irreversível precisa. Pedir as duas é atrito empilhado que não compra nada.
 */
@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" aria-labelledby="titulo-modal-excluir">
      <h2 class="modal__title" id="titulo-modal-excluir">Excluir minha conta</h2>
      <p class="modal__message">
        Sua conta, seus dados e seus votos somem agora e para sempre; suas perguntas ficam no
        Mural como "Membro removido".
      </p>

      <label class="modal__field">
        <span class="modal__label">Senha atual</span>
        <input
          class="modal__input"
          type="password"
          autocomplete="current-password"
          [value]="password()"
          (input)="onPassword($event)"
        />
      </label>

      @if (errorMessage()) {
        <p class="modal__error" role="alert">{{ errorMessage() }}</p>
      }

      <div class="modal__actions">
        <button #cancelBtn type="button" class="modal__btn" (click)="close()">Cancelar</button>
        <button
          type="button"
          class="modal__btn modal__btn--danger"
          [disabled]="!password() || busy()"
          (click)="confirmed.emit(password())"
        >
          @if (busy()) {
            Excluindo…
          } @else {
            Excluir minha conta
          }
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      /* Largura de folha no celular, e altura que não corta os botões com o
         teclado virtual aberto — o pior caso desta tela. A unidade dvh acompanha o
         teclado do Safari do iPhone, onde vh não acompanha. */
      width: min(28rem, calc(100vw - 1.5rem));
      max-height: calc(100dvh - 1.5rem);
      overflow-y: auto;
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

    .modal__title {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--step-1);
      line-height: 1.25;
    }

    .modal__message {
      margin: 0.75rem 0 1rem;
      color: var(--ink-soft);
      font-size: var(--step--1);
      line-height: 1.55;
    }

    .modal__field {
      display: grid;
      gap: 0.35rem;
    }

    .modal__label {
      font-family: var(--font-display);
      font-size: var(--step--1);
      font-weight: 700;
    }

    .modal__input {
      min-height: 2.75rem;
      padding: 0.65rem 0.8rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: var(--screen);
      color: var(--ink);
      font-family: var(--font-body);
      font-size: var(--step-0);
      width: 100%;
    }

    .modal__error {
      margin: 0.75rem 0 0;
      color: #c0392b;
      font-size: var(--step--1);
    }

    .modal__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .modal__btn {
      min-height: 2.75rem;
      padding: 0.7rem 1.3rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--ink);
      font-family: var(--font-display);
      font-weight: 700;
      cursor: pointer;
    }

    /* O vermelho cheio do produto é daqui, e só daqui. */
    .modal__btn--danger {
      border-color: #c0392b;
      background: #c0392b;
      color: #fff;
    }

    .modal__btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    @media (max-width: 47.999rem) {
      .modal__actions {
        flex-direction: column-reverse;
        align-items: stretch;
      }

      .modal__btn {
        width: 100%;
      }
    }
  `
})
export class DeleteAccountDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');

  /** Enquanto a exclusão está em curso: o diálogo fica, o botão trava. */
  readonly busy = input(false);
  /** Falha do backend, mostrada **dentro** do diálogo — fechá-lo faria a pessoa recomeçar. */
  readonly errorMessage = input('');

  readonly confirmed = output<string>();

  protected readonly password = signal('');

  open(): void {
    this.password.set('');
    this.dialog().nativeElement.showModal();
    // O foco inicial é o Cancelar. Ver o comentário da classe.
    setTimeout(() => this.cancelBtn()?.nativeElement.focus(), 50);
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected onPassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }
}

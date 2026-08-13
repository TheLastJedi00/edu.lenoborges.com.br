import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WaitlistEntry } from '../../models/waitlist.model';
import { WAITLIST_ERROR_DEFAULT } from '../../services/waitlist-error';

export type WaitlistState = 'idle' | 'sending' | 'success' | 'error';

/**
 * Modal de lista de espera da Seita Dev.
 * Usa `<dialog>` nativo: foco preso, fechamento por Esc e retorno de foco pelo próprio elemento.
 * O componente é dumb, quem envia é a página através do output `submitted`.
 */
@Component({
  selector: 'app-waitlist-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" (close)="closed.emit()">
      <div class="modal__head">
        <div>
          <p class="u-mono modal__eyebrow">Acesso antecipado</p>
          <h2 class="modal__title">Entre na lista da Seita Dev</h2>
        </div>
        <button type="button" class="modal__close" aria-label="Fechar" (click)="close()">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      @if (state() === 'success') {
        <div class="done" role="status" aria-live="polite">
          <p class="done__title">Tudo certo, você está na lista.</p>
          <p class="done__detail">
            Quando a Seita abrir eu te chamo pelo telefone ou e-mail que você deixou, e o seu acesso
            antecipado é gratuito.
          </p>
          <button type="button" class="submit" (click)="close()">Fechar</button>
        </div>
      } @else {
        <p class="modal__lead">
          A Seita ainda está em construção. Deixe seu contato e você entra antes de todo mundo, sem
          pagar nada pelo acesso antecipado.
        </p>

        <form class="form" [formGroup]="form" (ngSubmit)="send()" novalidate>
          <label class="field">
            <span class="field__label">Nome</span>
            <input
              class="field__input"
              type="text"
              formControlName="name"
              autocomplete="name"
              [attr.aria-invalid]="invalid('name') ? 'true' : null"
              [attr.aria-describedby]="invalid('name') ? 'erro-nome' : null"
            />
            @if (invalid('name')) {
              <span class="field__error" id="erro-nome">Informe o seu nome completo.</span>
            }
          </label>

          <label class="field">
            <span class="field__label">Telefone com DDD</span>
            <input
              class="field__input"
              type="tel"
              inputmode="tel"
              formControlName="phone"
              autocomplete="tel"
              placeholder="(47) 99999-0000"
              [attr.aria-invalid]="invalid('phone') ? 'true' : null"
              [attr.aria-describedby]="invalid('phone') ? 'erro-telefone' : null"
            />
            @if (invalid('phone')) {
              <span class="field__error" id="erro-telefone">
                Informe um telefone com DDD, com 10 ou 11 dígitos.
              </span>
            }
          </label>

          <label class="field">
            <span class="field__label">E-mail</span>
            <input
              class="field__input"
              type="email"
              inputmode="email"
              formControlName="email"
              autocomplete="email"
              [attr.aria-invalid]="invalid('email') ? 'true' : null"
              [attr.aria-describedby]="invalid('email') ? 'erro-email' : null"
            />
            @if (invalid('email')) {
              <span class="field__error" id="erro-email">Informe um e-mail válido.</span>
            }
          </label>

          <div class="legal" id="uso-dos-dados">
            <p class="legal__title">Como os seus dados são usados</p>
            <p>
              Coleto nome, telefone e e-mail com uma finalidade única: avisar quando a Seita Dev
              abrir e liberar o seu acesso antecipado gratuito. A base legal é o seu consentimento
              (LGPD, art. 7º, inciso I).
            </p>
            <p>
              Não vendo nem compartilho esses dados com terceiros para publicidade. Você pode pedir
              consulta, correção ou exclusão a qualquer momento, e revogar o consentimento, pelos
              canais de contato do Leno Borges. Enquanto a plataforma está em construção, o envio
              fica registrado apenas nesta sessão do navegador, sem servidor de produção.
            </p>
          </div>

          <label class="consent">
            <input type="checkbox" formControlName="consent" />
            <span>
              Concordo com o uso dos meus dados para receber o aviso de abertura da Seita Dev.
            </span>
          </label>

          @if (state() === 'error') {
            <p class="form__error" role="alert">{{ errorMessage() }}</p>
          }

          <button class="submit" type="submit" [disabled]="form.invalid || state() === 'sending'">
            @if (state() === 'sending') {
              <span class="submit__spinner" aria-hidden="true"></span>
              Enviando
            } @else {
              Quero acesso antecipado
            }
          </button>
        </form>
      }
    </dialog>
  `,
  styles: `
    .modal {
      width: min(32rem, calc(100vw - 2rem));
      /* No mobile o formulário é mais alto que a tela: quem rola é o modal, não a página. */
      max-height: calc(100dvh - 2rem);
      overflow-y: auto;
      padding: 1.5rem 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      color: var(--ink);
    }

    .modal::backdrop {
      background: rgba(16, 24, 40, 0.55);
      backdrop-filter: blur(3px);
    }

    .modal[open] {
      animation: anim-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .modal__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .modal__eyebrow {
      font-weight: 700;
      color: var(--accent-deep);
    }

    .modal__title {
      font-size: var(--step-2);
      line-height: 1.2;
    }

    .modal__close {
      display: inline-flex;
      flex: none;
      padding: 0.4rem;
      border: none;
      border-radius: 50%;
      background: var(--screen-lit);
      color: var(--ink-soft);
      cursor: pointer;
      transition: background 180ms ease-out, color 180ms ease-out;
    }

    .modal__close:hover {
      background: var(--screen);
      color: var(--ink);
    }

    .modal__lead {
      margin-top: 0.75rem;
      color: var(--ink-soft);
      line-height: 1.55;
    }

    .form {
      display: grid;
      gap: 0.9rem;
      margin-top: 1.25rem;
    }

    .field {
      display: grid;
      gap: 0.35rem;
    }

    .field__label {
      font-weight: 700;
      font-size: var(--step--1);
    }

    .field__input {
      padding: 0.7rem 0.85rem;
      border: var(--border-w) solid var(--screen-deep);
      border-radius: var(--radius-sm);
      background: var(--paper);
      color: var(--ink);
      font-family: var(--font-body);
      font-size: var(--step-0);
      transition: border-color 160ms ease-out, box-shadow 160ms ease-out;
    }

    .field__input:focus-visible {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(57, 134, 255, 0.25);
    }

    .field__input[aria-invalid='true'] {
      border-color: #c0392b;
    }

    .field__error {
      color: #a5281b;
      font-size: var(--step--1);
    }

    .legal {
      display: grid;
      gap: 0.4rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      background: var(--screen-lit);
      color: var(--ink-soft);
      font-size: var(--step--1);
      line-height: 1.5;
    }

    .legal__title {
      font-weight: 700;
      color: var(--ink);
    }

    .consent {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      color: var(--ink-soft);
      font-size: var(--step--1);
      line-height: 1.5;
    }

    .consent input {
      margin-top: 0.15rem;
      width: 1.1rem;
      height: 1.1rem;
      accent-color: var(--accent);
    }

    .form__error {
      color: #a5281b;
      font-size: var(--step--1);
    }

    .submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1.5rem;
      border: none;
      border-radius: 999px;
      background: var(--gradient-accent-strong);
      box-shadow: var(--shadow-hard-sm);
      color: #fff;
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      cursor: pointer;
      transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease-out;
    }

    .submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-glow);
    }

    .submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submit__spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.45);
      border-top-color: #fff;
      border-radius: 50%;
      animation: anim-spin 900ms linear infinite;
    }

    .done {
      display: grid;
      gap: 0.75rem;
      justify-items: start;
      margin-top: 1rem;
    }

    .done__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
    }

    .done__detail {
      color: var(--ink-soft);
      line-height: 1.55;
    }

    @media (prefers-reduced-motion: reduce) {
      .modal[open] {
        animation: none;
      }

      .submit__spinner {
        animation-duration: 2.4s;
      }
    }

    @media (min-width: 30rem) {
      .modal {
        padding: 1.75rem;
      }
    }
  `
})
export class WaitlistDialog {
  private readonly formBuilder = inject(FormBuilder);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** Estado do envio, controlado pela página que faz a requisição. */
  readonly state = input<WaitlistState>('idle');

  /**
   * Texto exibido quando o estado é 'error'. Vem pronto da página: o componente é dumb e
   * não conhece HTTP, então quem traduz status em mensagem é quem fez a requisição.
   */
  readonly errorMessage = input<string>(WAITLIST_ERROR_DEFAULT);

  readonly submitted = output<WaitlistEntry>();
  readonly closed = output<void>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\D*(\d\D*){10,11}$/)]],
    email: ['', [Validators.required, Validators.email]],
    consent: [false, Validators.requiredTrue]
  });

  protected readonly sending = computed(() => this.state() === 'sending');

  private readonly touchedOnce = signal(false);

  open(): void {
    this.form.reset();
    this.touchedOnce.set(false);
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected invalid(control: 'name' | 'phone' | 'email'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || this.touchedOnce());
  }

  protected send(): void {
    this.touchedOnce.set(true);

    if (this.form.invalid || this.state() === 'sending') {
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }
}

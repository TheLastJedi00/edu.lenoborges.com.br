import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Credentials, SignupRequest } from '../../models/auth.model';
import { normalizeEmail } from '../../core/normalize';
import { IconClose } from '../icons/icon-close';
import { IconMail } from '../icons/icon-mail';

export type AuthDialogState = 'idle' | 'sending' | 'sent' | 'error';
export type AuthTab = 'login' | 'signup';

function emailMatchValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.get('email')?.value ?? '';
  const confirmation = control.get('emailConfirmation')?.value ?? '';

  if (!email || !confirmation) {
    return null;
  }

  if (normalizeEmail(email) !== normalizeEmail(confirmation)) {
    return { emailMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, IconClose, IconMail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" (close)="onNativeClose()">
      <div class="modal__head">
        <div class="modal__tabs" role="tablist" aria-label="Opções de autenticação">
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.tab-btn--active]="tab() === 'login'"
            [attr.aria-selected]="tab() === 'login'"
            aria-controls="panel-login"
            id="tab-login"
            (click)="switchTab('login')"
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.tab-btn--active]="tab() === 'signup'"
            [attr.aria-selected]="tab() === 'signup'"
            aria-controls="panel-signup"
            id="tab-signup"
            (click)="switchTab('signup')"
          >
            Criar conta
          </button>
        </div>

        <button type="button" class="modal__close" aria-label="Fechar" (click)="close()">
          <app-icon-close />
        </button>
      </div>

      @if (state() === 'sent') {
        <div class="sent" role="status" aria-live="polite">
          <div class="sent__badge">
            <app-icon-mail />
          </div>
          <h2 class="sent__title">Verifique sua caixa de entrada</h2>
          <p class="sent__detail">
            Enviei um link para <strong>{{ sentEmailDisplay() }}</strong>. Abra o e-mail para criar a sua senha.
          </p>
          <p class="sent__note">
            Se não encontrar a mensagem em alguns minutos, confira a pasta de spam ou lixo eletrônico.
          </p>
          <button type="button" class="submit" (click)="close()">Entendido</button>
        </div>
      } @else if (tab() === 'login') {
        <div id="panel-login" role="tabpanel" aria-labelledby="tab-login">
          <p class="modal__lead">
            Acesse o seu painel de membro na Seita Dev com suas credenciais.
          </p>

          <form class="form" [formGroup]="loginForm" (ngSubmit)="submitLogin()" novalidate>
            <label class="field">
              <span class="field__label">E-mail</span>
              <input
                #firstLoginInput
                class="field__input"
                type="email"
                inputmode="email"
                formControlName="email"
                autocomplete="email"
                placeholder="voce@exemplo.com"
                [attr.aria-invalid]="isLoginFieldInvalid('email') ? 'true' : null"
                [attr.aria-describedby]="isLoginFieldInvalid('email') ? 'erro-login-email' : null"
              />
              @if (isLoginFieldInvalid('email')) {
                <span class="field__error" id="erro-login-email">Informe um e-mail válido.</span>
              }
            </label>

            <label class="field">
              <span class="field__label">Senha</span>
              <input
                #passwordInput
                class="field__input"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Sua senha secreta"
                [attr.aria-invalid]="isLoginFieldInvalid('password') ? 'true' : null"
                [attr.aria-describedby]="isLoginFieldInvalid('password') ? 'erro-login-senha' : null"
              />
              @if (isLoginFieldInvalid('password')) {
                <span class="field__error" id="erro-login-senha">A senha deve ter no mínimo 8 caracteres.</span>
              }
            </label>

            <div class="field-aux">
              <button
                type="button"
                class="link-btn"
                [disabled]="state() === 'sending'"
                (click)="onForgotPassword()"
              >
                Esqueci minha senha
              </button>
            </div>

            @if (state() === 'error' && errorMessage()) {
              <p class="form__error" role="alert">{{ errorMessage() }}</p>
            }

            <button class="submit" type="submit" [disabled]="loginForm.invalid || state() === 'sending'">
              @if (state() === 'sending') {
                <span class="submit__spinner" aria-hidden="true"></span>
                Entrando...
              } @else {
                Entrar
              }
            </button>
          </form>
        </div>
      } @else {
        <div id="panel-signup" role="tabpanel" aria-labelledby="tab-signup">
          <p class="modal__lead">
            Crie sua conta. Você receberá um e-mail para definir a sua senha e ativar o acesso.
          </p>

          <form class="form" [formGroup]="signupForm" (ngSubmit)="submitSignup()" novalidate>
            <label class="field">
              <span class="field__label">E-mail</span>
              <input
                #firstSignupInput
                class="field__input"
                type="email"
                inputmode="email"
                formControlName="email"
                autocomplete="email"
                placeholder="voce@exemplo.com"
                [attr.aria-invalid]="isSignupFieldInvalid('email') ? 'true' : null"
                [attr.aria-describedby]="isSignupFieldInvalid('email') ? 'erro-signup-email' : null"
              />
              @if (isSignupFieldInvalid('email')) {
                <span class="field__error" id="erro-signup-email">Informe um e-mail válido.</span>
              }
            </label>

            <label class="field">
              <span class="field__label">Confirmação de e-mail</span>
              <input
                class="field__input"
                type="email"
                inputmode="email"
                formControlName="emailConfirmation"
                autocomplete="email"
                placeholder="Repita o seu e-mail"
                [attr.aria-invalid]="isSignupConfirmationInvalid() ? 'true' : null"
                [attr.aria-describedby]="isSignupConfirmationInvalid() ? 'erro-signup-conf' : null"
              />
              @if (isSignupConfirmationInvalid()) {
                <span class="field__error" id="erro-signup-conf">Os e-mails devem ser iguais.</span>
              }
            </label>

            @if (state() === 'error' && errorMessage()) {
              <p class="form__error" role="alert">{{ errorMessage() }}</p>
            }

            <button class="submit" type="submit" [disabled]="signupForm.invalid || state() === 'sending'">
              @if (state() === 'sending') {
                <span class="submit__spinner" aria-hidden="true"></span>
                Enviando...
              } @else {
                Criar conta
              }
            </button>
          </form>
        </div>
      }
    </dialog>
  `,
  styles: `
    .modal {
      width: min(30rem, calc(100vw - 2rem));
      inset: 0;
      margin: auto;
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
      background: rgba(16, 24, 40, 0.6);
      backdrop-filter: blur(4px);
    }

    .modal[open] {
      animation: anim-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .modal__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--screen-deep);
      padding-bottom: 0.75rem;
    }

    .modal__tabs {
      display: flex;
      gap: 0.5rem;
    }

    .tab-btn {
      padding: 0.45rem 0.9rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--ink-soft);
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      cursor: pointer;
      transition: all 160ms ease-out;
    }

    .tab-btn:hover {
      color: var(--ink);
      background: var(--screen-lit);
    }

    .tab-btn--active {
      background: var(--screen);
      color: var(--accent-deep);
      border-color: var(--screen-deep);
    }

    .modal__close {
      display: inline-flex;
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
      margin-top: 0.9rem;
      color: var(--ink-soft);
      line-height: 1.5;
      font-size: var(--step--1);
    }

    .form {
      display: grid;
      gap: 0.9rem;
      margin-top: 1.1rem;
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

    .field-aux {
      display: flex;
      justify-content: flex-end;
      margin-top: -0.3rem;
    }

    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: var(--accent-deep);
      font-size: var(--step--1);
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: color 150ms ease;
    }

    .link-btn:hover:not(:disabled) {
      color: var(--accent);
    }

    .link-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form__error {
      color: #a5281b;
      font-size: var(--step--1);
      background: #fdf2f2;
      border: 1px solid #f8b4b4;
      padding: 0.6rem 0.8rem;
      border-radius: var(--radius-sm);
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

    .sent {
      display: grid;
      gap: 0.85rem;
      justify-items: center;
      text-align: center;
      padding: 1.25rem 0.5rem 0.5rem;
    }

    .sent__badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--screen);
      color: var(--accent-deep);
    }

    .sent__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
    }

    .sent__detail {
      color: var(--ink);
      line-height: 1.55;
      font-size: var(--step-0);
    }

    .sent__note {
      color: var(--ink-soft);
      line-height: 1.45;
      font-size: var(--step--1);
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
export class AuthDialog {
  private readonly fb = inject(FormBuilder);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');
  private readonly firstLoginInput = viewChild<ElementRef<HTMLInputElement>>('firstLoginInput');
  private readonly firstSignupInput = viewChild<ElementRef<HTMLInputElement>>('firstSignupInput');

  readonly state = input<AuthDialogState>('idle');
  readonly initialTab = input<AuthTab>('login');
  readonly errorMessage = input<string>('');
  readonly sentEmail = input<string>('');

  readonly login = output<Credentials>();
  readonly signup = output<SignupRequest>();
  readonly tabChange = output<AuthTab>();
  readonly closed = output<void>();

  readonly tab = signal<AuthTab>('login');

  protected readonly loginTouched = signal(false);
  protected readonly signupTouched = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly signupForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      emailConfirmation: ['', [Validators.required, Validators.email]]
    },
    { validators: [emailMatchValidator] }
  );

  readonly sentEmailDisplay = computed(() => {
    return this.sentEmail() || this.signupForm.controls.email.value || this.loginForm.controls.email.value;
  });

  constructor() {
    effect(() => {
      const initial = this.initialTab();
      this.tab.set(initial);
    });
  }

  open(initialTab?: AuthTab): void {
    if (initialTab) {
      this.tab.set(initialTab);
    }
    this.loginTouched.set(false);
    this.signupTouched.set(false);
    this.dialog().nativeElement.showModal();

    setTimeout(() => {
      if (this.tab() === 'login') {
        this.firstLoginInput()?.nativeElement.focus();
      } else {
        this.firstSignupInput()?.nativeElement.focus();
      }
    }, 50);
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  onNativeClose(): void {
    this.resetForms();
    this.closed.emit();
  }

  /**
   * Limpa o que foi digitado ao fechar, por qualquer caminho: botão, Esc ou
   * clique fora. A senha não pode continuar preenchida ao reabrir, nem seguir
   * viva no FormGroup pelo resto da sessão, ainda mais num dispositivo dividido
   * com outra pessoa.
   */
  private resetForms(): void {
    this.loginForm.reset();
    this.signupForm.reset();
    this.loginTouched.set(false);
    this.signupTouched.set(false);
  }

  switchTab(newTab: AuthTab): void {
    if (this.tab() === newTab) return;

    // Preserva o e-mail digitado ao alternar abas
    if (this.tab() === 'login') {
      const currentEmail = this.loginForm.controls.email.value;
      if (currentEmail) {
        this.signupForm.patchValue({ email: currentEmail, emailConfirmation: currentEmail });
      }
    } else {
      const currentEmail = this.signupForm.controls.email.value;
      if (currentEmail) {
        this.loginForm.patchValue({ email: currentEmail });
      }
    }

    this.tab.set(newTab);
    this.loginTouched.set(false);
    this.signupTouched.set(false);
    this.tabChange.emit(newTab);

    setTimeout(() => {
      if (newTab === 'login') {
        this.firstLoginInput()?.nativeElement.focus();
      } else {
        this.firstSignupInput()?.nativeElement.focus();
      }
    }, 50);
  }

  clearPasswordAndFocus(): void {
    this.loginForm.controls.password.reset();
    setTimeout(() => {
      this.passwordInput()?.nativeElement.focus();
    }, 50);
  }

  protected isLoginFieldInvalid(control: 'email' | 'password'): boolean {
    const field = this.loginForm.controls[control];
    return field.invalid && (field.touched || this.loginTouched());
  }

  protected isSignupFieldInvalid(control: 'email' | 'emailConfirmation'): boolean {
    const field = this.signupForm.controls[control];
    return field.invalid && (field.touched || this.signupTouched());
  }

  protected isSignupConfirmationInvalid(): boolean {
    const hasMismatch = this.signupForm.hasError('emailMismatch');
    const field = this.signupForm.controls.emailConfirmation;
    return (hasMismatch || field.invalid) && (field.touched || this.signupTouched());
  }

  protected submitLogin(): void {
    this.loginTouched.set(true);
    if (this.loginForm.invalid || this.state() === 'sending') {
      return;
    }
    this.login.emit(this.loginForm.getRawValue());
  }

  protected submitSignup(): void {
    this.signupTouched.set(true);
    if (this.signupForm.invalid || this.state() === 'sending') {
      return;
    }
    this.signup.emit(this.signupForm.getRawValue());
  }

  protected onForgotPassword(): void {
    const email = this.loginForm.controls.email.value;
    if (!email || this.loginForm.controls.email.invalid) {
      this.loginTouched.set(true);
      this.firstLoginInput()?.nativeElement.focus();
      return;
    }

    this.signup.emit({
      email,
      emailConfirmation: email
    });
  }
}

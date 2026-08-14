import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { httpErrorMessage, httpStatus } from '../../core/http-error';
import { Logo } from '../../shared/logo/logo';

export type DefinirSenhaState = 'invalid_link' | 'form' | 'submitting' | 'success' | 'expired_error';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value ?? '';
  const confirmation = control.get('passwordConfirmation')?.value ?? '';

  if (!password || !confirmation) {
    return null;
  }

  if (password !== confirmation) {
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-definir-senha-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './definir-senha.page.html',
  styleUrl: './definir-senha.page.scss'
})
export class DefinirSenhaPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);

  /** Token recebido da URL, mantido privado e nunca exposto em tela nem em title. */
  private tokenHash: string | null = null;

  readonly state = signal<DefinirSenhaState>('form');
  readonly errorMessage = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  protected readonly touchedOnce = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ['', [Validators.required, Validators.minLength(8)]]
    },
    { validators: [passwordMatchValidator] }
  );

  ngOnInit(): void {
    this.extractToken();
  }

  private extractToken(): void {
    // 1. Tenta ler token_hash dos query params (formato recomendado)
    const queryMap = this.route.snapshot.queryParamMap;
    let token = queryMap.get('token_hash') || queryMap.get('token') || queryMap.get('access_token');

    // 2. Caso venha no fragmento '#' (template padrão do Supabase)
    if (!token && this.route.snapshot.fragment) {
      const fragmentParams = new URLSearchParams(this.route.snapshot.fragment);
      token = fragmentParams.get('token_hash') || fragmentParams.get('access_token') || fragmentParams.get('token');
    }

    if (!token) {
      this.state.set('invalid_link');
    } else {
      this.tokenHash = token;
      this.state.set('form');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  isFieldInvalid(controlName: 'password' | 'passwordConfirmation'): boolean {
    const field = this.form.controls[controlName];
    return field.invalid && (field.touched || this.touchedOnce());
  }

  isConfirmationInvalid(): boolean {
    const hasMismatch = this.form.hasError('passwordMismatch');
    const field = this.form.controls.passwordConfirmation;
    return (hasMismatch || field.invalid) && (field.touched || this.touchedOnce());
  }

  async submit(): Promise<void> {
    this.touchedOnce.set(true);
    if (this.form.invalid || !this.tokenHash || this.state() === 'submitting') {
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    const { password, passwordConfirmation } = this.form.getRawValue();

    try {
      await firstValueFrom(
        this.authService.setPassword({
          tokenHash: this.tokenHash,
          password,
          passwordConfirmation
        })
      );
      this.state.set('success');
    } catch (error: unknown) {
      const status = httpStatus(error);
      const linkRecusado = status === 400 || status === 404 || status === 422;

      if (linkRecusado) {
        this.state.set('expired_error');
      } else {
        this.state.set('form');
        this.errorMessage.set(
          httpErrorMessage(error, 'Não foi possível salvar a senha. Tente novamente em instantes.')
        );
      }
    }
  }

  goToLogin(): void {
    this.authStore.openAuthDialog('login');
    this.router.navigate(['/comunidade']);
  }

  requestNewLink(): void {
    this.authStore.openAuthDialog('signup');
    this.router.navigate(['/comunidade']);
  }
}

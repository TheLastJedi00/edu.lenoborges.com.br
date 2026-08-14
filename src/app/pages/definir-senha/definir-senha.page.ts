import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconAlert } from '../../components/icons/icon-alert';
import { IconCheck } from '../../components/icons/icon-check';
import { IconEye } from '../../components/icons/icon-eye';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
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
  imports: [ReactiveFormsModule, RouterLink, Logo, IconAlert, IconCheck, IconEye],
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
    // Só `token_hash` e `token`, que são o mesmo tipo de valor. `access_token`
    // ficou de fora: é o JWT que o template padrão do Supabase devolve, e mandá-lo
    // como tokenHash faz o verifyOtp do backend falhar. Aceitá-lo dava a impressão
    // de cobrir aquele template sem cobrir de verdade, e trocava um "link
    // inválido" honesto por um erro confuso lá na frente.
    const queryMap = this.route.snapshot.queryParamMap;
    let token = queryMap.get('token_hash') || queryMap.get('token');

    // O link também pode chegar com os dados no fragmento, dependendo de como o
    // template de e-mail estiver configurado no painel.
    if (!token && this.route.snapshot.fragment) {
      const fragmentParams = new URLSearchParams(this.route.snapshot.fragment);
      token = fragmentParams.get('token_hash') || fragmentParams.get('token');
    }

    if (!token) {
      this.state.set('invalid_link');
      return;
    }

    this.tokenHash = token;
    this.state.set('form');
    this.scrubTokenFromUrl();
  }

  /**
   * Tira o token da barra de endereço assim que ele é lido.
   *
   * Deixá-lo ali o guarda no histórico do navegador e o vaza no cabeçalho
   * Referer de qualquer requisição para outra origem. `replaceUrl` troca a
   * entrada atual em vez de empilhar uma nova, então o botão voltar continua
   * levando para onde levava.
   */
  private scrubTokenFromUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      fragment: undefined,
      replaceUrl: true
    });
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
    } catch (error: any) {
      if (error?.status === 400 || error?.status === 404 || error?.status === 422) {
        this.state.set('expired_error');
      } else {
        this.state.set('form');
        this.errorMessage.set(
          error?.message || 'Não foi possível salvar a senha. Tente novamente em instantes.'
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

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthDialog, AuthDialogState, AuthTab } from './components/auth-dialog/auth-dialog';
import { AuthService } from './core/auth/auth.service';
import { AuthStore } from './core/auth/auth.store';
import { httpErrorMessage, httpStatus } from './core/http-error';
import { Credentials, SignupRequest } from './models/auth.model';

/**
 * Uma mensagem só para credencial errada, conta inexistente e conta sem senha
 * definida. O backend não conta a diferença, e o front não tenta adivinhar.
 */
const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AuthDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-dialog
      #authDialog
      [state]="dialogState()"
      [initialTab]="authStore.authDialogTab()"
      [errorMessage]="dialogErrorMessage()"
      [sentEmail]="dialogSentEmail()"
      (login)="onLogin($event)"
      (signup)="onSignup($event)"
      (tabChange)="onTabChange($event)"
      (closed)="onDialogClosed()"
    />
    <router-outlet />
  `
})
export class App {
  readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly authDialog = viewChild<AuthDialog>('authDialog');

  readonly dialogState = signal<AuthDialogState>('idle');
  readonly dialogErrorMessage = signal<string>('');
  readonly dialogSentEmail = signal<string>('');

  constructor() {
    effect(() => {
      const isOpen = this.authStore.isAuthDialogOpen();
      const tab = this.authStore.authDialogTab();
      const dialog = this.authDialog();

      if (isOpen && dialog) {
        this.dialogState.set('idle');
        this.dialogErrorMessage.set('');
        dialog.open(tab);
      } else if (!isOpen && dialog) {
        dialog.close();
      }
    });
  }

  async onLogin(credentials: Credentials): Promise<void> {
    this.dialogState.set('sending');
    this.dialogErrorMessage.set('');

    try {
      await firstValueFrom(this.authService.login(credentials));
      this.dialogState.set('idle');
      this.authStore.closeAuthDialog();

      // O destino guardado pelo guard vale para este login e só para ele. Limpar
      // apenas no ramo de perfil completo deixaria a URL presa no store, e um
      // login futuro cairia numa rota antiga que ninguém pediu.
      const intended = this.authStore.intendedUrl();
      this.authStore.setIntendedUrl(null);

      if (!this.authStore.profileCompleted()) {
        await this.router.navigate(['/completar-perfil']);
      } else {
        await this.router.navigateByUrl(intended || '/dashboard');
      }
    } catch (error: unknown) {
      this.dialogState.set('error');
      this.dialogErrorMessage.set(
        httpErrorMessage(error, 'Não foi possível conectar. Tente novamente em instantes.', {
          400: CREDENCIAIS_INVALIDAS,
          401: CREDENCIAIS_INVALIDAS
        })
      );

      const status = httpStatus(error);
      if (status === 401 || status === 400) {
        this.authDialog()?.clearPasswordAndFocus();
      }
    }
  }

  async onSignup(request: SignupRequest): Promise<void> {
    this.dialogState.set('sending');
    this.dialogErrorMessage.set('');

    try {
      await firstValueFrom(this.authService.signup(request));
      this.dialogSentEmail.set(request.email);
      this.dialogState.set('sent');
    } catch (error: unknown) {
      this.dialogState.set('error');
      this.dialogErrorMessage.set(
        httpErrorMessage(error, 'Não foi possível concluir o cadastro. Tente novamente.')
      );
    }
  }

  onTabChange(_tab: AuthTab): void {
    this.dialogErrorMessage.set('');
    if (this.dialogState() === 'error') {
      this.dialogState.set('idle');
    }
  }

  onDialogClosed(): void {
    this.authStore.closeAuthDialog();
    this.dialogState.set('idle');
    this.dialogErrorMessage.set('');
    this.dialogSentEmail.set('');
  }
}

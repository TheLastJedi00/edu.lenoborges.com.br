import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { httpErrorMessage } from '../../core/http-error';
import { MemberProfile } from '../../models/auth.model';
import { Logo } from '../../shared/logo/logo';

@Component({
  selector: 'app-completar-perfil-page',
  standalone: true,
  imports: [ReactiveFormsModule, Logo, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './completar-perfil.page.html',
  styleUrl: './completar-perfil.page.scss'
})
export class CompletarPerfilPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly authStore = inject(AuthStore);

  private readonly logoutDialog = viewChild<ConfirmDialog>('logoutDialog');

  readonly sending = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  protected readonly touchedOnce = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^\D*(\d\D*){10,11}$/)]],
    bio: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
  });

  readonly bioLength = computed(() => this.form.controls.bio.value.length);

  /**
   * Carrega o perfil para pré-preencher com o que veio da lista de espera.
   *
   * A resposta da sessão não traz nome nem telefone, só `profileCompleted` e
   * `grade`, então é preciso pedir `GET /me`. Antes isto lia o store e o store
   * estava vazio, o que fazia o pré-preenchimento nunca acontecer.
   */
  ngOnInit(): void {
    const carregado = this.authStore.profile();
    if (carregado) {
      this.preencher(carregado);
      return;
    }

    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.preencher(profile),
        error: () => undefined
      });
  }

  /** O dado da waitlist é sugestão editável, sem selo e sem aviso. */
  private preencher(profile: MemberProfile): void {
    if (profile.name) {
      this.form.controls.name.setValue(profile.name);
    }
    if (profile.phone) {
      this.form.controls.phone.setValue(profile.phone);
    }
    if (profile.bio) {
      this.form.controls.bio.setValue(profile.bio);
    }
  }

  isFieldInvalid(controlName: 'name' | 'phone' | 'bio'): boolean {
    const field = this.form.controls[controlName];
    return field.invalid && (field.touched || this.touchedOnce());
  }

  async submit(): Promise<void> {
    this.touchedOnce.set(true);
    if (this.form.invalid || this.sending()) {
      return;
    }

    this.sending.set(true);
    this.errorMessage.set('');

    const values = this.form.getRawValue();

    try {
      await firstValueFrom(this.authService.updateProfile(values));
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.errorMessage.set(
        httpErrorMessage(error, 'Não foi possível salvar os dados do perfil. Tente novamente.')
      );
    } finally {
      this.sending.set(false);
    }
  }

  openLogoutConfirm(): void {
    this.logoutDialog()?.open();
  }

  async confirmLogout(): Promise<void> {
    await firstValueFrom(this.authService.logout());
    await this.router.navigate(['/comunidade']);
  }
}

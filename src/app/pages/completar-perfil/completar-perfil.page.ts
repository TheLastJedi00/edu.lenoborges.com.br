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
import { LegalAcceptDialog } from '../../components/legal-accept-dialog/legal-accept-dialog';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { LegalService } from '../../core/legal/legal.service';
import { LegalStore } from '../../core/legal/legal.store';
import { httpErrorMessage } from '../../core/http-error';
import { MemberProfile } from '../../models/auth.model';
import { LegalDocumentSummary } from '../../models/legal.model';
import { Logo } from '../../shared/logo/logo';

@Component({
  selector: 'app-completar-perfil-page',
  standalone: true,
  imports: [ReactiveFormsModule, Logo, ConfirmDialog, LegalAcceptDialog],
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

  // ------------------------------------------------------ Documentos legais

  private readonly legalService = inject(LegalService);
  private readonly legalStore = inject(LegalStore);

  /**
   * Os documentos vêm de `GET /legal/documents`, e **não de uma lista escrita
   * aqui** (spec 018, decisão 1). No dia em que houver um terceiro documento,
   * esta tela não muda.
   */
  protected readonly legalDocuments = signal<readonly LegalDocumentSummary[]>([]);

  /**
   * O que **o servidor** diz que falta, e não uma marca guardada nesta tela.
   *
   * Começa `null` — "ainda não sei" —, e não lista vazia: lista vazia significa
   * "nada pendente", e assumir isso antes de o perfil chegar habilitaria o
   * submit por um instante para quem não aceitou nada.
   */
  private readonly pendingIds = signal<readonly string[] | null>(null);

  private readonly legalDialog = viewChild<LegalAcceptDialog>('legalDialog');

  protected readonly legalAccepted = computed(() => {
    const pendentes = this.pendingIds();
    return (
      pendentes !== null &&
      this.legalDocuments().length > 0 &&
      !this.legalDocuments().some((doc) => pendentes.includes(doc.id))
    );
  });

  protected isAccepted(documentId: string): boolean {
    const pendentes = this.pendingIds();
    return pendentes !== null && !pendentes.includes(documentId);
  }

  protected openLegal(documentId: string): void {
    // O diálogo está sempre renderizado e recebe o id no argumento: não há
    // binding para esperar nem ordem entre microtask e renderização para
    // acertar. A versão anterior fazia as duas coisas erradas — `@if` mais
    // `queueMicrotask` — e o modal abria sem nunca ter buscado o texto.
    this.legalDialog()?.open(documentId);
  }

  protected onLegalAccepted(documentId: string): void {
    this.pendingIds.update((ids) => (ids ?? []).filter((id) => id !== documentId));
    // Mesmo store do bloqueio do painel: quem aceitou aqui não pode ver o modal
    // de alerta do dashboard um segundo depois, na navegação.
    this.legalStore.clearOne(documentId);
  }

  /**
   * Carrega o perfil para pré-preencher com o que veio da lista de espera.
   *
   * A resposta da sessão não traz nome nem telefone, só `profileCompleted` e
   * `grade`, então é preciso pedir `GET /me`. Antes isto lia o store e o store
   * estava vazio, o que fazia o pré-preenchimento nunca acontecer.
   */
  ngOnInit(): void {
    this.legalService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (documents) => this.legalDocuments.set(documents),
        error: () => undefined
      });

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
    // **Quem já aceitou algo antes de abandonar o formulário não relê nada.** O
    // aceite é gravado no clique do modal, não no submit (spec 018, decisão 5),
    // então o servidor é quem sabe o que já foi aceito — e é `pendingLegal` que
    // conta, não uma marca guardada nesta tela.
    this.pendingIds.set((profile.pendingLegal ?? []).map((doc) => doc.id));

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

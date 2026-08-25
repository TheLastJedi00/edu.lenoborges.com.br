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
import { IconInstagram } from '../../components/icons/icon-instagram';
import { IconLinkedin } from '../../components/icons/icon-linkedin';
import { Logo } from '../../shared/logo/logo';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { httpErrorMessage } from '../../core/http-error';
import { normalizeName, normalizePhone } from '../../core/normalize';
import { toInstagramUrl, toLinkedinUrl } from '../../core/social-url';
import { MemberProfile } from '../../models/auth.model';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Meu Perfil (spec 013).
 *
 * **Uma tela, quatro seções, nenhuma sub-rota.** Quatro rotas dariam quatro
 * telas em branco para editar três campos — e a seção de exclusão precisa estar
 * nesta mesma tela, no fim: escondê-la atrás de uma rota própria é o padrão que
 * faz a pessoa procurar no suporte como sair do produto, e ninguém deveria
 * precisar pedir ajuda para ir embora.
 *
 * É a tela do próprio membro, e não existe perfil de terceiros: sem `:id`, sem
 * lista de membros, sem visualização pública (decisão 13).
 */
@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialog, IconLinkedin, IconInstagram, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss'
})
export class PerfilPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly authStore = inject(AuthStore);

  private readonly sairDialog = viewChild<ConfirmDialog>('sairDialog');

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly profile = signal<MemberProfile | null>(null);

  // ---------------------------------------------------------------- Seus dados

  /**
   * As mesmas validações do `completar-perfil` — 2 a 120, 10 ou 11 dígitos, 10
   * a 500. Duas cópias das mesmas regras divergem na primeira mudança de limite.
   */
  protected readonly dadosForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^\D*(\d\D*){10,11}$/)]],
    bio: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
  });

  protected readonly bioLength = signal(0);
  protected readonly savingDados = signal(false);
  protected readonly dadosError = signal('');
  protected readonly dadosSaved = signal(false);

  // ---------------------------------------------------------------- Suas redes

  /**
   * Seção separada, com botão próprio (decisão 1).
   *
   * As redes são opcionais e o resto não é: juntas num formulário só, um
   * LinkedIn mal colado bloquearia salvar a bio.
   */
  protected readonly redesForm = this.fb.nonNullable.group({
    linkedin: [''],
    instagram: ['']
  });

  protected readonly savingRedes = signal(false);
  protected readonly redesError = signal('');
  protected readonly redesSaved = signal(false);
  protected readonly linkedinError = signal('');
  protected readonly instagramError = signal('');

  /**
   * Normaliza ao sair do campo.
   *
   * `@fulano` vira a URL completa no próprio input, e a pessoa **vê no que o
   * texto dela virou** antes de salvar, em vez de descobrir depois. Domínio
   * errado não é "consertado": vira erro no campo.
   */
  protected normalizarLinkedin(): void {
    const bruto = this.redesForm.controls.linkedin.value;
    const url = toLinkedinUrl(bruto);

    if (url === null) {
      this.linkedinError.set('Informe um perfil do LinkedIn — @fulano ou a URL completa.');
      return;
    }

    this.linkedinError.set('');
    this.redesForm.controls.linkedin.setValue(url);
  }

  protected normalizarInstagram(): void {
    const bruto = this.redesForm.controls.instagram.value;
    const url = toInstagramUrl(bruto);

    if (url === null) {
      this.instagramError.set('Informe um perfil do Instagram — @fulano ou a URL completa.');
      return;
    }

    this.instagramError.set('');
    this.redesForm.controls.instagram.setValue(url);
  }

  /**
   * Salva só as redes.
   *
   * Os dois formulários chamam o mesmo `PATCH`, então nome, telefone e bio vão
   * no corpo com o valor que **está guardado**, e não com o que está no outro
   * formulário: salvar as redes não pode publicar uma bio pela metade que a
   * pessoa ainda estava escrevendo ao lado.
   */
  async salvarRedes(): Promise<void> {
    if (this.savingRedes()) {
      return;
    }

    this.normalizarLinkedin();
    this.normalizarInstagram();
    if (this.linkedinError() || this.instagramError()) {
      return;
    }

    const profile = this.profile();
    if (!profile) {
      return;
    }

    this.savingRedes.set(true);
    this.redesError.set('');

    try {
      const atualizado = await firstValueFrom(
        this.authService.updateProfile({
          name: profile.name ?? '',
          phone: profile.phone ?? '',
          bio: profile.bio ?? '',
          linkedin: this.redesForm.controls.linkedin.value,
          instagram: this.redesForm.controls.instagram.value
        })
      );
      this.aplicar(atualizado);
      this.redesSaved.set(true);
    } catch (error: unknown) {
      this.redesError.set(
        httpErrorMessage(error, 'Não consegui salvar suas redes agora. Tente de novo.')
      );
    } finally {
      this.savingRedes.set(false);
    }
  }

  // -------------------------------------------------------------------- Acesso

  /**
   * Qual bloco de Acesso está aberto.
   *
   * Fechado, cada um mostra só o **estado** — o e-mail atual, e "Senha ·
   * alterada por você" sem nenhum dado. Fechar cancela e limpa os campos,
   * **inclusive os de senha**.
   */
  protected readonly acessoAberto = signal<'email' | 'senha' | null>(null);

  protected readonly emailForm = this.fb.nonNullable.group({
    newEmail: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected readonly senhaForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    // **A confirmação é do front e não vai para a API**: é proteção contra
    // digitar errado a senha que ninguém vai lembrar depois.
    confirmPassword: ['', Validators.required]
  });

  protected readonly savingEmail = signal(false);
  protected readonly emailError = signal('');
  /** Para onde a confirmação foi. Fica na tela para a pessoa poder reenviar. */
  protected readonly emailEnviadoPara = signal('');

  protected readonly savingSenha = signal(false);
  protected readonly senhaError = signal('');

  protected readonly senhasConferem = computed(
    () =>
      this.senhaForm.controls.newPassword.value ===
      this.senhaForm.controls.confirmPassword.value
  );

  protected abrirAcesso(qual: 'email' | 'senha'): void {
    this.acessoAberto.set(qual);
  }

  /** Fechar cancela e limpa — nenhuma senha digitada sobrevive ao cancelamento. */
  protected fecharAcesso(): void {
    this.acessoAberto.set(null);
    this.emailForm.reset();
    this.senhaForm.reset();
    this.emailError.set('');
    this.senhaError.set('');
  }

  /**
   * Pede a troca do e-mail.
   *
   * A resposta é `202`: o pedido foi aceito, a troca **não aconteceu**. O bloco
   * fica aberto com "Confirmação enviada para …", e o e-mail exibido **não muda
   * de valor** — trocar o texto na tela antes de o link ser clicado seria mentir
   * sobre o estado do sistema, e a mentira só apareceria no próximo login,
   * falhando.
   */
  async pedirTrocaDeEmail(): Promise<void> {
    if (this.emailForm.invalid || this.savingEmail()) {
      return;
    }

    this.savingEmail.set(true);
    this.emailError.set('');

    const { newEmail, password } = this.emailForm.getRawValue();

    try {
      await firstValueFrom(this.authService.changeEmail({ newEmail, password }));
      this.emailEnviadoPara.set(newEmail.trim().toLowerCase());
      this.emailForm.controls.password.reset();
    } catch (error: unknown) {
      this.emailError.set(
        httpErrorMessage(error, 'Não consegui pedir a troca de e-mail agora.', {
          401: 'Senha incorreta.'
        })
      );
    } finally {
      this.savingEmail.set(false);
    }
  }

  /**
   * Troca a senha e sai.
   *
   * Depois do `204`: a sessão já foi limpa pelo service, e o destino é a landing
   * com `?entrar=1` — o parâmetro da spec 007, que abre o diálogo de login.
   * **O caminho de volta importa mais que o aviso**: trocar a senha e cair numa
   * tela de login sem contexto é indistinguível de ter sido deslogado por erro.
   *
   * **Sem `confirm-dialog`** (decisão 7): o aviso já está fixo acima do botão, e
   * diálogo em cima de aviso é o que ensina a clicar em "Confirmar" sem ler.
   */
  async trocarSenha(): Promise<void> {
    if (this.senhaForm.invalid || !this.senhasConferem() || this.savingSenha()) {
      return;
    }

    this.savingSenha.set(true);
    this.senhaError.set('');

    const { currentPassword, newPassword } = this.senhaForm.getRawValue();

    try {
      await firstValueFrom(this.authService.changePassword({ currentPassword, newPassword }));
      await this.router.navigate(['/'], {
        queryParams: { entrar: '1', senha: 'trocada' }
      });
    } catch (error: unknown) {
      // Dentro do bloco, sem navegar e sem deslogar: quem errou a digitação não
      // pode ser expulso da conta por isso.
      this.senhaError.set(
        httpErrorMessage(error, 'Não consegui trocar sua senha agora.', {
          401: 'Senha incorreta.'
        })
      );
    } finally {
      this.savingSenha.set(false);
    }
  }

  // -------------------------------------------------------------------- Estado

  protected readonly dadosDirty = computed(() => this.dadosSujo());
  private readonly dadosBaseline = signal('');
  private readonly dadosAtual = signal('');

  ngOnInit(): void {
    // O `GET /me` acontece de qualquer jeito, porque o store pode estar velho.
    // O que já está em memória é só para os campos não ficarem vazios
    // esperando: formulário que pisca com valor errado é o que faz alguém
    // salvar por cima do que ainda não chegou.
    const carregado = this.authStore.profile();
    if (carregado) {
      this.aplicar(carregado);
    }

    this.dadosForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.bioLength.set(this.dadosForm.controls.bio.value.length);
      this.dadosAtual.set(this.assinaturaDados());
      this.dadosSaved.set(false);
    });

    this.redesForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.redesSaved.set(false));

    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.aplicar(profile),
        error: () => {
          if (!this.profile()) {
            this.loadState.set('error');
          }
        }
      });
  }

  protected recarregar(): void {
    this.loadState.set('loading');
    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.aplicar(profile),
        error: () => this.loadState.set('error')
      });
  }

  protected isDadoInvalido(control: 'name' | 'phone' | 'bio'): boolean {
    const field = this.dadosForm.controls[control];
    return field.invalid && field.touched;
  }

  /**
   * Salva nome, telefone e bio.
   *
   * Sem autosave e sem salvar ao sair do campo (decisão 2): autosave em campo de
   * texto livre grava a bio pela metade toda vez que alguém para de digitar para
   * pensar, e não há desfazer — o `PATCH` sobrescreve.
   */
  async salvarDados(): Promise<void> {
    if (this.dadosForm.invalid || this.savingDados()) {
      return;
    }

    this.savingDados.set(true);
    this.dadosError.set('');

    try {
      // Sem as redes no corpo: elas têm formulário próprio, e mandá-las daqui
      // gravaria o que a pessoa não editou nesta ação.
      const atualizado = await firstValueFrom(
        this.authService.updateProfile(this.dadosForm.getRawValue())
      );
      this.aplicar(atualizado);
      this.dadosSaved.set(true);
    } catch (error: unknown) {
      // Abaixo do formulário que falhou, com role="alert". Nunca um toast global
      // e nunca uma navegação: salvar o perfil e ser jogado para fora por um 500
      // é o comportamento que faz a pessoa parar de editar o perfil.
      this.dadosError.set(
        httpErrorMessage(error, 'Não consegui salvar seus dados agora. Tente de novo.')
      );
    } finally {
      this.savingDados.set(false);
    }
  }

  /**
   * Sair da tela com alteração não salva avisa.
   *
   * Um `confirm-dialog`, e não um `beforeunload`: trocar de aba do painel é um
   * clique, e a bio é o campo mais longo que o produto tem.
   *
   * **A comparação é contra o valor normalizado**, não contra o texto cru —
   * senão apagar um espaço no fim da bio dispara o diálogo.
   */
  canDeactivate(): boolean | Promise<boolean> {
    if (!this.dadosSujo()) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      this.saidaPendente = resolve;
      this.sairDialog()?.open();
    });
  }

  protected confirmarSaida(): void {
    this.saidaPendente?.(true);
    this.saidaPendente = null;
  }

  protected cancelarSaida(): void {
    this.saidaPendente?.(false);
    this.saidaPendente = null;
  }

  private saidaPendente: ((sair: boolean) => void) | null = null;

  private dadosSujo(): boolean {
    return this.dadosAtual() !== this.dadosBaseline();
  }

  private assinaturaDados(): string {
    const { name, phone, bio } = this.dadosForm.getRawValue();
    return [normalizeName(name), normalizePhone(phone), bio.trim()].join(' ');
  }

  private aplicar(profile: MemberProfile): void {
    this.profile.set(profile);
    this.loadState.set('ready');

    this.dadosForm.setValue(
      {
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        bio: profile.bio ?? ''
      },
      { emitEvent: false }
    );
    this.bioLength.set(this.dadosForm.controls.bio.value.length);

    // Reaplicar a resposta ao formulário das redes é o que faz um campo apagado
    // voltar vazio depois de salvar, e não com o valor antigo.
    this.redesForm.setValue(
      {
        linkedin: profile.linkedin ?? '',
        instagram: profile.instagram ?? ''
      },
      { emitEvent: false }
    );
    this.linkedinError.set('');
    this.instagramError.set('');

    // O que acabou de chegar da API é o novo ponto de comparação: sem isto,
    // salvar deixaria o formulário "sujo" para sempre e o aviso de saída
    // apareceria depois de a pessoa ter salvado.
    const assinatura = this.assinaturaDados();
    this.dadosBaseline.set(assinatura);
    this.dadosAtual.set(assinatura);
  }
}

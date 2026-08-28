import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Logo } from '../../shared/logo/logo';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { AccessService } from '../../services/access.service';
import { OobMode } from '../../models/auth.model';

/** O que a tela está desenhando agora. */
type Estado =
  | 'conferindo'
  | 'formulario'
  | 'enviando'
  | 'aplicando'
  | 'confirmado'
  | 'link-invalido';

/** Os quatro modos que o console pode mandar, mais nada. */
const MODOS: readonly OobMode[] = [
  'resetPassword',
  'verifyAndChangeEmail',
  'verifyEmail',
  'recoverEmail'
];

/** Destino único de saída da tela: a landing, com o diálogo de login aberto. */
const DESTINO_PADRAO = '/?entrar=1';

/**
 * As duas senhas precisam bater.
 *
 * O campo é mascarado e o custo do erro é alto: uma senha com um caractere a
 * mais é uma conta cujo dono precisa pedir outro link para descobrir o que
 * aconteceu.
 */
function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value as string;
  const confirmacao = grupo.get('confirmacao')?.value as string;

  return senha && confirmacao && senha !== confirmacao ? { divergem: true } : null;
}

/**
 * A tela de senha do produto (spec 020).
 *
 * Ela existiu como `/definir-senha`, morreu na decisão 3 da spec 007 — que
 * escreveu, entre os custos daquela decisão, que "a identidade visual se
 * interrompe" — e volta aqui. O primeiro contato de todo membro novo com este
 * produto deixa de ser uma página cinza do Google pedindo uma senha.
 *
 * **Uma rota para todos os modos**, porque o console do Firebase tem um campo
 * só: ele manda todo link de ação para um endereço, com o `mode` na query. O
 * `mode` escolhe qual tela desenhar, e **nunca** qual operação a API executa —
 * quem decide isso é o `oobCode`, no servidor.
 *
 * **Sem `dashboard-shell`, sem menu e sem sino**, como o `/descadastro` e as
 * páginas legais: quem está aqui ainda não tem sessão.
 */
@Component({
  selector: 'app-acesso-page',
  standalone: true,
  imports: [ReactiveFormsModule, Logo, PixelPanel, PixelButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acesso.page.html',
  styleUrl: './acesso.page.scss'
})
export class AcessoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly access = inject(AccessService);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  /**
   * O código lido da URL. **Vive aqui e em nenhum outro lugar** (decisão 9).
   *
   * Não em `localStorage`, não em `sessionStorage`, e não num serviço
   * `providedIn: 'root'`. Um código de uso único guardado fora da tela que o usa
   * é um código que sobrevive à tela.
   */
  private readonly oobCode = signal<string | null>(null);

  /** Para onde ir ao terminar. Já conferido — ver `resolverDestino`. */
  private destino = DESTINO_PADRAO;

  protected readonly modo = signal<OobMode | null>(null);
  protected readonly estado = signal<Estado>('conferindo');

  /** O e-mail dono do link, escrito acima do formulário. */
  protected readonly email = signal<string>('');

  /** Recusa da API, já traduzida por ela. A tela não inventa mensagem. */
  protected readonly erro = signal<string>('');

  protected readonly form = this.fb.nonNullable.group(
    {
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmacao: ['', [Validators.required]]
    },
    { validators: senhasIguais }
  );

  /** Só depois do toque: apontar divergência enquanto a pessoa digita é ruído. */
  protected senhasDivergem(): boolean {
    return (
      this.form.hasError('divergem') && (this.form.get('confirmacao')?.touched ?? false)
    );
  }

  protected senhaCurta(): boolean {
    const senha = this.form.get('senha');
    return (senha?.hasError('minlength') ?? false) && (senha?.touched ?? false);
  }

  constructor() {
    // Fora dos buscadores, pelo mesmo mecanismo que o `/descadastro` já usa
    // (spec 014, decisão 11) — copiar o que existe, e não inventar um segundo.
    // A URL carrega credencial na query, e um rastreador que a visitasse
    // queimaria o link de alguém.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    // A marca sai junto com a página: sem isto ela sobreviveria à navegação e
    // tiraria a landing inteira do índice.
    this.destroyRef.onDestroy(() => this.meta.removeTag('name="robots"'));
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const codigo = params.get('oobCode');
    const modo = params.get('mode');

    this.destino = this.resolverDestino(params.get('continueUrl'));
    this.oobCode.set(codigo);
    this.modo.set(MODOS.includes(modo as OobMode) ? (modo as OobMode) : null);

    // Lido, e some da barra de endereços. A URL inteira entra no histórico do
    // navegador e fica em navegador compartilhado; aparece em print de quem pede
    // ajuda; e vaza no `Referer` de qualquer requisição para outro domínio feita
    // a partir daqui.
    this.limparUrl();

    if (!codigo || !this.modo()) {
      // Sem código, ou com um modo que não conhecemos, **não se chama serviço
      // nenhum**: não há o que conferir, e uma requisição aqui só gastaria o
      // limite de quem tem um link legítimo.
      this.estado.set('link-invalido');
      return;
    }

    if (this.modo() === 'resetPassword') {
      this.conferirCodigo(codigo);
      return;
    }

    this.aplicarAcaoDeEmail(codigo);
  }

  /**
   * Confere o código antes de desenhar o formulário (decisão 8).
   *
   * **Os campos de senha só existem depois do sucesso.** Sem isto, quem clicou
   * num link expirado escolhe uma senha, digita duas vezes, submete, e só então
   * descobre que o link morreu. Enquanto confere, o estado é de carregamento —
   * não é formulário desabilitado, que sugere que há algo a preencher.
   */
  private conferirCodigo(codigo: string): void {
    this.estado.set('conferindo');

    this.access
      .checkOobCode(codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (check) => {
          this.email.set(check.email);
          this.estado.set('formulario');
        },
        // Expirado e inválido caem na mesma tela, de propósito: distinguir
        // informaria a quem colou um código qualquer se ele existiu algum dia.
        error: () => this.estado.set('link-invalido')
      });
  }

  /** Os três modos sem formulário (decisão 7). */
  private aplicarAcaoDeEmail(codigo: string): void {
    this.estado.set('aplicando');

    this.access
      .applyEmailAction(codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (check) => {
          this.email.set(check.email);
          this.estado.set('confirmado');
        },
        error: () => this.estado.set('link-invalido')
      });
  }

  protected submeter(): void {
    const codigo = this.oobCode();

    if (this.form.invalid || !codigo || this.estado() === 'enviando') {
      this.form.markAllAsTouched();
      return;
    }

    this.estado.set('enviando');
    this.erro.set('');

    this.access
      .confirmPassword(codigo, this.form.getRawValue().senha)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // **Não loga ninguém** (decisão 11). A resposta é `204` e não traz
        // token: sessão nasce no login, e um segundo caminho de emissão do
        // cookie de refresh só seria exercitado no cadastro — o fluxo que menos
        // gente percorre duas vezes, e portanto aquele em que um defeito de
        // `SameSite` ficaria escondido por mais tempo.
        next: () => void this.router.navigateByUrl(this.destino),
        error: (falha: { error?: { message?: string } }) => {
          // A mensagem vem traduzida da API, que é quem sabe se o link morreu ou
          // se a senha foi recusada pela política do projeto. A tela não a
          // reescreve: dois tradutores divergem na primeira exceção.
          this.erro.set(
            falha.error?.message ??
              'Não consegui definir a senha agora. Tente de novo em instantes.'
          );
          this.estado.set('formulario');
        }
      });
  }

  protected readonly destinoDeSaida = computed(() => this.destino);

  /**
   * Confere o `continueUrl` da query em vez de obedecê-lo (decisão 10).
   *
   * O Firebase devolve na query o `continueUrl` que a API mandou, **e a query é
   * escrita por quem manda o link**. Um `location = params.get('continueUrl')`
   * aqui seria um redirecionamento aberto com a marca do produto em cima: o
   * phishing perfeito é o link legítimo do nosso e-mail terminando num domínio
   * que não é o nosso.
   *
   * A regra é uma linha, e não há lista de domínios a manter: não existe destino
   * externo legítimo depois de definir uma senha.
   */
  private resolverDestino(continueUrl: string | null): string {
    if (!continueUrl) {
      return DESTINO_PADRAO;
    }

    try {
      const alvo = new URL(continueUrl, globalThis.location.origin);

      return alvo.origin === globalThis.location.origin
        ? `${alvo.pathname}${alvo.search}${alvo.hash}`
        : DESTINO_PADRAO;
    } catch {
      // URL impossível de interpretar é URL que não se obedece.
      return DESTINO_PADRAO;
    }
  }

  /** Reescreve a barra de endereços para `/acesso` limpo, sem navegar. */
  private limparUrl(): void {
    globalThis.history?.replaceState?.(
      globalThis.history.state,
      '',
      globalThis.location.pathname
    );
  }
}

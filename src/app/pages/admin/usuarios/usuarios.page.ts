import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  InjectionToken,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { BillingService } from '../../../services/billing.service';
import {
  AdminUser,
  AdminUserDetail,
  AdminUserFilters,
  AdminUserPage,
  CannotReceiveEmailReason,
  EmailOptOutReason,
  OnboardingFilter
} from '../../../models/admin.model';
import type { BillingTier } from '../../../models/billing.model';
import type { TierId } from '../../../models/auth.model';
import { describeProgress, MAX_GRADE } from '../../../core/progress/progress';
import { httpStatus } from '../../../core/http-error';
import { dataCurta } from '../../../core/datas';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Quanto esperar antes de buscar, para não ir a cada tecla.
 *
 * É token pelo mesmo motivo da tela de e-mails: **a app é zoneless, então
 * `fakeAsync` não existe aqui** e o relógio do Jasmine não alcança o
 * `asyncScheduler` do RxJS. Sem poder adiantar o tempo, a única forma de os
 * testes do `debounceTime` e do `switchMap` continuarem existindo é encurtar a
 * espera.
 *
 * O número importa: **cada requisição varre a base inteira no backend**. Sem o
 * atraso, "borges" são seis varreduras.
 */
export const USUARIOS_BUSCA_DEBOUNCE_MS = new InjectionToken<number>(
  'USUARIOS_BUSCA_DEBOUNCE_MS',
  { providedIn: 'root', factory: () => 400 }
);

@Component({
  selector: 'app-admin-usuarios-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios.page.html',
  styleUrl: './usuarios.page.scss'
})
export class AdminUsuariosPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly billing = inject(BillingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly debounceMs = inject(USUARIOS_BUSCA_DEBOUNCE_MS);

  protected readonly state = signal<LoadState>('loading');
  protected readonly users = signal<readonly AdminUser[]>([]);
  /**
   * O tamanho do **recorte**, e não da base (spec 015, decisão 6).
   *
   * Sem filtro os dois coincidem; com filtro, não — e é por isso que a tela
   * escreve "12 de 213 membros" em vez de um número solto. Um número grande
   * sozinho é lido como o tamanho da comunidade.
   */
  protected readonly total = signal(0);
  protected readonly loadingMore = signal(false);

  // ------------------------------------------------------------------ Recorte

  protected readonly busca = signal('');
  protected readonly onboarding = signal<OnboardingFilter | null>(null);
  protected readonly tiersSelecionados = signal<readonly TierId[]>([]);
  protected readonly gradeMin = signal<number | null>(null);
  protected readonly gradeMax = signal<number | null>(null);

  /** Os rótulos vêm do catálogo, e não são digitados de novo. */
  protected readonly tiers = signal<readonly BillingTier[]>([]);

  /** A faixa vem do módulo de progresso, nunca reescrita à mão. */
  protected readonly maxGrade = MAX_GRADE;
  protected readonly gradeOptions = Array.from(
    { length: MAX_GRADE + 1 },
    (_, index) => index
  );

  /**
   * **Nenhum filtro marcado significa TODOS os membros** (decisão 4).
   *
   * É a mesma inversão que a tela de e-mails protege, e ela é perigosa nos dois
   * lugares por razões opostas: lá, um estado vazio lido como "ninguém" não
   * dispararia nada; aqui, ele mostraria uma lista vazia e faria o admin achar
   * que a base sumiu. Por isso o rótulo é escrito com estas palavras, iguais às
   * de lá.
   */
  protected readonly semFiltro = computed(
    () =>
      this.busca().trim() === '' &&
      this.onboarding() === null &&
      this.tiersSelecionados().length === 0 &&
      this.gradeMin() === null &&
      this.gradeMax() === null
  );

  /** Quantos controles estão ativos, para o rótulo "Filtros (2)" no celular. */
  protected readonly filtrosAtivos = computed(
    () =>
      (this.onboarding() === null ? 0 : 1) +
      (this.tiersSelecionados().length === 0 ? 0 : 1) +
      (this.gradeMin() === null ? 0 : 1) +
      (this.gradeMax() === null ? 0 : 1)
  );

  /**
   * A contagem, escrita por extenso (decisão 6).
   *
   * **Nunca só um número.** Sem recorte é "213 membros"; com recorte é "12 de
   * 213 membros", porque o número sozinho seria lido como o tamanho da
   * comunidade — e com um filtro ligado ele não é.
   */
  protected readonly contagem = computed(() => {
    const carregados = this.users().length;
    const total = this.total();

    if (this.semFiltro()) {
      return `${total} ${total === 1 ? 'membro' : 'membros'}`;
    }

    return `${carregados} de ${total} ${total === 1 ? 'membro' : 'membros'}`;
  });

  protected readonly hasMore = computed(() => this.users().length < this.total());

  /**
   * Quantos ainda faltam no recorte.
   *
   * O "Carregar mais" de antes não conseguia dizer isto, porque o `pageToken` do
   * Auth é opaco e não carrega total. Agora ele sabe: **"Carregar mais (163
   * restantes)"**.
   */
  protected readonly restantes = computed(() =>
    Math.max(this.total() - this.users().length, 0)
  );

  /** Cada mexida em busca ou filtro empurra um evento aqui. */
  private readonly recorteMudou = new Subject<void>();

  /**
   * O membro aberto, **com o que a linha já sabia** (decisão 9).
   *
   * O diálogo abre com isto preenchido enquanto a requisição do detalhe não
   * volta: abrir vazio e preencher depois faz o clique parecer que falhou.
   */
  protected readonly editing = signal<AdminUser | null>(null);
  /** O que só o detalhe conhece: telefone, bio, redes, datas, estado de e-mail. */
  protected readonly detail = signal<AdminUserDetail | null>(null);
  protected readonly detailState = signal<LoadState>('loading');

  protected gradeDraft = 0;
  protected tierDraft: TierId = 'dev-tier';
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  private readonly dialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('detalheDialog');
  /** Para onde o foco volta ao fechar: a linha de onde ele saiu. */
  private origemDoFoco: HTMLElement | null = null;

  /**
   * Mensagem própria para o 403.
   *
   * A claim de admin só entra em vigor no **próximo** ID token, e o atual vale
   * por até uma hora. Sem esta explicação, quem acabou de ser promovido lê
   * "acesso negado" e abre um chamado — a resposta certa é sair e entrar de
   * novo.
   */
  protected readonly forbidden = signal(false);

  constructor() {
    /**
     * Abrir é `showModal`, e ele acontece **depois** de o `@if` ter renderizado
     * o elemento.
     *
     * Por isso é um `effect` e não uma chamada dentro do `startEdit`: lá o
     * `<dialog>` ainda não existe no DOM, e `showModal` num elemento fora do
     * documento lança `InvalidStateError`. O `effect` roda depois da detecção de
     * mudanças, quando o `viewChild` já resolveu.
     *
     * `showModal` traz de graça o que a spec pediu e o sistema já tem: Esc
     * fecha, o foco entra no diálogo e não escapa dele, e o resto da página fica
     * inerte. Inventar um segundo padrão aqui seria manter dois.
     */
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (this.editing() && dialog?.isConnected && !dialog.open) {
        dialog.showModal();
      }
    });

    // O diálogo de escrever, pelo mesmo caminho e pelo mesmo motivo.
    effect(() => {
      const dialog = this.emailDialogRef()?.nativeElement;
      if (this.escrevendo() && dialog?.isConnected && !dialog.open) {
        dialog.showModal();
      }
    });

    /**
     * `debounceTime` para não varrer a base a cada tecla, e **`switchMap` para a
     * resposta antiga nunca vencer a nova**: duas respostas fora de ordem
     * deixariam na tela o resultado de uma busca que o admin já abandonou — e
     * ele não tem como saber que a lista não corresponde ao que está escrito no
     * campo.
     */
    this.recorteMudou
      .pipe(
        debounceTime(this.debounceMs),
        switchMap(() =>
          this.admin.listUsers(this.filtros()).pipe(
            catchError((error: { status?: number }) => {
              this.forbidden.set(error.status === 403);
              this.state.set('error');
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => this.aplicarPagina(page));
  }

  ngOnInit(): void {
    // O recorte da URL e lido ANTES da primeira requisicao, e nao depois: uma
    // busca com o filtro vindo em seguida seria duas varreduras da base e uma
    // lista que pisca com o recorte errado.
    this.lerDaUrl();
    this.load();

    this.billing
      .getCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogo) => this.tiers.set(catalogo.tiers),
        error: () => undefined
      });
  }

  /** O recorte atual, no formato que o serviço manda para a API. */
  protected filtros(): AdminUserFilters {
    return {
      q: this.busca().trim() || undefined,
      onboarding: this.onboarding() ?? undefined,
      tiers: this.tiersSelecionados(),
      gradeMin: this.gradeMin(),
      gradeMax: this.gradeMax()
    };
  }

  protected load(): void {
    this.state.set('loading');
    this.forbidden.set(false);

    this.admin
      .listUsers(this.filtros())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.aplicarPagina(page),
        error: (error: { status?: number }) => {
          this.forbidden.set(error.status === 403);
          this.state.set('error');
        }
      });
  }

  private aplicarPagina(page: AdminUserPage | null): void {
    if (!page) {
      return;
    }

    this.users.set(page.users);
    this.total.set(page.total);
    this.state.set('ready');
  }

  // -------------------------------------------------------------- Os controles

  protected buscar(texto: string): void {
    this.busca.set(texto);
    // `replaceUrl: true` (decisao 2): sem isso, cada tecla vira uma entrada no
    // historico e o botao "voltar" caminha letra por letra ate a tela ficar
    // irrecuperavel. E o defeito classico de filtro na URL, e ele so aparece
    // depois de a tela estar pronta.
    this.escreverNaUrl(true);
    this.recorteMudou.next();
  }

  protected alternarOnboarding(): void {
    this.onboarding.update((atual) => (atual === 'pendente' ? null : 'pendente'));
    this.aplicarFiltro();
  }

  protected alternarTier(tier: TierId): void {
    this.tiersSelecionados.update((atuais) =>
      atuais.includes(tier)
        ? atuais.filter((id) => id !== tier)
        : [...atuais, tier]
    );
    this.aplicarFiltro();
  }

  protected definirGrade(qual: 'min' | 'max', valor: string): void {
    const numero = valor === '' ? null : Number(valor);
    if (qual === 'min') {
      this.gradeMin.set(numero);
    } else {
      this.gradeMax.set(numero);
    }
    this.aplicarFiltro();
  }

  protected limparFiltros(): void {
    this.busca.set('');
    this.onboarding.set(null);
    this.tiersSelecionados.set([]);
    this.gradeMin.set(null);
    this.gradeMax.set(null);
    this.aplicarFiltro();
  }

  /**
   * Clicar num filtro é um gesto deliberado, e vira entrada no histórico.
   *
   * Ao contrário da busca: "voltar" tem que desfazer o último filtro, e não
   * caminhar por letras digitadas.
   */
  private aplicarFiltro(): void {
    this.escreverNaUrl(false);
    this.recorteMudou.next();
  }

  // ------------------------------------------------------------------- A URL

  /**
   * O recorte é o trabalho, e ele vai para a URL (decisão 2).
   *
   * Esta é a única tela do painel onde o estado da tela **é trabalho** — nas
   * outras, recarregar não perde nada porque não havia nada montado. Aqui o
   * admin combina quatro controles para chegar a doze pessoas, e um F5
   * acidental o devolveria ao começo.
   */
  private escreverNaUrl(replaceUrl: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.busca().trim() || null,
        onboarding: this.onboarding(),
        tiers: this.tiersSelecionados().length
          ? [...this.tiersSelecionados()]
          : null,
        gradeMin: this.gradeMin(),
        gradeMax: this.gradeMax()
      },
      replaceUrl
    });
  }

  private lerDaUrl(): void {
    const params = this.route.snapshot.queryParamMap;

    this.busca.set(params.get('q') ?? '');

    const onboarding = params.get('onboarding');
    this.onboarding.set(onboarding === 'pendente' ? 'pendente' : null);

    this.tiersSelecionados.set(params.getAll('tiers') as TierId[]);

    this.gradeMin.set(numeroOuNulo(params.get('gradeMin')));
    this.gradeMax.set(numeroOuNulo(params.get('gradeMax')));
  }

  // -------------------------------------------------------------- Carregar mais

  /**
   * "Carregar mais", e não paginação numerada — agora sabendo quantos faltam.
   *
   * **O `offset` é o tamanho do que já está na tela**, e não um contador
   * próprio: um contador paralelo é como a segunda página vem duplicada, que é o
   * erro clássico ao trocar cursor por deslocamento.
   */
  protected loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.admin
      .listUsers(this.filtros(), this.users().length)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.users.update((current) => [...current, ...page.users]);
          this.total.set(page.total);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false)
      });
  }

  protected labelFor(grade: number): string {
    return describeProgress(grade).label;
  }

  /**
   * Por que este membro não recebe e-mail (decisão 11).
   *
   * **Isto é o oposto do que a decisão 12 da spec 014 faz em Meu Perfil, e é de
   * propósito.** Lá o interruptor aparece desligado e a tela cala, porque para o
   * membro "seu provedor recusou nossos e-mails" é uma frase que não o ajuda a
   * fazer nada. Aqui a frase aparece inteira, porque quem lê é o admin — a única
   * pessoa que pode agir sobre ela: conferir o endereço, falar com a pessoa por
   * outro caminho, corrigir.
   *
   * Sem este comentário, a diferença entre as duas telas vira "inconsistência"
   * no próximo code review, e alguém a "conserta" apagando a informação do lado
   * de quem podia usá-la.
   */
  protected motivoDoDescadastro(motivo: EmailOptOutReason | null): string {
    switch (motivo) {
      case 'membro':
        return 'descadastrou-se';
      case 'bounce':
        return 'o provedor recusou o endereço';
      case 'reclamacao':
        return 'marcou como spam';
      default:
        return 'motivo não registrado';
    }
  }

  /**
   * Por que não dá para escrever para este membro (decisão 15).
   *
   * O texto é escolhido pelo **código** que veio no corpo, e nunca por leitura
   * da mensagem: texto de erro não é contrato, e um `includes('descadastr')`
   * quebraria na primeira revisão de copy do backend.
   */
  protected motivoDeNaoReceber(motivo: CannotReceiveEmailReason | null): string {
    switch (motivo) {
      case 'descadastrado':
        return 'Esse membro pediu para não receber e-mails.';
      case 'email-nao-verificado':
        return 'O e-mail dele ainda não foi confirmado.';
      case 'desativado':
        return 'A conta está desativada.';
      default:
        return '';
    }
  }

  /**
   * A data do descadastro, curta e legível.
   *
   * A formatação em si mora em `core/datas.ts` desde a spec 017: era o único
   * lugar do produto que escrevia data, e a segunda tela a precisar de uma teria
   * inventado outro formato.
   */
  protected dataCurta(iso: string | null): string {
    return dataCurta(iso);
  }

  protected tierLabel(tier: TierId | null): string {
    if (!tier) {
      return '';
    }
    return this.tiers().find((item) => item.id === tier)?.name ?? tier;
  }

  // ------------------------------------------------------------------- Edições

  /**
   * Abre o membro (decisões 1 e 9).
   *
   * **Sem sub-rota.** Uma `/usuarios/:id` seria linkável e sobreviveria ao F5, e
   * custaria o que importa mais: voltar do detalhe teria que restaurar o
   * recorte, a rolagem e a página em que o admin estava. O diálogo não perde
   * nada disso porque nunca sai da tela — e o que precisava mesmo sobreviver ao
   * F5 é o recorte, que já está na URL.
   */
  protected startEdit(user: AdminUser, origem?: HTMLElement): void {
    this.saveError.set(null);
    this.gradeDraft = user.grade ?? 0;
    // O seletor abre NO VALOR DO MEMBRO. Ele abria vazio desde a spec 010,
    // porque a API declarava o campo e nunca o devolvia — e o admin escolhia às
    // cegas. `dev-tier` aqui é só o caso de quem ainda não tem perfil.
    this.tierDraft = user.tier ?? 'dev-tier';
    this.origemDoFoco = origem ?? null;
    this.editing.set(user);
    this.detail.set(null);
    this.carregarDetalhe(user.id);
  }

  /**
   * O detalhe busca os próprios dados (decisão 9).
   *
   * Telefone, bio, redes e as datas **não vêm na listagem**, e a tela não tenta
   * contornar isso guardando o que já teria: é uma requisição por clique, e o
   * clique é raro.
   */
  protected carregarDetalhe(userId: string): void {
    this.detailState.set('loading');

    this.admin
      .getUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalhe) => {
          this.detail.set(detalhe);
          this.detailState.set('ready');
        },
        // **A falha não fecha o diálogo** (decisão 9): fechar sozinho parece que
        // o clique não pegou, e o admin clica de novo. O erro aparece dentro
        // dele, com "Tentar de novo".
        error: () => this.detailState.set('error')
      });
  }

  protected cancelEdit(): void {
    this.dialogRef()?.nativeElement.close();
    this.editing.set(null);
    this.detail.set(null);
    // O foco volta para a linha de onde saiu: sem isto ele cai no começo da
    // pagina, e quem navega por teclado perde o lugar na lista.
    this.origemDoFoco?.focus();
    this.origemDoFoco = null;
  }

  protected saveGrade(): void {
    const user = this.editing();
    if (!user) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.admin
      .updateUserGrade(user.id, this.gradeDraft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users.update((current) =>
            current.map((item) =>
              item.id === user.id ? { ...item, grade: this.gradeDraft } : item
            )
          );
          this.saving.set(false);
          this.editing.set(null);
        },
        error: (error: { status?: number }) => {
          this.saving.set(false);
          this.saveError.set(mensagemDeSalvar(error.status));
        }
      });
  }

  /**
   * Concede ou remove acesso. **Requisição própria, e nunca junto do `grade`.**
   *
   * `tier` é acesso; `grade` é conquista. Mandar os dois no mesmo PATCH faria
   * uma edição de acesso escrever o progresso junto — e é assim que alguém que
   * acabou de pagar perde a trilha inteira.
   */
  protected saveTier(): void {
    const user = this.editing();
    if (!user) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.admin
      .updateUserTier(user.id, this.tierDraft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users.update((current) =>
            current.map((item) =>
              item.id === user.id ? { ...item, tier: this.tierDraft } : item
            )
          );
          this.saving.set(false);
          this.editing.set(null);
        },
        error: (error: { status?: number }) => {
          this.saving.set(false);
          this.saveError.set(mensagemDeSalvar(error.status));
        }
      });
  }

  // -------------------------------------------------------------- E-mail direto

  /**
   * O e-mail direto é um diálogo **dentro** do detalhe (decisão 12).
   *
   * Reusar `/dashboard/admin/emails` para uma pessoa obrigaria aquela tela a
   * ganhar um modo — "para quem: um membro" — e o modo estragaria a tela que
   * mais depende de não ter modos. **O que é compartilhado é o que importa e
   * está no backend**: o mesmo caminho de envio, o mesmo template, o mesmo
   * rodapé de descadastro. A tela é a parte barata.
   */
  protected readonly escrevendo = signal(false);
  /**
   * Os rascunhos são **sinais**, e não propriedades comuns.
   *
   * Um `computed` que lê propriedade comum produz um valor que nunca mais se
   * atualiza — o computed só recalcula quando um *sinal* de que ele depende
   * muda. O sintoma aqui seria o pior possível: o botão de envio travado com
   * tudo preenchido. É a mesma armadilha que a tela de e-mails registrou.
   */
  protected readonly assuntoDraft = signal('');
  protected readonly corpoDraft = signal('');
  protected readonly enviando = signal(false);
  protected readonly envioError = signal<string | null>(null);
  /** "E-mail enviado", por alguns segundos, depois que o diálogo fecha. */
  protected readonly enviado = signal(false);

  private readonly emailDialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('emailDialog');

  protected readonly podeEscrever = computed(
    () => this.detail()?.canReceiveEmail === true
  );

  /**
   * O botão diz o endereço, e nunca só "Enviar" (decisão 14).
   *
   * É o eco da spec 014 — *o botão diz o número* — com a mesma lógica aplicada a
   * um destinatário: a informação que decide o clique fica dentro do botão. Lá
   * ela precisa de um diálogo repetindo o número, porque o número é grande e
   * abstrato; aqui o destinatário é um endereço que o admin está lendo na tela
   * desde que abriu o detalhe. **Por isso não há `confirm-dialog` por cima**: um
   * diálogo perguntando "tem certeza?" sobre uma pessoa nomeada é a interface
   * duvidando de uma decisão que não tem ambiguidade.
   */
  protected readonly rotuloDeEnvio = computed(() => {
    if (this.enviando()) {
      return 'Enviando…';
    }
    return `Enviar para ${this.editing()?.email ?? 'este membro'}`;
  });

  protected readonly envioValido = computed(
    () =>
      this.assuntoDraft().trim().length >= 3 &&
      this.corpoDraft().trim().length >= 10
  );

  protected abrirEmail(): void {
    // Quem nao pode receber nem chega aqui: o botao nasce desabilitado, e o
    // motivo fica escrito ao lado dele (decisao 15). Deixar o botao ligado faria
    // o admin escrever um recado inteiro para descobrir no fim que ele nao sai.
    if (!this.podeEscrever()) {
      return;
    }

    this.assuntoDraft.set('');
    this.corpoDraft.set('');
    this.envioError.set(null);
    this.escrevendo.set(true);
  }

  protected fecharEmail(): void {
    this.emailDialogRef()?.nativeElement.close();
    this.escrevendo.set(false);
  }

  protected enviarEmail(): void {
    const user = this.editing();
    // **Um clique duplo não manda dois e-mails.** É a única ação irreversível
    // desta tela, e a proteção é do front: o backend não tem como saber que os
    // dois pedidos são o mesmo recado.
    if (!user || this.enviando() || !this.envioValido()) {
      return;
    }

    this.enviando.set(true);
    this.envioError.set(null);

    this.admin
      .enviarEmailDireto(user.id, {
        subject: this.assuntoDraft().trim(),
        body: this.corpoDraft().trim()
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.fecharEmail();
          this.enviado.set(true);
          setTimeout(() => this.enviado.set(false), 4000);
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.envioError.set(this.mensagemDeEnvio(error));
        }
      });
  }

  /**
   * O texto do erro, escolhido pelo **código** e nunca pela prosa.
   *
   * O `422` traz `reason` no corpo, e é ele que decide a frase — a mesma da
   * tabela da decisão 15. Ler a mensagem do backend com um
   * `includes('descadastr')` quebraria na primeira revisão de copy de lá, e o
   * sintoma seria um erro genérico no lugar da explicação.
   */
  private mensagemDeEnvio(error: unknown): string {
    const status = httpStatus(error);

    if (status === 422) {
      const reason = (
        error as { error?: { reason?: CannotReceiveEmailReason } }
      )?.error?.reason;
      return (
        this.motivoDeNaoReceber(reason ?? null) ||
        'Esse membro não pode receber e-mails agora.'
      );
    }

    if (status === 409) {
      // O trinco da spec 014 aparecendo numa tela que nao fala de campanha. Sem
      // este texto ele e indistinguivel de falha.
      return 'Tem um disparo acontecendo agora. Tente daqui a pouco.';
    }

    if (status === 404) {
      return 'Esse membro não existe mais.';
    }

    return 'Não consegui enviar agora. Tente de novo.';
  }

  protected readonly tierOptions: readonly { id: TierId; label: string }[] = [
    { id: 'dev-tier', label: 'Dev Tier (gratuito)' },
    { id: 'great-dev-tier', label: 'Great Dev Tier' },
    { id: 'ultra-dev-tier', label: 'Ultra Dev Tier' },
    { id: 'master-dev-tier', label: 'Master Dev Tier' }
  ];
}

function numeroOuNulo(valor: string | null): number | null {
  if (valor === null || valor === '') {
    return null;
  }
  const numero = Number(valor);
  // Faixa fora do intervalo vinda da URL e descartada em silencio: ela chega de
  // um link colado, e nao de um controle da tela.
  return Number.isInteger(numero) && numero >= 0 && numero <= MAX_GRADE
    ? numero
    : null;
}

function mensagemDeSalvar(status?: number): string {
  return status === 404
    ? 'Esse usuário ainda não concluiu o onboarding, então não tem perfil para editar.'
    : 'Não consegui salvar agora. Tente de novo.';
}

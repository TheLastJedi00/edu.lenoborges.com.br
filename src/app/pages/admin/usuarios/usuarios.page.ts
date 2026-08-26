import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  OnInit,
  computed,
  inject,
  signal
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
  AdminUserFilters,
  AdminUserPage,
  OnboardingFilter
} from '../../../models/admin.model';
import type { BillingTier } from '../../../models/billing.model';
import type { TierId } from '../../../models/auth.model';
import { describeProgress, MAX_GRADE } from '../../../core/progress/progress';

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

  /** Usuário aberto no detalhe, ou nulo. */
  protected readonly editing = signal<AdminUser | null>(null);
  protected gradeDraft = 0;
  protected tierDraft: TierId = 'dev-tier';
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

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

  protected tierLabel(tier: TierId | null): string {
    if (!tier) {
      return '';
    }
    return this.tiers().find((item) => item.id === tier)?.name ?? tier;
  }

  // ------------------------------------------------------------------- Edições

  protected startEdit(user: AdminUser): void {
    this.saveError.set(null);
    this.gradeDraft = user.grade ?? 0;
    // O seletor abre NO VALOR DO MEMBRO. Ele abria vazio desde a spec 010,
    // porque a API declarava o campo e nunca o devolvia — e o admin escolhia às
    // cegas. `dev-tier` aqui é só o caso de quem ainda não tem perfil.
    this.tierDraft = user.tier ?? 'dev-tier';
    this.editing.set(user);
  }

  protected cancelEdit(): void {
    this.editing.set(null);
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

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, firstValueFrom, of, startWith, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { PixelPanel } from '../../../components/pixel-panel/pixel-panel';
import { BillingService } from '../../../services/billing.service';
import { EmailService } from '../../../services/email.service';
import { httpErrorMessage, httpStatus } from '../../../core/http-error';
import { describeNotificationTime } from '../../../core/notifications/notification-time';
import {
  AudienceCount,
  EmailCampaign,
  EmailFilters,
  SendEmailRequest
} from '../../../models/email.model';
import type { TierId } from '../../../models/auth.model';
import type { BillingTier } from '../../../models/billing.model';

/**
 * Quanto esperar antes de recalcular a audiência, para não ir a cada tecla.
 *
 * É token, e não constante solta, por um motivo só: **a app é zoneless, então
 * `fakeAsync` não existe aqui** e o relógio do Jasmine não alcança o
 * `asyncScheduler` do RxJS. Sem poder adiantar o tempo, a única forma de o teste
 * do `switchMap` continuar existindo é encurtar a espera — e ela é justamente o
 * teste que garante que a resposta antiga nunca vence a nova.
 */
export const AUDIENCE_DEBOUNCE_MS = new InjectionToken<number>(
  'AUDIENCE_DEBOUNCE_MS',
  { providedIn: 'root', factory: () => 400 },
);

/**
 * Disparo de e-mails (spec 014).
 *
 * **Esta é a primeira tela do produto cuja ação não tem desfazer de espécie
 * nenhuma.** Vídeo publicado se apaga, pergunta moderada se restaura, `grade`
 * errado se corrige na linha de cima. E-mail que saiu está na caixa de entrada
 * de todo mundo, com o nome do produto em cima, e não há botão nesta tela nem em
 * nenhuma outra que o traga de volta.
 *
 * Todo o desenho é essa frase repetida em forma de interface: a contagem aparece
 * antes, o teste vem antes do envio, o botão diz o número, e a confirmação diz o
 * número de novo. **É atrito de propósito**, e é o único lugar do produto onde
 * atrito é a decisão certa.
 */
@Component({
  selector: 'app-admin-emails-page',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialog, PixelPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './emails.page.html',
  styleUrl: './emails.page.scss'
})
export class AdminEmailsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly emails = inject(EmailService);
  private readonly billing = inject(BillingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly debounceMs = inject(AUDIENCE_DEBOUNCE_MS);

  private readonly confirmDialog = viewChild<ConfirmDialog>('confirmDialog');

  // ------------------------------------------------------------------ Escrever

  /**
   * O corpo é um `textarea`, e nunca um editor rico.
   *
   * O backend recusa HTML do admin, e o front não pode oferecer o que o backend
   * recusa. A recusa é boa: o e-mail sai com o template do código, que já está
   * diagramado, e um editor rico só permitiria desmanchar essa diagramação num
   * cliente de e-mail que o admin não vai ver antes de mandar.
   */
  protected readonly form = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    ctaLabel: [''],
    ctaUrl: ['']
  });

  /**
   * O botão é opcional, mas é indivisível.
   *
   * Rótulo sem endereço é um botão que não leva a lugar nenhum; endereço sem
   * rótulo é um link invisível. Os dois vêm juntos ou nenhum vem.
   */
  protected readonly ctaIncompleto = computed(() => {
    const { ctaLabel, ctaUrl } = this.valores();
    return Boolean(ctaLabel) !== Boolean(ctaUrl);
  });

  /** O conteúdo do formulário como sinal, para os `computed` reagirem. */
  private readonly valores = signal(this.form.getRawValue());

  /**
   * A validade do formulário **como sinal**.
   *
   * `form.valid` é uma propriedade comum, e ler uma propriedade comum dentro de
   * um `computed` produz um valor que nunca mais se atualiza: o computed só
   * recalcula quando um *sinal* de que ele depende muda, e a propriedade não é
   * um. O sintoma é o pior possível nesta tela — o botão de disparo travado
   * mesmo com tudo preenchido, ou destravado quando não devia.
   */
  protected readonly formValido = signal(this.form.valid);

  // ----------------------------------------------------------------- Para quem

  protected readonly tiers = signal<readonly BillingTier[]>([]);
  protected readonly tiersSelecionados = signal<readonly TierId[]>([]);
  protected readonly gradeMin = signal<number | null>(null);
  protected readonly gradeMax = signal<number | null>(null);

  /** 0 a 13, as etapas da Liga Dev. */
  protected readonly grades = Array.from({ length: 14 }, (_, indice) => indice);

  protected readonly semFiltro = computed(
    () =>
      this.tiersSelecionados().length === 0 &&
      this.gradeMin() === null &&
      this.gradeMax() === null
  );

  // ------------------------------------------------------------- Contagem viva

  protected readonly audienceCount = signal<number | null>(null);
  protected readonly audienceFalhou = signal(false);

  /** Cada mexida em filtro empurra um evento aqui. */
  private readonly filtrosMudaram = new Subject<void>();

  constructor() {
    /**
     * `debounceTime` para não ir a cada clique, e **`switchMap` para a resposta
     * antiga nunca vencer a nova**: duas mudanças rápidas com `mergeMap`
     * deixariam a tela mostrar o número do filtro anterior — e o botão de envio
     * repete esse número. Disparar com o número errado na tela é exatamente o
     * acidente que esta tela existe para impedir.
     *
     * `startWith` faz o primeiro cálculo na abertura, com filtro nenhum: a tela
     * precisa dizer "Todos os membros" com um número ao lado desde o começo.
     */
    this.filtrosMudaram
      .pipe(
        debounceTime(this.debounceMs),
        startWith(undefined),
        switchMap(() =>
          this.emails
            .audiencia(this.filtrosDaAudiencia())
            .pipe(catchError(() => of(null)))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((resposta) => this.aplicarContagem(resposta));

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.valores.set(this.form.getRawValue());
        this.formValido.set(this.form.valid);
      });

    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formValido.set(this.form.valid));
  }

  ngOnInit(): void {
    this.carregarHistorico();

    this.billing
      .getCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Os rótulos dos tiers vêm do catálogo, e não são digitados de novo:
        // dois lugares com o mesmo nome divergem no primeiro rebatismo.
        next: (catalogo) => this.tiers.set(catalogo.tiers),
        error: () => undefined
      });
  }

  protected alternarTier(tier: TierId): void {
    this.tiersSelecionados.update((atuais) =>
      atuais.includes(tier)
        ? atuais.filter((id) => id !== tier)
        : [...atuais, tier]
    );
    this.filtrosMudaram.next();
  }

  protected definirGrade(qual: 'min' | 'max', valor: string): void {
    const numero = valor === '' ? null : Number(valor);
    if (qual === 'min') {
      this.gradeMin.set(numero);
    } else {
      this.gradeMax.set(numero);
    }
    this.filtrosMudaram.next();
  }

  /**
   * Falha de audiência **bloqueia o envio** (decisão 14).
   *
   * É diferente da spec 012, onde a falha da notificação não podia virar erro
   * nenhum, e a diferença é a consequência: lá o pior caso era não ver um aviso;
   * aqui o pior caso é disparar às cegas para uma audiência que ninguém
   * confirmou. **Quando a informação que falta é o tamanho do estrago, a
   * ausência dela bloqueia.**
   */
  private aplicarContagem(resposta: AudienceCount | null): void {
    if (!resposta) {
      this.audienceCount.set(null);
      this.audienceFalhou.set(true);
      return;
    }

    this.audienceFalhou.set(false);
    this.audienceCount.set(resposta.count);
  }

  /**
   * **Lista vazia nunca vai no corpo.**
   *
   * `tiers: []` significaria "nenhum tier" para a API e mandaria a campanha para
   * zero pessoa; a ausência é que significa "todos".
   */
  private filtrosDaAudiencia(): EmailFilters {
    return {
      ...(this.tiersSelecionados().length > 0
        ? { tiers: this.tiersSelecionados() }
        : {}),
      ...(this.gradeMin() !== null ? { gradeMin: this.gradeMin()! } : {}),
      ...(this.gradeMax() !== null ? { gradeMax: this.gradeMax()! } : {})
    };
  }

  /** O corpo inteiro de um disparo: conteúdo + filtros, na mesma forma. */
  protected payload(): SendEmailRequest {
    const { subject, body, ctaLabel, ctaUrl } = this.valores();

    return {
      subject,
      body,
      ...(ctaLabel && ctaUrl ? { ctaLabel, ctaUrl } : {}),
      ...this.filtrosDaAudiencia()
    };
  }

  // -------------------------------------------------------------------- Prévia

  /** Cada bloco separado por linha em branco é um parágrafo, como no template. */
  protected readonly paragrafos = computed(() =>
    this.valores()
      .body.split(/\n\s*\n/)
      .map((bloco) => bloco.trim())
      .filter((bloco) => bloco.length > 0)
  );

  protected readonly temCta = computed(() => {
    const { ctaLabel, ctaUrl } = this.valores();
    return Boolean(ctaLabel && ctaUrl);
  });

  // ---------------------------------------------------------------- Disparo

  protected readonly enviandoTeste = signal(false);
  protected readonly testeEnviado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  /**
   * O aviso de que o envio **começou** e pode ter sido interrompido.
   *
   * Separado do `erro` comum de propósito: este texto não é uma falha, é um
   * estado desconhecido, e ele manda olhar o histórico em vez de tentar de novo.
   */
  protected readonly talvezInterrompido = signal(false);

  /**
   * Assinatura do conteúdo testado.
   *
   * O destravamento morre a cada edição, e **esse é o ponto**: testar uma versão
   * e enviar outra é o mesmo que não ter testado. Guardar a assinatura, e não um
   * booleano, é o que faz a invalidação acontecer sozinha.
   *
   * **Filtro não entra aqui**: mudar de tier não invalida o teste, porque o
   * conteúdo é o mesmo.
   */
  private readonly conteudoTestado = signal<string | null>(null);

  private assinaturaDoConteudo(): string {
    const { subject, body, ctaLabel, ctaUrl } = this.valores();
    return JSON.stringify([subject, body, ctaLabel, ctaUrl]);
  }

  protected readonly precisaTestar = computed(
    () => this.conteudoTestado() !== this.assinaturaDoConteudo(),
  );

  protected readonly podeEnviar = computed(
    () =>
      this.formValido() &&
      !this.ctaIncompleto() &&
      !this.precisaTestar() &&
      this.audienceCount() !== null &&
      this.audienceCount()! > 0 &&
      !this.enviando(),
  );

  /**
   * O botão diz o número, e nunca só "Enviar".
   *
   * Um botão que diz "Enviar" esconde a única informação que importa no instante
   * da decisão. Repetir o número custa nada e transforma o clique em uma
   * leitura: quem esperava disparar para três pessoas e lê "Enviar para 118"
   * para o dedo — que é exatamente o acidente que esta tela precisa impedir.
   *
   * **O número sai da mesma fonte da contagem**, e não de uma segunda variável:
   * duas verdades sobre o mesmo número é como elas divergem.
   */
  protected readonly rotuloDoEnvio = computed(() => {
    const total = this.audienceCount();
    return total === null
      ? 'Enviar'
      : `Enviar para ${total} ${total === 1 ? 'pessoa' : 'pessoas'}`;
  });

  async enviarTeste(): Promise<void> {
    if (this.form.invalid || this.ctaIncompleto() || this.enviandoTeste()) {
      return;
    }

    this.enviandoTeste.set(true);
    this.erro.set('');

    try {
      await firstValueFrom(this.emails.enviarTeste(this.payload()));
      this.conteudoTestado.set(this.assinaturaDoConteudo());
      this.testeEnviado.set(true);
    } catch (error: unknown) {
      this.erro.set(
        httpErrorMessage(error, 'Não consegui enviar o teste agora.'),
      );
    } finally {
      this.enviandoTeste.set(false);
    }
  }

  protected abrirConfirmacao(): void {
    if (!this.podeEnviar()) {
      return;
    }
    this.confirmDialog()?.open();
  }

  /**
   * O disparo.
   *
   * Durante a requisição a tela fica travada e o botão vira "Enviando…".
   * **Sem barra de progresso**: o backend envia dentro de uma requisição só e
   * não há progresso para ler. Inventar uma barra animada que não representa
   * nada é mentira de interface, e a mentira aparece justamente quando o envio
   * demora — o momento em que a pessoa mais está olhando.
   */
  async enviar(): Promise<void> {
    if (!this.podeEnviar()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set('');
    this.talvezInterrompido.set(false);
    this.form.disable({ emitEvent: false });

    try {
      await firstValueFrom(this.emails.enviar(this.payload()));
      this.form.reset();
      this.conteudoTestado.set(null);
      this.testeEnviado.set(false);
      this.carregarHistorico();
    } catch (error: unknown) {
      // **Nunca "não foi enviado, tente de novo".** O backend gravou a campanha
      // antes do primeiro lote e guarda onde parou; quem lê "não foi enviado"
      // clica de novo, e a segunda tentativa manda tudo outra vez para quem já
      // recebeu. Essa é a pior consequência possível desta tela.
      //
      // A divisão é entre **"não começou" e "não sei"**:
      //
      // - Recusa do servidor com status de negócio (409, 400, 403) é resposta
      //   completa: a campanha não foi criada, e dizer o motivo é seguro.
      // - **Tudo o mais é "não sei"** — e aí entra o status `0`, que é conexão
      //   que caiu ou tempo estourado. É o caso mais provável de todos, e é
      //   exatamente aquele em que a campanha pode estar no meio do caminho.
      const status = httpStatus(error);
      const recusaCompleta = status !== null && status >= 400 && status < 500;

      if (status === 409) {
        this.erro.set(
          'Já existe um disparo em andamento. Espere ele terminar antes de começar outro.',
        );
      } else if (recusaCompleta) {
        this.erro.set(httpErrorMessage(error, 'Não consegui começar o envio.'));
      } else {
        this.talvezInterrompido.set(true);
      }
      this.carregarHistorico();
    } finally {
      this.enviando.set(false);
      this.form.enable({ emitEvent: false });
    }
  }

  // ------------------------------------------------------------------ Enviados

  protected readonly campanhas = signal<readonly EmailCampaign[]>([]);
  protected readonly retomando = signal<string | null>(null);

  /** Uma requisição ao abrir, e outra depois de um envio. **Nada de polling.** */
  private carregarHistorico(): void {
    this.emails
      .listar()
      .pipe(
        catchError(() => of([] as EmailCampaign[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((lista) => this.campanhas.set(lista));
  }

  /**
   * Continua de onde parou, e **nunca reenvia do começo**.
   *
   * Enquanto retoma, a linha fica em estado de envio e o disparo novo fica
   * bloqueado: o backend só aceita um por vez, e a tela não deve descobrir isso
   * por um 409.
   */
  async retomar(id: string): Promise<void> {
    if (this.retomando()) {
      return;
    }

    this.retomando.set(id);
    this.erro.set('');

    try {
      await firstValueFrom(this.emails.retomar(id));
    } catch (error: unknown) {
      this.erro.set(
        httpErrorMessage(error, 'Não consegui retomar esse disparo agora.'),
      );
    } finally {
      this.retomando.set(null);
      this.carregarHistorico();
    }
  }

  protected quando(iso: string): string {
    return describeNotificationTime(iso);
  }
}

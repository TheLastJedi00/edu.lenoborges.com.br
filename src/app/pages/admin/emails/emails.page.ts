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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, of, startWith, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PixelPanel } from '../../../components/pixel-panel/pixel-panel';
import { BillingService } from '../../../services/billing.service';
import { EmailService } from '../../../services/email.service';
import { AudienceCount, EmailFilters, SendEmailRequest } from '../../../models/email.model';
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
  imports: [ReactiveFormsModule, PixelPanel],
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
      .subscribe(() => this.valores.set(this.form.getRawValue()));
  }

  ngOnInit(): void {
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
}

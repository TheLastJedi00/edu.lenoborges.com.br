import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CreateVideoRequest } from '../../models/admin.model';
import { AnsweredQuestion } from '../../models/track.model';
import { dataPorExtenso } from '../../core/datas';

/**
 * Formulário de publicação de vídeo numa insígnia.
 *
 * **O título é obrigatório e não é preenchido a partir do YouTube.** O de lá é
 * escrito para o algoritmo — "AULA 3 COMPLETA", emoji, nome do canal — e o daqui
 * diz onde a pessoa está na trilha. Um preenchimento automático faria todo mundo
 * aceitar o do algoritmo, que é exatamente o que a decisão 6 da spec 009 do
 * backend evita.
 *
 * **Ele tem dois modos** (spec 017). Com uma pergunta em `question`, está em
 * modo resposta: mostra a pergunta no topo com o mesmo desenho do balão da
 * trilha — o admin vê o que o aluno vai ver —, troca o rótulo do botão e diz
 * que link de Shorts serve. Sem ela, é exatamente o formulário de antes.
 *
 * Não basta mandar `kind` por baixo: o modo muda o formulário inteiro, porque a
 * pessoa precisa saber que está publicando outra coisa.
 *
 * **Em modo resposta ele ganha um toggle** (spec 021): ligado, a resposta entra
 * na trilha em vez da aba de Perguntas Frequentes. A escolha acontece uma vez,
 * na publicação, e não existe rota para movê-la depois — o conserto de um
 * engano é remover e republicar.
 */
@Component({
  selector: 'app-video-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      @if (question(); as pergunta) {
        <!--
          A pergunta NÃO é um campo do formulário: ela veio da URL, o servidor
          vai verificá-la, e um campo editável aqui só criaria a chance de
          alguém colar um id errado.

          O desenho é o do balão da trilha, de propósito: quem publica vê o que
          o aluno vai ver.
        -->
        <blockquote class="balao">
          <p class="balao__eyebrow u-mono">Respondendo</p>
          <p class="balao__pergunta">{{ pergunta.title }}</p>
          <p class="balao__meta u-mono">
            <cite class="balao__autor">{{ pergunta.authorName }}</cite>
            · {{ dataDaPergunta(pergunta) }}
          </p>
        </blockquote>
      }

      <label class="form__label" for="video-title">Título na plataforma</label>
      <input
        id="video-title"
        class="form__input"
        type="text"
        formControlName="title"
        placeholder="Herança e composição, na prática"
        autocomplete="off"
        enterkeyhint="next"
      />
      <p class="form__hint">
        Este é o título que o aluno vê. Não precisa ser o do YouTube.
      </p>

      <label class="form__label" for="video-url">Link do YouTube</label>
      <input
        id="video-url"
        class="form__input"
        type="url"
        formControlName="youtubeUrl"
        [placeholder]="question() ? 'https://youtube.com/shorts/…' : 'https://youtu.be/…'"
        autocomplete="off"
        inputmode="url"
        enterkeyhint="done"
      />
      @if (question()) {
        <!--
          A informação que faltava e que causava o 400: link de Shorts era
          recusado até a spec 017, e o admin não tinha como saber que aquele era
          o problema.
        -->
        <p class="form__hint">
          Link de Shorts serve — é a forma em que a resposta costuma nascer.
        </p>
      }

      <label class="form__label" for="video-description">Descrição (opcional)</label>
      <input
        id="video-description"
        class="form__input"
        type="text"
        formControlName="description"
        placeholder="Uma linha sobre o que o vídeo resolve"
        autocomplete="off"
      />

      @if (question()) {
        <!--
          O toggle da spec 021, e ele só existe em modo resposta: em modo aula
          não teria significado, porque aula vive na trilha e ponto.

          Nasce desligado, e o padrão é a decisão — o comportamento de hoje
          continua sendo o que acontece quando ninguém decide nada.

          A etiqueta diz que é uma TROCA DE LUGAR, e não uma adição: "posicionar
          na trilha" sozinho não conta que a resposta sai da aba de Perguntas
          Frequentes, e essa é a metade que surpreende depois.
        -->
        <label class="trilha">
          <input
            type="checkbox"
            class="trilha__input"
            formControlName="posicionarNaTrilha"
          />
          <span class="trilha__texto">
            <span class="trilha__label">Posicionar na trilha</span>
            <span class="trilha__hint">
              A resposta entra na sequência das aulas e sai da aba de Perguntas
              Frequentes. Depois de publicar, as setas movem ela de lugar.
            </span>
          </span>
        </label>
      }

      @if (error(); as mensagem) {
        <p class="form__error" role="alert">{{ mensagem }}</p>
      }

      <div class="form__actions">
        <button type="button" class="btn btn--ghost" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Publicando…' : question() ? 'Publicar a resposta' : 'Publicar' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .form {
      display: grid;
      gap: 0.35rem;
    }

    /* O mesmo desenho do balão da trilha, sem o rabicho: aqui não há vídeo
       abaixo para ele apontar. O admin vê o que o aluno vai ver. */
    .balao {
      margin: 0 0 0.4rem;
      padding: 0.85rem 1rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--screen);
    }

    .balao__eyebrow {
      margin: 0 0 0.35rem;
      color: var(--ink-soft);
      font-size: var(--step--2);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .balao__pergunta {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--step-0);
      line-height: 1.3;
    }

    .balao__meta {
      margin: 0.4rem 0 0;
      color: var(--ink-soft);
      font-size: var(--step--1);
    }

    .balao__autor {
      font-style: normal;
    }

    .form__label {
      margin-top: 0.5rem;
      font-size: var(--step--1);
      font-weight: 700;
      color: var(--ink-soft);
    }

    .form__input {
      min-height: 2.75rem;
      padding: 0.6rem 0.75rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: var(--paper);
      font-family: var(--font-body);
      font-size: var(--step-0);
      color: var(--ink);
    }

    .form__input:focus-visible {
      outline: 2px solid var(--accent-deep);
      outline-offset: 1px;
    }

    .form__hint {
      margin: 0;
      color: var(--ink-soft);
      font-size: var(--step--1);
    }

    .form__error {
      margin: 0.4rem 0 0;
      color: #c0392b;
    }

    /* O toggle da spec 021. Um checkbox de verdade dentro de um label: foco por
       teclado, espaço para alternar, estado anunciado pelo leitor de tela e o
       alvo de toque estendido para o texto inteiro. */
    .trilha {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 0.85rem;
      padding: 0.75rem 0.85rem;
      min-height: 2.75rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: var(--screen);
      cursor: pointer;
    }

    .trilha__input {
      flex: 0 0 auto;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.15rem;
    }

    .trilha__texto {
      display: grid;
      gap: 0.2rem;
    }

    .trilha__label {
      font-family: var(--font-display);
      font-size: var(--step--1);
      font-weight: 700;
    }

    .trilha__hint {
      color: var(--ink-soft);
      font-size: var(--step--2);
      line-height: 1.5;
    }

    .form__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 0.75rem;
    }

    .btn {
      min-height: 2.75rem;
      padding: 0.6rem 1.1rem;
      border: var(--border-w) solid var(--ink);
      border-radius: var(--radius-sm);
      background: var(--ink);
      color: var(--paper);
      font-family: var(--font-body);
      font-weight: 700;
      cursor: pointer;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--ghost {
      background: transparent;
      color: var(--ink);
    }
  `
})
export class VideoForm {
  private readonly fb = inject(FormBuilder);

  readonly saving = input<boolean>(false);
  readonly error = input<string | null>(null);
  /**
   * A pergunta a responder. Preenchida, põe o formulário em modo resposta.
   *
   * É **entrada do componente e não campo do formulário**: não é editável, não
   * participa da validação, e não pode ser trocada por quem publica.
   */
  readonly question = input<AnsweredQuestion | null>(null);

  readonly submitted = output<CreateVideoRequest>();
  readonly cancel = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    youtubeUrl: ['', [Validators.required]],
    description: [''],
    /**
     * O toggle da spec 021, **desligado ao nascer**.
     *
     * Ele existe no grupo mesmo em modo aula, onde o campo nem é renderizado:
     * um controle condicional exigiria `addControl`/`removeControl` a cada
     * troca de modo, e o valor `false` de um campo invisível não vai para o
     * corpo de jeito nenhum — quem decide isso é o `onSubmit`, pela pergunta.
     */
    posicionarNaTrilha: [false]
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { title, youtubeUrl, description, posicionarNaTrilha } =
      this.form.getRawValue();
    const pergunta = this.question();

    // A URL vai como o admin colou. Extrair o ID aqui criaria uma segunda
    // implementação da mesma regra — e ela chega em seis formas.
    //
    // `kind` e `questionId` saem **juntos ou nenhum dos dois**: resposta sem
    // pergunta e aula com pergunta são os dois 400 do backend, e o modo é o
    // único lugar que decide isso.
    // `tab` só sai quando o toggle está ligado, e só em modo resposta (spec
    // 021). Desligado, ele **não vai**: o servidor deriva `tab = kind`, e
    // mandar `tab: 'resposta'` explicitamente seria só ruído. Em modo aula ele
    // não vai nunca — `kind: 'aula'` com `tab: 'resposta'` é 400, e um campo
    // invisível não pode ser o que produz esse erro.
    this.submitted.emit({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(pergunta ? { kind: 'resposta' as const, questionId: pergunta.id } : {}),
      ...(pergunta && posicionarNaTrilha ? { tab: 'aula' as const } : {})
    });
  }

  /** A data da pergunta, por extenso. Nunca a da publicação do vídeo. */
  protected dataDaPergunta(pergunta: AnsweredQuestion): string {
    return dataPorExtenso(pergunta.askedAt);
  }

  reset(): void {
    this.form.reset({
      title: '',
      youtubeUrl: '',
      description: '',
      // Volta a desligado: o padrão é o comportamento de hoje, e uma escolha
      // que sobrevivesse à publicação anterior mandaria a próxima resposta para
      // a trilha sem ninguém ter decidido isso de novo.
      posicionarNaTrilha: false
    });
  }
}

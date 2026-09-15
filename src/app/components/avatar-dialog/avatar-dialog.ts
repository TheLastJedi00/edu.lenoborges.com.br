import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

/** O que o input aceita. A conferência que vale é a do servidor, pelos bytes. */
const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp';

/**
 * O modal de trocar a foto de perfil (spec 027).
 *
 * **Componente burro.** Recebe `temFoto`, `enviando` e `erro`, e emite `saved` com
 * o `Blob` recortado, `removed` e `closed`. **Ele não fala com serviço nenhum** —
 * quem chama a API é a página de Meu Perfil.
 *
 * **O recorte sai em 200x200 da própria biblioteca** (`resizeToWidth`,
 * `resizeToHeight`, `output="blob"`, `format="webp"`), então não existe um passo de
 * canvas nosso depois: é o mesmo canvas, uma vez. O `roundCropper` é só a máscara
 * do gesto — o `Blob` que sai é quadrado, e quem arredonda na exibição é o
 * `app-avatar`.
 *
 * **Nada sobe antes de a pessoa confirmar.** O `imageCropped` da biblioteca dispara
 * a cada arrasto e a cada zoom; enviar nele faria um upload por pixel movido.
 */
@Component({
  selector: 'app-avatar-dialog',
  imports: [ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="foto animate-enter"
      aria-labelledby="titulo-foto"
      (cancel)="onCancel($event)"
    >
      <h2 class="foto__title" id="titulo-foto">Sua foto de perfil</h2>

      <p class="foto__lead">
        Ela aparece no Ranking e no seu cartão de membro. Escolha uma imagem e
        ajuste o enquadramento.
      </p>

      @if (!arquivo()) {
        <div class="foto__vazio">
          <button
            type="button"
            class="btn btn--solid"
            data-test="escolher"
            (click)="abrirSeletor()"
          >
            Escolher imagem
          </button>
          <p class="foto__help">JPEG, PNG ou WebP, até 5 MB.</p>
        </div>
      } @else {
        <div class="foto__cropper">
          <image-cropper
            [imageFile]="arquivo() ?? undefined"
            [roundCropper]="true"
            [maintainAspectRatio]="true"
            [aspectRatio]="1"
            [resizeToWidth]="200"
            [resizeToHeight]="200"
            output="blob"
            format="webp"
            [imageQuality]="85"
            [alignImage]="'center'"
            cropperFrameAriaLabel="Área de recorte da foto. Arraste para enquadrar."
            (imageCropped)="aoRecortar($event)"
            (loadImageFailed)="aoFalharAImagem()"
          />
        </div>

        <button
          type="button"
          class="btn btn--cancel foto__trocar"
          data-test="escolher"
          (click)="abrirSeletor()"
        >
          Escolher outra
        </button>
      }

      @if (mensagem()) {
        <p class="foto__error" role="alert">{{ mensagem() }}</p>
      }

      <input
        #input
        class="foto__input"
        type="file"
        [accept]="tiposAceitos"
        (change)="aoEscolher($event)"
      />

      <div class="foto__actions">
        @if (temFoto()) {
          <button
            type="button"
            class="btn btn--cancel foto__remover"
            data-test="remover"
            [disabled]="enviando()"
            (click)="remover()"
          >
            Remover foto
          </button>
        }

        <button
          type="button"
          class="btn btn--cancel"
          data-test="fechar"
          [disabled]="enviando()"
          (click)="fechar()"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="btn btn--solid"
          data-test="confirmar"
          [disabled]="!podeConfirmar()"
          (click)="confirmar()"
        >
          {{ enviando() ? 'Enviando...' : 'Salvar foto' }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .foto {
      width: min(28rem, calc(100vw - 2rem));
      inset: 0;
      margin: auto;
      padding: 1.5rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      color: var(--ink);
    }

    .foto[open] {
      display: block;
    }

    .foto::backdrop {
      background: rgba(16, 24, 40, 0.6);
      backdrop-filter: blur(4px);
    }

    .foto__title {
      margin: 0 0 0.5rem;
      font-family: var(--font-display);
      font-size: var(--step-1);
      line-height: 1.2;
    }

    .foto__lead {
      margin: 0 0 1rem;
      color: var(--ink-soft);
      font-size: var(--step--1);
      line-height: 1.5;
    }

    .foto__vazio {
      display: grid;
      justify-items: center;
      gap: 0.6rem;
      padding: 1.5rem 1rem;
      border: 2px dashed var(--screen-deep);
      border-radius: var(--radius);
      background: var(--gradient-panel);
    }

    .foto__help {
      margin: 0;
      color: var(--ink-soft);
      font-size: var(--step--1);
    }

    /* A altura fixa evita o salto do modal quando a imagem carrega e o cropper
       calcula o próprio tamanho. */
    .foto__cropper {
      height: 16rem;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--screen);
    }

    .foto__trocar {
      margin-top: 0.6rem;
    }

    /* O input existe para ser clicado pelo botão, e nunca é mostrado: o controle
       nativo não aceita os estilos do projeto. Escondê-lo com display none o
       tiraria da ordem de tabulação de um jeito que alguns leitores de tela não
       recuperam, então ele é recortado em vez de removido. */
    .foto__input {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    .foto__error {
      margin: 0.75rem 0 0;
      color: #b42318;
      font-size: var(--step--1);
    }

    .foto__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }

    /* Remover empurra as outras para a direita: é a ação destrutiva, e ela não
       deve ficar do lado do Salvar. */
    .foto__remover {
      margin-right: auto;
    }

    @media (prefers-reduced-motion: reduce) {
      .foto {
        animation: none;
      }
    }
  `,
})
export class AvatarDialog implements AfterViewInit {
  /** Se a pessoa já tem foto: é o que decide se "Remover foto" existe. */
  readonly temFoto = input<boolean>(false);
  readonly enviando = input<boolean>(false);
  /** O erro que a página recebeu da API, já traduzido para quem lê. */
  readonly erro = input<string | null>(null);

  readonly saved = output<Blob>();
  readonly removed = output<void>();
  readonly closed = output<void>();

  protected readonly tiposAceitos = TIPOS_ACEITOS;

  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly arquivo = signal<File | null>(null);
  private readonly recorte = signal<Blob | null>(null);
  /** Erro nosso, de leitura do arquivo. O da API chega pelo input `erro`. */
  private readonly erroLocal = signal<string | null>(null);

  protected readonly mensagem = computed(() => this.erroLocal() ?? this.erro());

  protected readonly podeConfirmar = computed(
    () => !!this.recorte() && !this.enviando()
  );

  /**
   * Se o componente ja morreu.
   *
   * **Existe por causa de um aviso real, e nao por precaucao.** O host desenha
   * este modal dentro de um `@if`, e quando o `@if` fecha o `<dialog>` e removido
   * ainda aberto -- o navegador dispara o `cancel` dele **depois** da destruicao
   * do componente, e o `closed.emit()` cai num `OutputRef` morto (NG0953). O
   * sintoma no teste e um aviso; em producao seria um `closed` chegando ao host
   * depois de ele ja ter fechado o modal, que e a receita do modal que reabre.
   */
  private destruido = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destruido = true));
  }

  ngAfterViewInit(): void {
    this.dialogRef().nativeElement.showModal();
  }

  protected abrirSeletor(): void {
    this.inputRef().nativeElement.click();
  }

  aoEscolher(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    // Escolher outro arquivo limpa o que sobrou da tentativa anterior: manter o
    // erro na tela ao lado de uma imagem nova diria que a nova falhou.
    this.erroLocal.set(null);
    this.recorte.set(null);
    this.arquivo.set(file);
  }

  aoRecortar(event: ImageCroppedEvent): void {
    this.recorte.set(event.blob ?? null);
  }

  aoFalharAImagem(): void {
    // Volta ao estado de escolha em vez de deixar um recorte quebrado na tela.
    this.arquivo.set(null);
    this.recorte.set(null);
    this.erroLocal.set(
      'Não consegui abrir essa imagem. Tente outro formato: JPEG, PNG ou WebP.'
    );
  }

  confirmar(): void {
    const blob = this.recorte();
    if (!blob || this.enviando()) {
      return;
    }

    this.saved.emit(blob);
  }

  remover(): void {
    this.removed.emit();
  }

  fechar(): void {
    this.closed.emit();
  }

  /** `Esc` fecha, como nos outros modais canceláveis — mas não durante o envio. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    if (!this.enviando() && !this.destruido) {
      this.fechar();
    }
  }
}

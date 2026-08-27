import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { LegalDocumentView } from '../legal-document-view/legal-document-view';
import { LegalService } from '../../core/legal/legal.service';
import { httpErrorMessage, httpStatus } from '../../core/http-error';
import { LegalDocument } from '../../models/legal.model';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * O documento em modal, com o aceite no rodapé (spec 018, decisões 3 a 5).
 *
 * Um componente para os três usos — onboarding, bloqueio do painel e consulta em
 * Meu Perfil (`readonly`). A segunda cópia da diagramação do texto é a que fica
 * com um `h2` errado seis meses depois, na tela que ninguém abre.
 *
 * **O check está habilitado desde o primeiro instante.** Prendê-lo à rolagem é
 * comum e parece proteger, e não protege: prova que uma roda girou, não que
 * alguém leu. E quebra de verdade para quem usa leitor de tela, para quem usa
 * Ctrl+F, e para quem está no celular com um texto de trinta telas — que passa a
 * ser obrigado a arrastar o polegar por trinta telas para poder clicar. Trocar
 * acessibilidade real por uma aparência de consentimento é o pior negócio
 * disponível.
 *
 * O que o modal faz, e é o que importa, é **abrir no texto**: o documento
 * inteiro está ali, aberto, antes do check — não uma tela de resumo com um link
 * "leia os termos".
 *
 * **O aceite é gravado aqui, no clique, e não no submit do formulário de quem
 * chamou** (decisão 5). Quem aceitou e abandonou o onboarding aceitou; e o modal
 * de bloqueio precisaria gravar sozinho de qualquer jeito, então um segundo
 * caminho de gravação seria o que esquece um campo no dia em que o terceiro
 * documento entrar.
 */
@Component({
  selector: 'app-legal-accept-dialog',
  imports: [LegalDocumentView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" (close)="onNativeClose()">
      <div class="modal__body" tabindex="0" #body>
        @switch (state()) {
          @case ('loading') {
            <p class="modal__status u-mono">Carregando o documento...</p>
          }
          @case ('error') {
            <p class="modal__status u-mono" role="alert">
              Não foi possível carregar o documento. Feche e tente de novo.
            </p>
          }
          @default {
            <app-legal-document-view [document]="document()!" />
          }
        }
      </div>

      <footer class="modal__foot">
        @if (readonly()) {
          <button type="button" class="btn btn--cancel" (click)="close()">Fechar</button>
        } @else {
          <label class="check">
            <input
              type="checkbox"
              [checked]="checked()"
              [disabled]="state() !== 'ready'"
              (change)="toggleCheck($event)"
            />
            <span>Li e concordo com o documento acima.</span>
          </label>

          @if (errorMessage()) {
            <p class="modal__error" role="alert">{{ errorMessage() }}</p>
          }

          <div class="modal__actions">
            <button type="button" class="btn btn--cancel" (click)="close()">Fechar</button>
            <button
              type="button"
              class="btn btn--confirm"
              [disabled]="!checked() || state() !== 'ready' || sending()"
              (click)="accept()"
            >
              {{ sending() ? 'Registrando...' : 'Aceitar' }}
            </button>
          </div>
        }
      </footer>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(46rem, calc(100vw - 2rem));
      max-height: min(42rem, calc(100dvh - 3rem));
      inset: 0;
      margin: auto;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      color: var(--ink);
    }

    .modal[open] {
      animation: anim-rise 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .modal::backdrop {
      background: rgba(16, 24, 40, 0.6);
      backdrop-filter: blur(4px);
    }

    .modal__body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .modal__status {
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    .modal__foot {
      padding: 1rem 1.5rem 1.25rem;
      border-top: var(--border-w) solid var(--border-soft);
      background: var(--paper);
    }

    .check {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: var(--step--1);
      line-height: 1.4;
      cursor: pointer;
    }

    .check input {
      margin-top: 0.15rem;
      width: 1.05rem;
      height: 1.05rem;
      accent-color: var(--accent-deep);
      cursor: pointer;
    }

    .modal__error {
      margin-top: 0.6rem;
      font-size: var(--step--2);
      color: var(--danger, #b42318);
    }

    .modal__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.2rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-display);
      font-size: var(--step--1);
      font-weight: 700;
      cursor: pointer;
      transition: all 160ms ease-out;
    }

    .btn--cancel {
      border: var(--border-w) solid var(--screen-deep);
      background: var(--screen);
      color: var(--ink);
    }

    .btn--confirm {
      border: none;
      background: var(--gradient-accent-strong);
      color: #fff;
      box-shadow: var(--shadow-hard-sm);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
  `
})
export class LegalAcceptDialog {
  private readonly legalService = inject(LegalService);

  readonly documentId = input.required<string>();
  /** Em modo leitura o check e o botão de aceitar não existem (decisão 3). */
  readonly readonly = input(false);

  /** Emite o id do documento aceito, para quem chamou tirar da lista. */
  readonly accepted = output<string>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');

  protected readonly state = signal<LoadState>('loading');
  protected readonly document = signal<LegalDocument | null>(null);
  protected readonly checked = signal(false);
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  open(): void {
    this.checked.set(false);
    this.errorMessage.set(null);
    this.state.set('loading');
    this.dialogRef().nativeElement.showModal();

    // Foco no corpo do texto, e não no botão: anunciar a ação antes do conteúdo
    // é pedir a concordância antes de apresentar o que está sendo concordado.
    this.bodyRef().nativeElement.focus();

    this.legalService.getById(this.documentId()).subscribe({
      next: (document) => {
        this.document.set(document);
        this.state.set('ready');
      },
      error: () => this.state.set('error')
    });
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onNativeClose(): void {
    this.checked.set(false);
    this.errorMessage.set(null);
  }

  protected toggleCheck(event: Event): void {
    this.checked.set((event.target as HTMLInputElement).checked);
  }

  protected accept(): void {
    const document = this.document();
    if (!document || !this.checked() || this.sending()) {
      return;
    }

    this.sending.set(true);
    this.errorMessage.set(null);

    // **A versão vai do documento que a pessoa acabou de ler**, nunca de uma
    // constante do front. É o que faz o 409 de aba velha existir.
    this.legalService.accept(document.id, document.version).subscribe({
      next: () => {
        this.sending.set(false);
        this.accepted.emit(document.id);
        this.close();
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.errorMessage.set(
          httpErrorMessage(error, 'Não foi possível registrar o aceite. Tente de novo.', {
            409: 'Este documento foi atualizado enquanto esta aba estava aberta. Leia a versão nova, logo acima.'
          })
        );

        // 409 é aba velha: o texto na tela não é mais o texto vigente, então
        // ele é recarregado e o check volta a zero. Deixar o documento antigo
        // desenhado com um recado embaixo pediria que a pessoa concordasse
        // outra vez com aquilo que ela está vendo — e não é aquilo que ela
        // estaria aceitando.
        if (httpStatus(error) === 409) {
          this.checked.set(false);
          this.state.set('loading');
          this.legalService.getById(this.documentId()).subscribe({
            next: (fresh) => {
              this.document.set(fresh);
              this.state.set('ready');
            },
            error: () => this.state.set('error')
          });
        }
      }
    });
  }
}

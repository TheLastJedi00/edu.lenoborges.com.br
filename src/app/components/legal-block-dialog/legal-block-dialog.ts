import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { LegalAcceptDialog } from '../legal-accept-dialog/legal-accept-dialog';
import { LegalStore } from '../../core/legal/legal.store';

/**
 * O bloqueio do painel (spec 018, decisão 7).
 *
 * Sobe por cima de tudo enquanto houver documento pendente, e **não é
 * dispensável**: não fecha no Esc, não tem botão de fechar, não tem "agora não"
 * e não fecha no backdrop. Some sozinho quando o último pendente for aceito.
 *
 * **Não reusa o `ConfirmDialog`**, e a recusa é o ponto: aquele componente
 * existe para ser cancelável — tem `cancelLabel`, emite `cancelled`, fecha no
 * Esc — e a coisa mais fácil do mundo é alguém "melhorar" a experiência
 * devolvendo o botão de fechar. Um componente chamado `LegalBlockDialog` cujo
 * `cancel` é `preventDefault` diz o que é ao ser lido.
 *
 * **Tom de alerta, não de erro.** Quem está vendo isto não fez nada errado: os
 * termos foram publicados, e o acesso volta assim que forem aceitos.
 */
@Component({
  selector: 'app-legal-block-dialog',
  imports: [LegalAcceptDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="block"
      aria-labelledby="titulo-bloqueio"
      (cancel)="$event.preventDefault()"
    >
      <h2 class="block__title" id="titulo-bloqueio">Precisamos do seu aceite</h2>
      <p class="block__lead">
        Publicamos os documentos que regem a Liga Dev. Leia cada um e confirme o aceite para
        voltar ao painel. Leva um minuto, e você só faz isso quando algo mudar.
      </p>

      <ul class="block__list">
        @for (doc of legalStore.pending(); track doc.id) {
          <li class="block__item">
            <span class="block__name">{{ doc.title }}</span>
            <button type="button" class="block__btn" (click)="open(doc.id)">Ler e aceitar</button>
          </li>
        }
      </ul>

      <p class="block__note u-mono">
        Você também pode ler em uma aba separada, sem sair daqui:
        <a href="/termos-de-uso" target="_blank" rel="noopener">Termos de Uso</a>
        ·
        <a href="/politica-de-privacidade" target="_blank" rel="noopener">
          Política de Privacidade
        </a>
      </p>
    </dialog>

    @if (openDocumentId(); as docId) {
      <app-legal-accept-dialog
        #acceptDialog
        [documentId]="docId"
        (accepted)="onAccepted($event)"
      />
    }
  `,
  styles: `
    .block {
      width: min(30rem, calc(100vw - 2rem));
      inset: 0;
      margin: auto;
      padding: 1.75rem 1.5rem;
      border: var(--border-w) solid var(--warn-border, #e9c46a);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      color: var(--ink);
    }

    .block::backdrop {
      background: rgba(38, 28, 8, 0.72);
      backdrop-filter: blur(4px);
    }

    .block[open] {
      animation: anim-rise 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .block__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.2;
    }

    .block__lead {
      margin-top: 0.6rem;
      font-size: var(--step--1);
      line-height: 1.55;
      color: var(--ink-soft);
    }

    .block__list {
      margin-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      list-style: none;
    }

    .block__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: var(--screen);
    }

    .block__name {
      font-size: var(--step--1);
      font-weight: 600;
    }

    .block__btn {
      padding: 0.45rem 0.9rem;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--gradient-accent-strong);
      color: #fff;
      font-family: var(--font-display);
      font-size: var(--step--2);
      font-weight: 700;
      cursor: pointer;
    }

    .block__note {
      margin-top: 1.25rem;
      font-size: var(--step--2);
      color: var(--ink-soft);
    }

    .block__note a {
      color: inherit;
    }
  `
})
export class LegalBlockDialog implements AfterViewInit {
  protected readonly legalStore = inject(LegalStore);

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly acceptDialog = viewChild<LegalAcceptDialog>('acceptDialog');

  protected readonly openDocumentId = signal<string | null>(null);

  ngAfterViewInit(): void {
    // O componente só é renderizado quando há pendência (o `@if` do shell),
    // então abrir aqui é abrir exatamente quando o bloqueio precisa existir.
    this.dialogRef().nativeElement.showModal();
  }

  protected open(documentId: string): void {
    this.openDocumentId.set(documentId);
    queueMicrotask(() => this.acceptDialog()?.open());
  }

  protected onAccepted(documentId: string): void {
    this.legalStore.clearOne(documentId);

    if (!this.legalStore.hasPending()) {
      // O último saiu: o painel volta, sem recarregar a página e sem uma segunda
      // ida ao servidor para confirmar o que o 204 já confirmou.
      this.dialogRef().nativeElement.close();
    }
  }
}

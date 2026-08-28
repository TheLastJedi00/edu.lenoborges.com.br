import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild
} from '@angular/core';
import { MemberService } from '../../services/member.service';
import { PublicMember } from '../../models/auth.model';
import { httpStatus } from '../../core/http-error';
import { describeProgress } from '../../core/progress/progress';
import { XpCount } from '../xp-count/xp-count';
import { IconLinkedin } from '../icons/icon-linkedin';
import { IconInstagram } from '../icons/icon-instagram';

type LoadState = 'loading' | 'ready' | 'error' | 'gone';

/**
 * O cartão de um membro, aberto pelo nome no Mural (spec 019, decisão 7).
 *
 * **É modal, e não rota.** Ler quem é a pessoa é um desvio de dois segundos no
 * meio da leitura do Mural, e uma rota faria o retorno custar um `history.back()`
 * que devolve a lista no topo, sem a rolagem e sem a aba. É o mesmo julgamento
 * do `LegalAcceptDialog`, de onde vêm o overlay e o fechamento por `Esc`.
 *
 * **O que não se copia dele é o rodapé**: aqui não há ação, não há gravação e
 * não há nada a confirmar. Fecha por `Esc`, por clique fora e pelo botão.
 *
 * O `uid` chega no `open(uid)`, e não por input, pela razão escrita no
 * `LegalAcceptDialog`: em zoneless, um host que renderiza o diálogo dentro de um
 * `@if` e chama `open()` numa microtask chama antes de o componente existir.
 */
@Component({
  selector: 'app-member-card-dialog',
  imports: [XpCount, IconLinkedin, IconInstagram],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" (close)="onNativeClose()">
      <div class="modal__body" tabindex="0" #body>
        @switch (state()) {
          @case ('loading') {
            <p class="modal__status u-mono">Carregando o perfil...</p>
          }
          @case ('gone') {
            <!--
              404 aqui é uma saída NORMAL do produto, e não uma falha nossa:
              acontece quando alguém exclui a conta com o Mural aberto na outra
              aba. Um erro genérico faria isso parecer bug.
            -->
            <p class="modal__status u-mono" role="status">
              Esse membro não faz mais parte da comunidade.
            </p>
          }
          @case ('error') {
            <p class="modal__status u-mono" role="alert">
              Não consegui carregar esse perfil agora.
            </p>
          }
          @default {
            <article class="cartao">
              <header class="cartao__head">
                <h2 class="cartao__nome">{{ member()!.name ?? 'Membro' }}</h2>
                <p class="cartao__etapa u-mono">{{ etapa() }}</p>
              </header>

              <app-xp-count [xp]="member()!.xp" />

              @if (member()!.bio) {
                <p class="cartao__bio">{{ member()!.bio }}</p>
              }

              <!--
                As redes só aparecem quando vêm. Ausentes NÃO reservam espaço e
                NÃO viram "não informado": quem escolheu não mostrar não precisa
                que a tela anuncie a escolha, e quem não preencheu também não.

                O corte é do servidor — se o link chegasse aqui e a tela
                decidisse escondê-lo, ele já teria sido entregue.
              -->
              @if (member()!.linkedin || member()!.instagram) {
                <ul class="redes">
                  @if (member()!.linkedin; as linkedin) {
                    <li>
                      <a
                        class="redes__link"
                        [href]="linkedin"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <app-icon-linkedin class="redes__icone" />
                        <span>LinkedIn</span>
                      </a>
                    </li>
                  }
                  @if (member()!.instagram; as instagram) {
                    <li>
                      <a
                        class="redes__link"
                        [href]="instagram"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <app-icon-instagram class="redes__icone" />
                        <span>Instagram</span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </article>
          }
        }
      </div>

      <footer class="modal__foot">
        <button type="button" class="btn btn--cancel" (click)="close()">Fechar</button>
      </footer>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(28rem, calc(100vw - 2rem));
      max-height: min(36rem, calc(100dvh - 3rem));
      inset: 0;
      margin: auto;
      padding: 0;
      flex-direction: column;
      overflow: hidden;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      color: var(--ink);
    }

    /* O display fica no [open] pelo mesmo motivo do LegalAcceptDialog: um
       <dialog> fechado é display:none por padrão, e um display:flex solto
       sobrescreve esse padrão e desenha o cartão no meio da página. */
    .modal[open] {
      display: flex;
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

    .cartao {
      display: grid;
      gap: 0.85rem;
      justify-items: start;
    }

    .cartao__head {
      display: grid;
      gap: 0.2rem;
    }

    .cartao__nome {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.2;
    }

    .cartao__etapa {
      margin: 0;
      font-size: var(--step--2);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent-deep);
    }

    .cartao__bio {
      margin: 0;
      color: var(--ink-soft);
      line-height: 1.6;
    }

    .redes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .redes__link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-height: 2.75rem;
      padding: 0.35rem 0.75rem;
      border: var(--border-w) solid var(--screen-deep);
      border-radius: 999px;
      background: var(--screen);
      color: var(--ink);
      font-size: var(--step--1);
      text-decoration: none;
    }

    .redes__icone {
      width: 1rem;
      height: 1rem;
    }

    .modal__foot {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 1.5rem;
      border-top: var(--border-w) solid var(--border-soft);
      background: var(--screen);
    }

    .btn {
      min-height: 2.75rem;
      padding: 0 1.1rem;
      border-radius: var(--radius-md);
      font-family: var(--font-display);
      font-size: var(--step--1);
      font-weight: 700;
      cursor: pointer;
    }

    .btn--cancel {
      border: var(--border-w) solid var(--screen-deep);
      background: var(--screen);
      color: var(--ink);
    }
  `
})
export class MemberCardDialog {
  private readonly members = inject(MemberService);

  /** Avisa quem hospeda que o cartão fechou, para limpar o uid aberto. */
  readonly closed = output<void>();

  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');

  protected readonly state = signal<LoadState>('loading');
  protected readonly member = signal<PublicMember | null>(null);

  /**
   * A etapa em texto, pela mesma tabela que o `BadgeCount` usa.
   *
   * Traduzir `grade` aqui de novo faria a terceira cópia da regra da spec 008 —
   * e a que fica velha é sempre a que menos gente lê.
   */
  protected readonly etapa = computed(() => {
    const atual = this.member();
    if (!atual) {
      return '';
    }

    const progresso = describeProgress(atual.grade);

    return progresso.phase === 'gym'
      ? `${progresso.badges} de 8 insígnias`
      : progresso.label;
  });

  /**
   * Abre o cartão e **busca sempre** (decisão 9).
   *
   * Sem cache: o XP sobe, a bio é editada, o interruptor das redes é ligado — e
   * um cache mostraria o estado de dez minutos atrás sem nada que denunciasse.
   */
  open(uid: string): void {
    this.state.set('loading');
    this.member.set(null);
    this.dialogRef().nativeElement.showModal();
    this.bodyRef().nativeElement.focus();

    this.members.getMember(uid).subscribe({
      next: (member) => {
        this.member.set(member);
        this.state.set('ready');
      },
      // 404 tem estado próprio, com frase própria: é a conta excluída, e não
      // uma falha. Qualquer outro erro é erro.
      error: (error: unknown) =>
        this.state.set(httpStatus(error) === 404 ? 'gone' : 'error')
    });
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onNativeClose(): void {
    this.member.set(null);
    this.closed.emit();
  }
}

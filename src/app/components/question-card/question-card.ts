import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MuralQuestion } from '../../models/mural.model';
import { CommunityService } from '../../services/community.service';
import { tituloDaInsignia } from '../../core/mural/badge-title';

/**
 * Uma pergunta do Mural.
 *
 * O layout é de uma coluna com o ícone da insígnia à esquerda e o voto à
 * direita, **no lado do polegar** — é o toque mais frequente do app inteiro, e
 * o mais fácil de errar com a mão em movimento.
 *
 * **Componente burro.** Ele lê `promotedTo` e desenha o selo; não decide fase,
 * não compara `weekId` e não deduz nada do relógio. Qualquer tentativa de
 * inferir a fase aqui produz o mesmo erro: um cartão desenhado como coleta com
 * voto aberto por baixo.
 */
@Component({
  selector: 'app-question-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [class.card--mine]="question().isMine">
      <!--
        O alvo esticado (spec 024, decisão 3): um botão sobreposto do tamanho do
        cartão, e o título continua sendo título.

        Ele é um elemento de verdade, e não um ::after do próprio título, porque
        o Chrome recorta o pseudo-elemento de um <button> no box do botão: o
        alvo parecia cobrir o cartão no CSS e, medido com elementFromPoint, não
        cobria nada além do texto. O teste de hit-testing da fase 05 é o que
        pega isso.

        Aninhar o voto e o nome do autor dentro de um botão de abrir seria
        <button> dentro de <button>, que é HTML inválido; sobrepondo, os dois
        sobem por cima com z-index e continuam sendo eles mesmos no leitor de
        tela.
      -->
      <button
        type="button"
        class="card__abrir"
        [attr.aria-label]="'Abrir a pergunta: ' + question().title"
        (click)="abrir.emit(question())"
      ></button>

      <div class="card__body">
        <p class="card__badge u-mono">{{ badgeTitle() }}</p>
        <h3 class="card__title">{{ question().title }}</h3>
        <!--
          Prévia de três linhas, e não o texto inteiro. São até 1000 caracteres,
          e em 360px uma pergunta longa empurra as outras cinco para fora da
          tela: a lista deixa de ser lista. O texto inteiro está a um toque, no
          diálogo.
        -->
        @if (question().body) {
          <p class="card__text">{{ question().body }}</p>
        }
        <p class="card__author u-mono">
          <!--
            O nome vira botão SÓ quando há para onde clicar (spec 019, decisão
            8). Sem authorUid — a pergunta anônima de quem excluiu a conta — ele
            é texto e mais nada: sem cursor de link, sem foco por teclado, sem
            role. Não existe um "clicou e deu erro"; o alvo não existe.

            E a comparação é com nulo, nunca com o valor sentinela do backend:
            uma comparação de string aqui sobrevive a uma renomeação do outro
            lado e vira um cartão 404 sobre a pergunta de quem pediu para ser
            esquecido.
          -->
          @if (question().authorUid) {
            <button
              type="button"
              class="card__autor-botao"
              [attr.aria-label]="'Ver o perfil de ' + question().authorName"
              (click)="authorClick.emit(question())"
            >
              {{ question().authorName }}
            </button>
          } @else {
            {{ question().authorName }}
          }
          @if (question().isMine) {
            <span class="card__flag">a sua</span>
          }
          @if (question().promotedTo) {
            <span class="card__flag card__flag--fast">adiantada</span>
          }
        </p>
      </div>

      @if (votable()) {
        <button
          type="button"
          class="vote"
          [class.vote--on]="question().hasVoted"
          [attr.aria-pressed]="question().hasVoted"
          [attr.aria-label]="
            (question().hasVoted ? 'Desfazer voto em ' : 'Votar em ') + question().title
          "
          (click)="toggle.emit(question())"
        >
          <span class="vote__mark" aria-hidden="true">▲</span>
          <span class="vote__count">{{ question().voteCount }}</span>
        </button>
      } @else {
        <p class="vote vote--static" [attr.aria-label]="question().voteCount + ' votos'">
          <span class="vote__mark" aria-hidden="true">▲</span>
          <span class="vote__count">{{ question().voteCount }}</span>
        </p>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .card {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.75rem;
      align-items: start;
      padding: 1rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      cursor: pointer;
      transition:
        border-color var(--motion-1, 120ms) var(--ease-out, ease),
        box-shadow var(--motion-1, 120ms) var(--ease-out, ease);
    }

    /*
     * O realce não é enfeite: sem ele o alvo esticado é invisível, e ninguém
     * descobre que dá para abrir — que é exatamente o defeito que a spec 024
     * conserta. O :focus-within põe o teclado no mesmo pé do ponteiro.
     */
    .card:hover,
    .card:focus-within {
      border-color: var(--accent-deep);
      box-shadow: var(--shadow-hard-sm);
    }

    .card--mine {
      border-color: var(--accent-deep);
      background: var(--gradient-panel);
    }

    .card__badge {
      margin: 0;
      font-size: 0.65rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent-deep);
    }

    .card__title {
      margin: 0.2rem 0 0;
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      line-height: 1.25;
    }

    /*
     * O alvo, invisível e do tamanho do cartão.
     *
     * Fica embaixo de tudo na pilha (sem z-index) e por cima do fundo: o texto
     * continua selecionável nos lugares em que não há outro alvo, e o voto e o
     * nome do autor sobem com z-index: 1.
     */
    .card__abrir {
      position: absolute;
      inset: 0;
      padding: 0;
      border: none;
      border-radius: var(--radius-lg);
      background: none;
      cursor: pointer;
    }

    .card__abrir:focus-visible {
      outline: 2px solid var(--accent-deep);
      outline-offset: 2px;
    }

    /*
     * A prévia de três linhas (spec 024, decisão 4). O texto inteiro mora no
     * diálogo: sem o corte aqui, "abrir para ler" não significaria nada, porque
     * já estava tudo na lista.
     */
    .card__text {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
      margin: 0.35rem 0 0;
      color: var(--ink-soft);
      line-height: 1.5;
    }

    .card__author {
      margin: 0.5rem 0 0;
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    /* O nome clicável continua parecendo o nome: sublinhado pontilhado, e não um
       link azul — ele abre um cartão, não navega para lugar nenhum. */

    /*
     * O nome do autor e o voto ficam ACIMA do alvo esticado.
     *
     * Sem o z-index, o botão sobreposto cobriria os dois e o cartão passaria a
     * ter um clique só, o de abrir — engolindo justamente o toque mais repetido
     * do app inteiro, que é o voto.
     */
    .card__autor-botao {
      position: relative;
      z-index: 1;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      font: inherit;
      text-decoration: underline dotted;
      text-underline-offset: 0.2em;
      cursor: pointer;
    }

    .card__autor-botao:hover,
    .card__autor-botao:focus-visible {
      color: var(--accent-deep);
    }

    .card__flag {
      margin-left: 0.4rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: var(--accent-deep);
      color: var(--paper);
      font-size: 0.6rem;
      text-transform: uppercase;
    }

    /*
     * O selo de adiantada, no mesmo lugar do "a sua".
     *
     * Ele não é ornamento: sem ele, a pergunta muda de aba sozinha e some da
     * coleta — o que, do lado de quem escreveu, é indistinguível de ter sido
     * removida pela moderação. E é do produto inteiro, não do "meu cartão":
     * uma pergunta que pulou a fila sem explicação é a pior leitura possível de
     * um mural que promete que a comunidade escolhe.
     */
    .card__flag--fast {
      background: transparent;
      border: var(--border-w) solid var(--accent-deep);
      color: var(--accent-deep);
    }

    /*
     * 44px de alvo de verdade, e no lado direito: é o toque mais repetido do app
     * inteiro, e fica onde o polegar já está.
     */
    .vote {
      position: relative;
      z-index: 1;
      display: grid;
      justify-items: center;
      gap: 0.1rem;
      min-width: 2.75rem;
      min-height: 2.75rem;
      margin: 0;
      padding: 0.35rem 0.5rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: var(--paper);
      color: var(--ink-soft);
      font-family: var(--font-body);
      cursor: pointer;
      transition: transform var(--motion-1, 120ms) var(--ease-out, ease);
    }

    .vote--static {
      cursor: default;
    }

    .vote--on {
      border-color: var(--accent-deep);
      background: var(--accent-deep);
      color: var(--paper);
    }

    .vote__mark {
      font-size: 0.7rem;
      line-height: 1;
    }

    .vote__count {
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      line-height: 1;
    }

    /*
     * Um pulso, e só. Esta é a interação mais repetida da tela: animação
     * exagerada em ação repetida cansa em três toques, e loop cansa em três
     * segundos.
     */
    .vote--on .vote__mark {
      animation: vote-pop var(--motion-2, 200ms) var(--ease-out, ease) 1;
    }

    @keyframes vote-pop {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.35) translateY(-2px);
      }
      100% {
        transform: scale(1);
      }
    }

    button.vote:active {
      transform: scale(0.94);
    }

    @media (prefers-reduced-motion: reduce) {
      .vote,
      .vote--on .vote__mark {
        animation: none;
        transition: none;
      }
    }
  `,
})
export class QuestionCard {
  private readonly community = inject(CommunityService);

  readonly question = input.required<MuralQuestion>();
  /** Só a semana em votação aceita voto; nas outras o número é informativo. */
  readonly votable = input<boolean>(false);

  readonly toggle = output<MuralQuestion>();

  /**
   * Pediram para ler a pergunta inteira (spec 024).
   *
   * Quem abre o diálogo é a página, pelo mesmo princípio do `authorClick`: o
   * cartão diz o que aconteceu, e não o que fazer a respeito.
   */
  readonly abrir = output<MuralQuestion>();

  /**
   * Pediram para ver quem escreveu (spec 019).
   *
   * **Ele emite; quem abre o modal é a página do Mural.** Um cartão que
   * injetasse serviço para buscar membro deixaria de ser burro e faria o Mural
   * inteiro precisar de HTTP para ser testado.
   */
  readonly authorClick = output<MuralQuestion>();

  /**
   * O título da insígnia, e não o id.
   *
   * A conversão mora em `core/mural/badge-title` desde a spec 024, porque o
   * diálogo da pergunta precisa do mesmo rótulo — e o fallback (id que não está
   * na trilha volta como ele mesmo) tem que ser o mesmo nos dois lugares.
   */
  protected readonly badgeTitle = computed(() =>
    tituloDaInsignia(this.community.trackStages(), this.question().badgeId),
  );
}

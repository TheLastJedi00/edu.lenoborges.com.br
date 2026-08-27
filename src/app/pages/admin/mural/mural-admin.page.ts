import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { MuralService } from '../../../services/mural.service';
import {
  MuralQuestion,
  MuralWinner,
  PromotionTarget
} from '../../../models/mural.model';

type LoadState = 'loading' | 'ready' | 'error';

/** O que o diálogo está prestes a fazer, e com qual pergunta. */
interface PendingAction {
  readonly question: MuralQuestion;
  readonly kind: 'remover' | PromotionTarget;
}

@Component({
  selector: 'app-admin-mural-page',
  standalone: true,
  imports: [RouterLink, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mural-admin.page.html',
  styleUrl: './mural-admin.page.scss'
})
export class AdminMuralPage implements OnInit {
  private readonly mural = inject(MuralService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly confirmDialog = viewChild.required(ConfirmDialog);

  protected readonly state = signal<LoadState>('loading');
  protected readonly votacao = signal<readonly MuralQuestion[]>([]);
  protected readonly coleta = signal<readonly MuralQuestion[]>([]);
  protected readonly winners = signal<readonly MuralWinner[]>([]);

  private pending: PendingAction | null = null;
  protected readonly pendingTarget = signal<PendingAction | null>(null);
  protected readonly actionError = signal<string | null>(null);

  /**
   * A pauta: **tudo que espera vídeo**, e não só a vencedora mais recente.
   *
   * Com o adiantamento, "o que espera vídeo" deixou de ser uma coisa e virou
   * uma lista: as vencedoras das semanas encerradas mais as adiantadas. Cada
   * linha diz de onde veio, porque as duas pedem vídeos de peso diferente — sem
   * o rótulo, o admin não distingue a escolha da comunidade da própria.
   */
  protected readonly pauta = computed(() =>
    this.winners().filter(
      (linha) => linha.question && !linha.question.answerVideoId
    )
  );

  /**
   * O título do diálogo, que muda com a ação.
   *
   * **Um diálogo só, com a mensagem trocada**, e não três componentes: as três
   * ações confirmam a mesma coisa — que houve intenção — e diferem só no texto.
   */
  protected readonly confirmTitle = computed(() => {
    switch (this.pendingTarget()?.kind) {
      case 'votacao':
        return 'Adiantar para votação?';
      case 'encerrada':
        return 'Responder esta pergunta logo?';
      default:
        return 'Remover esta pergunta?';
    }
  });

  protected readonly confirmLabel = computed(() => {
    switch (this.pendingTarget()?.kind) {
      case 'votacao':
        return 'Adiantar';
      case 'encerrada':
        return 'Pôr na pauta';
      default:
        return 'Remover';
    }
  });

  protected readonly isDanger = computed(
    () => this.pendingTarget()?.kind === 'remover'
  );

  /**
   * A mensagem carrega **o texto da pergunta** e **a consequência**.
   *
   * O texto da pergunta, porque numa lista de trinta cartões "tem certeza?"
   * sozinho não diz qual deles vai mudar. A consequência, porque adiantar não
   * pode ser desfeito, e a tela precisa dizer isso antes: não vai ter como
   * dizer depois.
   *
   * E as duas promoções terminam com a mesma linha, que é a invariante do
   * servidor dita para quem clica: **as outras perguntas seguem o ciclo
   * normal.** Ela não é enfeite. O que o admin mais precisa saber é o que
   * **não** vai acontecer — ninguém mais muda de aba, nenhuma votação abre
   * antes da hora, e a semana continua elegendo a vencedora dela.
   */
  protected readonly confirmMessage = computed(() => {
    const pending = this.pendingTarget();
    if (!pending) {
      return '';
    }

    const titulo = `"${pending.question.title}"`;

    switch (pending.kind) {
      case 'votacao':
        return `${titulo} vai receber votos a partir de agora, e o autor não vai mais poder editar o texto. Isso não pode ser desfeito. As outras perguntas seguem o ciclo normal.`;
      case 'encerrada':
        return `${titulo} sai do Mural agora e entra na pauta. Não vai receber mais votos, e isso não pode ser desfeito. As outras perguntas seguem o ciclo normal.`;
      default:
        return `${titulo} sai do Mural, com os votos dela. Isso não pode ser desfeito.`;
    }
  });

  ngOnInit(): void {
    this.load();
  }

  /**
   * As três listas em paralelo (regra 8 de UI).
   *
   * Encadeadas, eram três idas ao servidor em série para montar uma tela só — e
   * a pauta, que é o conteúdo mais importante e fica **acima** das listas,
   * seria a última a aparecer, por ser a terceira da fila.
   */
  protected load(): void {
    this.state.set('loading');
    this.actionError.set(null);

    forkJoin({
      votacao: this.mural.listQuestions('votacao'),
      coleta: this.mural.listQuestions('coleta'),
      winners: this.mural.listWinners()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ votacao, coleta, winners }) => {
          this.votacao.set(votacao);
          this.coleta.set(coleta);
          this.winners.set(winners);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
  }

  /**
   * Quais adiantamentos ainda cabem nesta pergunta.
   *
   * **O botão que não faz sentido não é renderizado**, e não renderizado
   * desabilitado: desabilitado ainda ocupa o lugar e ainda faz a pessoa
   * perguntar por quê. E um botão que sempre responde 409 é pior que botão
   * nenhum — ele ensina a pessoa a não confiar na tela.
   */
  protected promotionsFor(question: MuralQuestion): readonly PromotionTarget[] {
    switch (question.phase) {
      case 'coleta':
        return ['votacao', 'encerrada'];
      case 'votacao':
        return ['encerrada'];
      default:
        return [];
    }
  }

  protected promotionLabel(fase: PromotionTarget): string {
    return fase === 'votacao' ? 'Adiantar para votação' : 'Responder logo';
  }

  protected askRemove(question: MuralQuestion): void {
    this.ask({ question, kind: 'remover' });
  }

  protected askPromote(question: MuralQuestion, fase: PromotionTarget): void {
    this.ask({ question, kind: fase });
  }

  protected cancel(): void {
    this.pending = null;
    this.pendingTarget.set(null);
  }

  protected confirm(): void {
    const pending = this.pending;
    this.cancel();

    if (!pending) {
      return;
    }

    if (pending.kind === 'remover') {
      this.remove(pending.question);
      return;
    }

    this.promote(pending.question, pending.kind);
  }

  private ask(action: PendingAction): void {
    this.actionError.set(null);
    this.pending = action;
    this.pendingTarget.set(action);
    this.confirmDialog().open();
  }

  private remove(question: MuralQuestion): void {
    this.mural
      .removeQuestion(question.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.votacao.update((list) => without(list, question.id));
          this.coleta.update((list) => without(list, question.id));
        },
        error: () =>
          this.actionError.set('Não consegui remover a pergunta agora.')
      });
  }

  /**
   * Move **exatamente um cartão**, e nenhum outro.
   *
   * Confirmada a ação, o cartão sai da seção em que estava e entra na de
   * destino na hora, sem esperar recarregamento — e a resposta do `PATCH`
   * substitui o item, então não há palpite sobre o que o servidor decidiu.
   *
   * **Recarregar a tela inteira depois do `PATCH` seria o atalho natural, e é
   * exatamente o que não pode acontecer.** Com trinta cartões na tela, "tudo se
   * mexeu" e "o ciclo inteiro andou" são a mesma coisa aos olhos de quem
   * clicou — e o ciclo não andou para ninguém.
   *
   * Se falhar, as listas voltam ao que eram e a mensagem aparece.
   */
  private promote(question: MuralQuestion, fase: PromotionTarget): void {
    const antesVotacao = this.votacao();
    const antesColeta = this.coleta();

    this.aplicar({ ...question, phase: fase, promotedTo: fase });

    this.mural
      .promoteQuestion(question.id, fase)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (atualizada) => this.aplicar(atualizada),
        error: () => {
          this.votacao.set(antesVotacao);
          this.coleta.set(antesColeta);
          this.actionError.set('Não consegui adiantar a pergunta agora.');
        }
      });
  }

  /** Põe a pergunta na seção da fase dela, e tira das outras. */
  private aplicar(question: MuralQuestion): void {
    this.votacao.update((list) =>
      question.phase === 'votacao'
        ? replaceOrAppend(list, question)
        : without(list, question.id)
    );
    this.coleta.update((list) =>
      question.phase === 'coleta'
        ? replaceOrAppend(list, question)
        : without(list, question.id)
    );
  }
}

function without(
  list: readonly MuralQuestion[],
  id: string
): readonly MuralQuestion[] {
  return list.filter((item) => item.id !== id);
}

function replaceOrAppend(
  list: readonly MuralQuestion[],
  question: MuralQuestion
): readonly MuralQuestion[] {
  return list.some((item) => item.id === question.id)
    ? list.map((item) => (item.id === question.id ? question : item))
    : [...list, question];
}

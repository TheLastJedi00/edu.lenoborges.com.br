import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MuralQuestion } from '../../models/mural.model';
import { CommunityService } from '../../services/community.service';
import { tituloDaInsignia } from '../../core/mural/badge-title';
import { dataPorExtenso } from '../../core/datas';

/** A fase por extenso. Sai do dado, e nunca de uma conta de relógio daqui. */
const FASE_TEXTO: Readonly<Record<MuralQuestion['phase'], string>> = {
  coleta: 'recebendo perguntas',
  votacao: 'em votação',
  encerrada: 'encerrada',
};

/**
 * A pergunta do Mural aberta por inteiro (spec 024).
 *
 * **É diálogo, e não rota** (decisão 1). Abrir a pergunta é um desvio de dez
 * segundos no meio de uma lista rolada, e uma rota faria o retorno custar um
 * `history.back()` que devolve a lista no topo, sem a rolagem, sem a aba
 * escolhida e, no painel, sem as três seções que o `forkJoin` acabou de montar.
 *
 * **Componente burro, e o mesmo nas duas telas.** Ele recebe a pergunta e
 * desenha; não busca nada, não vota, não promove e não remove. O que muda entre
 * o mural e o painel são as ações, e elas entram por `<ng-content
 * select="[acoes]">` no rodapé — um input `admin: boolean` faria este
 * componente conhecer as duas telas, e a terceira seria o terceiro `if`.
 *
 * O `open(question)` é **método**, e não input, pela razão escrita no
 * `LegalAcceptDialog`: em zoneless, um host que renderiza o diálogo dentro de um
 * `@if` e chama `open()` numa microtask chama antes de o componente existir. Ele
 * fica sempre renderizado, no fim do template da página.
 *
 * **Nada aqui faz requisição.** A pergunta que o diálogo mostra é a que já está
 * em memória na lista, com o `body` que a API sempre mandou e que as telas
 * descartavam.
 */
@Component({
  selector: 'app-question-detail-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-detail-dialog.html',
  styleUrl: './question-detail-dialog.scss',
})
export class QuestionDetailDialog {
  private readonly community = inject(CommunityService);

  /**
   * Pediram para ver quem escreveu (spec 019).
   *
   * Ele emite; quem abre o cartão do membro é a página, que já tem esse caminho
   * desde a spec 019. Um segundo caminho aqui dentro seria a segunda regra de
   * quando o cartão pode abrir.
   */
  readonly authorClick = output<MuralQuestion>();

  /** Avisa a página que o diálogo fechou, para ela limpar a pergunta aberta. */
  readonly closed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');

  protected readonly question = signal<MuralQuestion | null>(null);

  protected readonly badgeTitle = computed(() => {
    const pergunta = this.question();

    return pergunta ? tituloDaInsignia(this.community.trackStages(), pergunta.badgeId) : '';
  });

  protected readonly faseTexto = computed(() => {
    const pergunta = this.question();

    return pergunta ? FASE_TEXTO[pergunta.phase] : '';
  });

  /**
   * A data de quando a pergunta foi feita, no formato do resto do produto.
   *
   * **É `createdAt`, e não o `weekId`**: aquele é o domingo que abre a semana, e
   * a pergunta pode ter nascido na quinta (spec 017).
   */
  protected readonly dataDaPergunta = computed(() => dataPorExtenso(this.question()?.createdAt));

  /** "1 voto" e "12 votos". O singular custa uma linha e evita um "1 votos". */
  protected readonly votosTexto = computed(() => {
    const votos = this.question()?.voteCount ?? 0;

    return votos === 1 ? '1 voto' : `${votos} votos`;
  });

  open(question: MuralQuestion): void {
    this.question.set(question);
    this.dialogRef().nativeElement.showModal();
    // O corpo recebe o foco na abertura; o `<dialog>` nativo devolve o foco ao
    // elemento que abriu quando fecha, e por isso não há nada a guardar aqui.
    this.bodyRef().nativeElement.focus();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  /**
   * Clique fora fecha.
   *
   * Um clique no `::backdrop` chega com `target` igual ao próprio `<dialog>`,
   * porque o conteúdo mora nos filhos. Sem esta comparação, qualquer clique
   * dentro do cartão fecharia o diálogo por engano.
   */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      this.close();
    }
  }

  protected abrirAutor(question: MuralQuestion): void {
    this.close();
    this.authorClick.emit(question);
  }

  protected onNativeClose(): void {
    this.question.set(null);
    this.closed.emit();
  }
}

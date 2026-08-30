import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { QuestionEditor } from '../../../components/question-editor/question-editor';
import { AiGenerateDialog } from '../../../components/ai-generate-dialog/ai-generate-dialog';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { AdminService } from '../../../services/admin.service';
import {
  ChallengeConfig,
  DIFFICULTY_LABELS,
  GymQuestion,
  MIN_QUESTIONS_PER_DIFFICULTY,
  QuestionCounts,
  QuestionDifficulty,
  QuestionInput
} from '../../../models/games.model';

/**
 * O banco de questões de uma insígnia (spec 022, decisões 9 e 11).
 *
 * **A configuração do desafio é uma seção desta página, e não uma rota
 * separada**: o XP mínimo sem o banco de questões embaixo não tem contexto — o
 * admin precisa ver "faltam 15 difíceis" na mesma tela em que decide se o
 * desafio exige 200 XP.
 *
 * **Nenhum contador é calculado aqui.** `counts` e `ready` vêm da API, e o
 * `ready` olha os três níveis: 90 fáceis e nenhuma difícil somam 90 e não montam
 * uma rodada 3. Recalcular na tela criaria a segunda regra que discorda da
 * primeira.
 */
@Component({
  selector: 'app-admin-insignia-questoes-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    QuestionEditor,
    AiGenerateDialog,
    ConfirmDialog
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './insignia-questoes.page.html',
  styleUrl: './insignia-questoes.page.scss'
})
export class AdminInsigniaQuestoesPage {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);

  protected readonly minimo = MIN_QUESTIONS_PER_DIFFICULTY;
  protected readonly labels = DIFFICULTY_LABELS;
  protected readonly niveis: QuestionDifficulty[] = ['easy', 'medium', 'hard'];

  protected readonly badgeId = this.route.snapshot.paramMap.get('badgeId') ?? '';

  protected readonly questions = signal<readonly GymQuestion[]>([]);
  protected readonly counts = signal<QuestionCounts | null>(null);
  protected readonly config = signal<ChallengeConfig | null>(null);
  protected readonly filtro = signal<QuestionDifficulty>('easy');

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** Qual questão está em edição inline, por id. `null` = nenhuma. */
  protected readonly editando = signal<string | null>(null);
  protected readonly criando = signal(false);
  protected readonly salvando = signal(false);

  /** Qual questão está esperando confirmação de exclusão. */
  protected readonly excluindo = signal<GymQuestion | null>(null);

  protected readonly gerando = signal(false);

  private readonly dialogoExclusao = viewChild<ConfirmDialog>('dialogoExclusao');

  protected readonly requiredXp = new FormControl(0, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(0)]
  });

  /** A barra do topo: quantas das 90 já existem. */
  protected readonly progresso = computed(() => {
    const counts = this.counts();
    if (!counts) {
      return 0;
    }

    const alvo = MIN_QUESTIONS_PER_DIFFICULTY * 3;

    return Math.min(100, Math.round((counts.total / alvo) * 100));
  });

  protected readonly totalAlvo = MIN_QUESTIONS_PER_DIFFICULTY * 3;

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);

    // As duas leituras são independentes e vão juntas: serializá-las custaria
    // uma viagem a mais em toda abertura da tela (regra 8 do repositório).
    Promise.all([
      this.admin.listQuestions(this.badgeId, this.filtro()).toPromise(),
      this.admin.getChallengeConfig(this.badgeId).toPromise()
    ])
      .then(([list, config]) => {
        if (list) {
          this.questions.set(list.questions);
          this.counts.set(list.counts);
        }
        if (config) {
          this.config.set(config);
          this.requiredXp.setValue(config.requiredXp);
        }
        this.loading.set(false);
      })
      .catch((failure: unknown) => {
        this.erro.set(this.mensagemDe(failure));
        this.loading.set(false);
      });
  }

  protected trocarFiltro(difficulty: QuestionDifficulty): void {
    this.filtro.set(difficulty);
    this.editando.set(null);
    this.criando.set(false);
    this.recarregarLista();
  }

  private recarregarLista(): void {
    this.admin.listQuestions(this.badgeId, this.filtro()).subscribe({
      next: (list) => {
        this.questions.set(list.questions);
        this.counts.set(list.counts);
      },
      error: (failure: unknown) => this.erro.set(this.mensagemDe(failure))
    });
  }

  protected criar(body: QuestionInput): void {
    this.salvando.set(true);
    this.erro.set(null);

    this.admin.createQuestion(this.badgeId, body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.criando.set(false);
        this.recarregarLista();
      },
      error: (failure: unknown) => {
        this.salvando.set(false);
        this.erro.set(this.mensagemDe(failure));
      }
    });
  }

  protected salvarEdicao(id: string, body: QuestionInput): void {
    this.salvando.set(true);
    this.erro.set(null);

    this.admin.updateQuestion(this.badgeId, id, body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.editando.set(null);
        this.recarregarLista();
      },
      error: (failure: unknown) => {
        this.salvando.set(false);
        this.erro.set(this.mensagemDe(failure));
      }
    });
  }

  /** Guarda o alvo e abre o diálogo. Dois passos, um clique. */
  protected pedirExclusao(question: GymQuestion): void {
    this.excluindo.set(question);
    this.dialogoExclusao()?.open();
  }

  protected excluirConfirmado(): void {
    const alvo = this.excluindo();
    if (!alvo) {
      return;
    }

    this.admin.deleteQuestion(this.badgeId, alvo.id).subscribe({
      next: () => {
        this.excluindo.set(null);
        this.recarregarLista();
      },
      error: (failure: unknown) => {
        this.excluindo.set(null);
        this.erro.set(this.mensagemDe(failure));
      }
    });
  }

  protected salvarConfig(): void {
    if (this.requiredXp.invalid) {
      return;
    }

    this.erro.set(null);
    this.aviso.set(null);

    this.admin
      .setChallengeConfig(this.badgeId, this.requiredXp.value)
      .subscribe({
        next: (config) => {
          this.config.set(config);
          this.counts.set(config.counts);
          this.aviso.set('Configuração salva.');
        },
        error: (failure: unknown) => this.erro.set(this.mensagemDe(failure))
      });
  }

  /** O rascunho aprovado chega do modal e vai inteiro para o `bulk`. */
  protected salvarLote(questions: readonly QuestionInput[]): void {
    this.gerando.set(false);
    this.erro.set(null);

    this.admin.bulkCreateQuestions(this.badgeId, questions).subscribe({
      next: (result) => {
        this.aviso.set(
          `${result.questions.length} ${result.questions.length === 1 ? 'questão gravada' : 'questões gravadas'}.`
        );
        this.recarregarLista();
      },
      error: (failure: unknown) => this.erro.set(this.mensagemDe(failure))
    });
  }

  /** O texto do enunciado, cortado em duas linhas pelo CSS. */
  protected contagemDe(difficulty: QuestionDifficulty): number {
    return this.counts()?.[difficulty] ?? 0;
  }

  protected completo(difficulty: QuestionDifficulty): boolean {
    return this.contagemDe(difficulty) >= MIN_QUESTIONS_PER_DIFFICULTY;
  }

  protected paraInput(question: GymQuestion): QuestionInput {
    return {
      difficulty: question.difficulty,
      question: question.question,
      alternatives: question.alternatives,
      correctIndex: question.correctIndex
    };
  }

  private mensagemDe(failure: unknown): string {
    if (failure instanceof HttpErrorResponse) {
      const body = failure.error as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message)
        ? body?.message[0]
        : body?.message;

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return 'Algo deu errado agora. Tente de novo.';
  }
}

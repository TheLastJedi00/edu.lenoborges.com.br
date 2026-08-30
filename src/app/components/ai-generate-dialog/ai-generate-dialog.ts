import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { QuestionEditor } from '../question-editor/question-editor';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { AdminService } from '../../services/admin.service';
import {
  DIFFICULTY_LABELS,
  QuestionDifficulty,
  QuestionInput
} from '../../models/games.model';

/** Uma questão do rascunho, com a marca de seleção do admin. */
interface Draft {
  readonly key: number;
  value: QuestionInput;
  selected: boolean;
}

/**
 * A geração de questões por IA, em dois passos (spec 022, decisão 10).
 *
 * **Passo 1 gera, passo 2 revisa, e só o passo 2 grava.** O rascunho não é
 * salvo em lugar nenhum: fechar o modal perde o que não foi salvo, e o modal
 * avisa disso com o `ConfirmDialog` que já existe.
 *
 * **O aviso é o `ConfirmDialog`, e não o `unsavedChangesGuard`.** Aquele é um
 * guard de rota, e aqui não há troca de rota — o modal fecha por cima da mesma
 * página. Usá-lo exigiria transformar o modal numa rota, o que é muito preço por
 * uma confirmação.
 */
@Component({
  selector: 'app-ai-generate-dialog',
  imports: [ReactiveFormsModule, QuestionEditor, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-generate-dialog.html',
  styleUrl: './ai-generate-dialog.scss'
})
export class AiGenerateDialog implements AfterViewInit {
  private readonly admin = inject(AdminService);

  readonly badgeId = input.required<string>();

  /** As questões aprovadas. Quem grava é a página. */
  readonly saved = output<readonly QuestionInput[]>();
  readonly closed = output<void>();

  protected readonly difficulties = Object.entries(DIFFICULTY_LABELS) as [
    QuestionDifficulty,
    string
  ][];

  protected readonly passo = signal<'gerar' | 'revisar'>('gerar');
  protected readonly gerando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly descartadas = signal(0);
  protected readonly rascunho = signal<Draft[]>([]);

  protected readonly form = new FormGroup({
    prompt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)]
    }),
    difficulty: new FormControl<QuestionDifficulty>('easy', {
      nonNullable: true
    }),
    count: new FormControl(10, { nonNullable: true })
  });

  protected readonly selecionadas = computed(
    () => this.rascunho().filter((item) => item.selected).length
  );

  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  private readonly confirmRef = viewChild<ConfirmDialog>('confirmar');

  ngAfterViewInit(): void {
    this.dialogRef().nativeElement.showModal();
  }

  protected gerar(): void {
    if (this.form.invalid || this.gerando()) {
      return;
    }

    this.gerando.set(true);
    this.erro.set(null);

    this.admin
      .generateQuestions(this.badgeId(), this.form.getRawValue())
      .subscribe({
        next: (result) => {
          this.gerando.set(false);
          this.descartadas.set(result.discarded);
          this.rascunho.set(
            result.questions.map((value, key) => ({
              key,
              value,
              // Nascem marcadas: o admin revisa e **desmarca** o que não presta,
              // que é o caminho mais curto quando a maioria está boa.
              selected: true
            }))
          );
          this.passo.set('revisar');
        },
        error: (failure: unknown) => {
          this.gerando.set(false);
          this.erro.set(this.mensagemDe(failure));
        }
      });
  }

  protected alternarSelecao(key: number): void {
    this.rascunho.update((items) =>
      items.map((item) =>
        item.key === key ? { ...item, selected: !item.selected } : item
      )
    );
  }

  protected remover(key: number): void {
    this.rascunho.update((items) => items.filter((item) => item.key !== key));
  }

  protected atualizar(key: number, value: QuestionInput): void {
    this.rascunho.update((items) =>
      items.map((item) => (item.key === key ? { ...item, value } : item))
    );
  }

  protected salvar(): void {
    const escolhidas = this.rascunho()
      .filter((item) => item.selected)
      .map((item) => item.value);

    if (escolhidas.length === 0) {
      return;
    }

    this.saved.emit(escolhidas);
    this.fecharDeVerdade();
  }

  /**
   * Tentar fechar: pergunta antes se há rascunho não salvo.
   *
   * O rascunho não mora em lugar nenhum — nem no servidor, nem no navegador — e
   * fechar sem avisar jogaria fora trinta questões revisadas à mão.
   */
  protected tentarFechar(): void {
    if (this.rascunho().length === 0) {
      this.fecharDeVerdade();

      return;
    }

    this.confirmRef()?.open();
  }

  protected fecharDeVerdade(): void {
    this.dialogRef().nativeElement.close();
    this.closed.emit();
  }

  private mensagemDe(failure: unknown): string {
    if (failure instanceof HttpErrorResponse) {
      if (failure.status === 503) {
        return 'A geração por IA não está disponível agora. Tente de novo em instantes, ou cadastre as questões à mão.';
      }

      const body = failure.error as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message)
        ? body?.message[0]
        : body?.message;

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return 'Não consegui gerar as questões agora.';
  }
}

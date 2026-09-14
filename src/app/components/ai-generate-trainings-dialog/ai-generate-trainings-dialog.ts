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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { AdminService } from '../../services/admin.service';
import { DIFFICULTY_LABELS, QuestionDifficulty } from '../../models/games.model';
import { TrainingInput } from '../../models/training.model';

/** Um treinamento do rascunho, com a marca de seleção do admin. */
interface Draft {
  readonly key: number;
  value: TrainingInput;
  selected: boolean;
}

/**
 * A geração de treinamentos por IA, em dois passos (spec 025, decisão 1).
 *
 * **Passo 1 gera, passo 2 revisa, e só o passo 2 grava.** O rascunho não é
 * salvo em lugar nenhum: fechar o modal perde o que não foi salvo, e o modal
 * avisa disso com o `ConfirmDialog` que já existe.
 *
 * **É um componente novo, e não o `AiGenerateDialog` da spec 022
 * parametrizado.** Aquele importa o `QuestionEditor` e fala de alternativas e
 * `correctIndex`; generalizá-lo para dois formatos de rascunho custaria mais do
 * que a duplicação do casco, e cada mudança num dos dois formatos passaria a
 * exigir cuidado com o outro.
 *
 * **Ele não grava nada.** Emite os aprovados em `saved` e quem grava é a
 * página, uma chamada por rascunho — não existe rota de `bulk` para
 * treinamentos.
 */
@Component({
  selector: 'app-ai-generate-trainings-dialog',
  imports: [ReactiveFormsModule, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-generate-trainings-dialog.html',
  styleUrl: './ai-generate-trainings-dialog.scss'
})
export class AiGenerateTrainingsDialog implements AfterViewInit {
  private readonly admin = inject(AdminService);

  readonly badgeId = input.required<string>();

  /** Os treinamentos aprovados. Quem grava é a página. */
  readonly saved = output<readonly TrainingInput[]>();
  readonly closed = output<void>();

  protected readonly difficulties = Object.entries(DIFFICULTY_LABELS) as [
    QuestionDifficulty,
    string
  ][];

  protected readonly passo = signal<'gerar' | 'revisar'>('gerar');
  protected readonly gerando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly descartados = signal(0);
  protected readonly rascunho = signal<Draft[]>([]);

  protected readonly form = new FormGroup({
    prompt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)]
    }),
    difficulty: new FormControl<QuestionDifficulty>('easy', {
      nonNullable: true
    }),
    count: new FormControl(3, { nonNullable: true })
  });

  protected readonly selecionados = computed(
    () => this.rascunho().filter((item) => item.selected).length
  );

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

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

    const { prompt, difficulty, count } = this.form.getRawValue();

    this.admin
      .generateTrainings(this.badgeId(), {
        prompt,
        difficulty,
        // O `select` devolve texto mesmo com `[value]` numérico, e um `"3"` no
        // corpo é 400 no `@IsInt` do backend.
        count: Number(count)
      })
      .subscribe({
        next: (result) => {
          this.gerando.set(false);
          this.descartados.set(result.discarded);
          this.rascunho.set(
            result.trainings.map((value, key) => ({
              key,
              value,
              // Nascem marcados: o admin revisa e **desmarca** o que não presta,
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
      items.map((item) => (item.key === key ? { ...item, selected: !item.selected } : item))
    );
  }

  protected remover(key: number): void {
    this.rascunho.update((items) => items.filter((item) => item.key !== key));
  }

  protected editarTexto(key: number, campo: 'title' | 'description' | 'objective', texto: string): void {
    this.rascunho.update((items) =>
      items.map((item) => (item.key === key ? { ...item, value: { ...item.value, [campo]: texto } } : item))
    );
  }

  protected editarDica(key: number, indice: number, texto: string): void {
    this.rascunho.update((items) =>
      items.map((item) =>
        item.key === key
          ? {
              ...item,
              value: {
                ...item.value,
                hints: item.value.hints.map((dica, i) => (i === indice ? texto : dica))
              }
            }
          : item
      )
    );
  }

  /**
   * Remove uma dica do rascunho, **exceto a última**.
   *
   * O backend exige pelo menos uma (spec 025, decisão 1), e deixar o rascunho
   * chegar a zero seria oferecer um botão de salvar que devolve 400 no fim da
   * revisão. Quem não quer nenhuma dica exclui o treinamento inteiro.
   */
  protected removerDica(key: number, indice: number): void {
    this.rascunho.update((items) =>
      items.map((item) =>
        item.key === key && item.value.hints.length > 1
          ? {
              ...item,
              value: {
                ...item.value,
                hints: item.value.hints.filter((_, i) => i !== indice)
              }
            }
          : item
      )
    );
  }

  protected salvar(): void {
    const escolhidos = this.rascunho()
      .filter((item) => item.selected)
      .map((item) => item.value);

    if (escolhidos.length === 0) {
      return;
    }

    this.saved.emit(escolhidos);
    this.fecharDeVerdade();
  }

  /**
   * Tentar fechar: pergunta antes se há rascunho não salvo.
   *
   * O rascunho não mora em lugar nenhum — nem no servidor, nem no navegador — e
   * fechar sem avisar jogaria fora dez desafios revisados à mão.
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
        return 'A geração por IA não está disponível agora. Tente de novo em instantes, ou cadastre os treinamentos à mão.';
      }

      const body = failure.error as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message) ? body?.message[0] : body?.message;

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return 'Não consegui gerar os treinamentos agora.';
  }
}

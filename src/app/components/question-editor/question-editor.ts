import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  DIFFICULTY_LABELS,
  QuestionDifficulty,
  QuestionInput
} from '../../models/games.model';

/**
 * O formulário de uma questão (spec 022, decisões 9 e 10).
 *
 * **Um componente, três usos**: "Adicionar Questão", a edição inline da lista, e
 * cada item do passo 2 do modal de IA. Três cópias divergiriam na primeira
 * validação nova — e a validação aqui não é decorativa: uma questão com três
 * alternativas faz a tela do membro desenhar um botão vazio, e um `correctIndex`
 * fora de faixa é uma questão que ninguém consegue acertar.
 *
 * **O `correctIndex` é um radio, e nunca um campo de texto.** Ele é uma posição,
 * e digitá-la seria convidar o "2" que aponta para a terceira alternativa.
 */
@Component({
  selector: 'app-question-editor',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-editor.html',
  styleUrl: './question-editor.scss'
})
export class QuestionEditor {
  /** O valor inicial. Trocá-lo recarrega o formulário. */
  readonly value = input<QuestionInput | null>(null);

  /** Fixa o nível: no modal de IA ele já foi escolhido no passo 1. */
  readonly lockedDifficulty = input<QuestionDifficulty | null>(null);

  readonly pending = input(false);

  /** Emitido a cada mudança válida: quem consome decide quando gravar. */
  readonly changed = output<QuestionInput>();

  /** Emitido no submit. O modal de IA não usa; a lista e o "Adicionar" usam. */
  readonly submitted = output<QuestionInput>();

  readonly cancelled = output<void>();

  protected readonly difficulties = Object.entries(DIFFICULTY_LABELS) as [
    QuestionDifficulty,
    string
  ][];

  protected readonly form = new FormGroup({
    difficulty: new FormControl<QuestionDifficulty>('easy', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    question: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)]
    }),
    alternatives: new FormArray(
      // Quatro controles fixos, criados uma vez: o formulário nunca ganha nem
      // perde alternativa, porque o produto tem exatamente quatro.
      [0, 1, 2, 3].map(
        () =>
          new FormControl('', {
            nonNullable: true,
            validators: [Validators.required]
          })
      )
    ),
    correctIndex: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  protected readonly alternatives = computed(() =>
    this.form.controls.alternatives.controls.map((_, index) => index)
  );

  constructor() {
    effect(() => {
      const value = this.value();
      const locked = this.lockedDifficulty();

      this.form.reset({
        difficulty: locked ?? value?.difficulty ?? 'easy',
        question: value?.question ?? '',
        correctIndex: value?.correctIndex ?? 0
      });

      this.form.controls.alternatives.controls.forEach((control, index) => {
        control.setValue(value?.alternatives[index] ?? '');
      });

      if (locked) {
        this.form.controls.difficulty.disable();
      } else {
        this.form.controls.difficulty.enable();
      }
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.changed.emit(this.snapshot());
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      return;
    }

    this.submitted.emit(this.snapshot());
  }

  /**
   * O valor atual como `QuestionInput`.
   *
   * `getRawValue` e não `value`: o `difficulty` fica **desabilitado** quando o
   * nível é fixo, e um controle desabilitado some do `value` — o corpo iria sem
   * dificuldade e o servidor responderia 400.
   */
  private snapshot(): QuestionInput {
    const raw = this.form.getRawValue();

    return {
      difficulty: this.lockedDifficulty() ?? raw.difficulty,
      question: raw.question.trim(),
      alternatives: raw.alternatives.map((item) => item.trim()),
      correctIndex: Number(raw.correctIndex)
    };
  }
}

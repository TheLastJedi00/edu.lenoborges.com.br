import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateTrainingRequest,
  Training,
  UpdateTrainingRequest,
} from '../../models/training.model';
import { DEFAULT_TRAINING_XP } from '../../models/training.constants';

/**
 * Formulário de criação e edição de um desafio da Arena (spec 023, decisão 4).
 *
 * **Componente burro**: valida, monta o corpo e emite. Quem chama a API é a
 * página, no molde do `video-form`.
 *
 * **As dicas são um `FormArray` e não um textarea com quebras de linha.** A
 * diferença aparece na segunda edição: com um array, mover a dica três para
 * cima é reordenar dois controles; com um texto, é recortar e colar linha por
 * linha, e uma dica que contenha uma quebra vira duas sem ninguém perceber.
 *
 * **Pelo menos uma dica, sempre.** A Arena existe para ensinar raciocínio, e um
 * desafio que não oferece nenhuma saída quando o membro trava só paga quem já
 * sabia — e o backend recusa com 400 (spec 025), então oferecer o botão de
 * salvar seria oferecer um erro.
 */
@Component({
  selector: 'app-training-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './training-form.html',
  styleUrl: './training-form.scss',
})
export class TrainingForm {
  private readonly fb = inject(FormBuilder);

  /** O desafio a editar, ou nulo para criar um novo. */
  readonly training = input<Training | null>(null);
  readonly saving = input(false);

  readonly submitted = output<CreateTrainingRequest | UpdateTrainingRequest>();
  readonly cancel = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(600)]],
    objective: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
    videoUrl: [''],
    xpAmount: [DEFAULT_TRAINING_XP, [Validators.required, Validators.min(1)]],
    hints: this.fb.nonNullable.array([this.novaDica()]),
  });

  constructor() {
    // Editar preenche o formulário. É `effect` e não `ngOnChanges` porque o
    // input é signal, e um `set` no meio da renderização precisa de
    // `allowSignalWrites` — que é exatamente o que este `effect` declara.
    effect(() => {
      const atual = this.training();

      if (atual) {
        this.preencher(atual);
      }
    });
  }

  protected get dicas(): FormArray {
    return this.form.controls.hints;
  }

  protected adicionarDica(): void {
    this.dicas.push(this.novaDica());
  }

  /**
   * Remove uma dica, **exceto a última**.
   *
   * Ficar sem nenhuma deixaria o formulário num estado que o backend recusa, e
   * o botão de salvar travado sem dizer por quê. Com uma dica na tela, a saída
   * é apagar o texto dela.
   */
  protected removerDica(indice: number): void {
    if (this.dicas.length <= 1) {
      return;
    }

    this.dicas.removeAt(indice);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      // Marca tudo como tocado para as mensagens aparecerem: um botão que não
      // faz nada e não explica é o pior estado possível de um formulário.
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, objective, videoUrl, xpAmount } = this.form.getRawValue();
    const hints = this.dicas.controls
      .map((controle) => String(controle.value ?? '').trim())
      .filter((dica) => dica.length > 0);

    this.submitted.emit({
      title: title.trim(),
      description: description.trim(),
      objective: objective.trim(),
      hints,
      // Campo vazio **não vai no corpo**: o backend valida `videoUrl` como URL,
      // e uma string vazia viraria 400 num campo que é opcional.
      ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
      xpAmount,
    });
  }

  reset(): void {
    this.form.reset({
      title: '',
      description: '',
      objective: '',
      videoUrl: '',
      xpAmount: DEFAULT_TRAINING_XP,
    });
    this.dicas.clear();
    this.dicas.push(this.novaDica());
  }

  private preencher(training: Training): void {
    this.form.patchValue({
      title: training.title,
      description: training.description,
      objective: training.objective,
      videoUrl: training.videoUrl ?? '',
      xpAmount: training.xpAmount,
    });

    this.dicas.clear();
    for (const dica of training.hints.length ? training.hints : ['']) {
      this.dicas.push(this.novaDica(dica));
    }
  }

  private novaDica(valor = '') {
    return this.fb.nonNullable.control(valor, [Validators.required, Validators.maxLength(500)]);
  }
}

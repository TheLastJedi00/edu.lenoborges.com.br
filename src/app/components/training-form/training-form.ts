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
 * **Os passos são um `FormArray` e não um textarea com quebras de linha.** A
 * diferença aparece na segunda edição: com um array, mover o passo três para
 * cima é reordenar dois controles; com um texto, é recortar e colar linha por
 * linha, e um passo que contenha uma quebra vira dois sem ninguém perceber.
 *
 * **Pelo menos um passo, sempre.** Um desafio sem passo é um card que abre num
 * modal vazio — e o backend recusa com 400, então oferecer o botão de salvar
 * seria oferecer um erro.
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
    videoUrl: [''],
    xpAmount: [DEFAULT_TRAINING_XP, [Validators.required, Validators.min(1)]],
    steps: this.fb.nonNullable.array([this.novoPasso()]),
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

  protected get passos(): FormArray {
    return this.form.controls.steps;
  }

  protected adicionarPasso(): void {
    this.passos.push(this.novoPasso());
  }

  /**
   * Remove um passo, **exceto o último**.
   *
   * Ficar sem nenhum deixaria o formulário num estado que o backend recusa, e o
   * botão de salvar travado sem dizer por quê. Com um passo na tela, a saída é
   * apagar o texto dele.
   */
  protected removerPasso(indice: number): void {
    if (this.passos.length <= 1) {
      return;
    }

    this.passos.removeAt(indice);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      // Marca tudo como tocado para as mensagens aparecerem: um botão que não
      // faz nada e não explica é o pior estado possível de um formulário.
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, videoUrl, xpAmount } = this.form.getRawValue();
    const steps = this.passos.controls
      .map((controle) => String(controle.value ?? '').trim())
      .filter((passo) => passo.length > 0);

    this.submitted.emit({
      title: title.trim(),
      description: description.trim(),
      steps,
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
      videoUrl: '',
      xpAmount: DEFAULT_TRAINING_XP,
    });
    this.passos.clear();
    this.passos.push(this.novoPasso());
  }

  private preencher(training: Training): void {
    this.form.patchValue({
      title: training.title,
      description: training.description,
      videoUrl: training.videoUrl ?? '',
      xpAmount: training.xpAmount,
    });

    this.passos.clear();
    for (const passo of training.steps.length ? training.steps : ['']) {
      this.passos.push(this.novoPasso(passo));
    }
  }

  private novoPasso(valor = '') {
    return this.fb.nonNullable.control(valor, [Validators.required, Validators.maxLength(500)]);
  }
}

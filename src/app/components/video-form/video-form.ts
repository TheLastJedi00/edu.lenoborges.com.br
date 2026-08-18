import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CreateVideoRequest } from '../../models/admin.model';

/**
 * Formulário de publicação de vídeo numa insígnia.
 *
 * **O título é obrigatório e não é preenchido a partir do YouTube.** O de lá é
 * escrito para o algoritmo — "AULA 3 COMPLETA", emoji, nome do canal — e o daqui
 * diz onde a pessoa está na trilha. Um preenchimento automático faria todo mundo
 * aceitar o do algoritmo, que é exatamente o que a decisão 6 da spec 009 do
 * backend evita.
 */
@Component({
  selector: 'app-video-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <label class="form__label" for="video-title">Título na plataforma</label>
      <input
        id="video-title"
        class="form__input"
        type="text"
        formControlName="title"
        placeholder="Herança e composição, na prática"
        autocomplete="off"
        enterkeyhint="next"
      />
      <p class="form__hint">
        Este é o título que o aluno vê. Não precisa ser o do YouTube.
      </p>

      <label class="form__label" for="video-url">Link do YouTube</label>
      <input
        id="video-url"
        class="form__input"
        type="url"
        formControlName="youtubeUrl"
        placeholder="https://youtu.be/…"
        autocomplete="off"
        inputmode="url"
        enterkeyhint="done"
      />

      <label class="form__label" for="video-description">Descrição (opcional)</label>
      <input
        id="video-description"
        class="form__input"
        type="text"
        formControlName="description"
        placeholder="Uma linha sobre o que o vídeo resolve"
        autocomplete="off"
      />

      @if (error(); as mensagem) {
        <p class="form__error" role="alert">{{ mensagem }}</p>
      }

      <div class="form__actions">
        <button type="button" class="btn btn--ghost" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Publicando…' : 'Publicar' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .form {
      display: grid;
      gap: 0.35rem;
    }

    .form__label {
      margin-top: 0.5rem;
      font-size: var(--step--1);
      font-weight: 700;
      color: var(--ink-soft);
    }

    .form__input {
      min-height: 2.75rem;
      padding: 0.6rem 0.75rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-sm);
      background: var(--paper);
      font-family: var(--font-body);
      font-size: var(--step-0);
      color: var(--ink);
    }

    .form__input:focus-visible {
      outline: 2px solid var(--accent-deep);
      outline-offset: 1px;
    }

    .form__hint {
      margin: 0;
      color: var(--ink-soft);
      font-size: var(--step--1);
    }

    .form__error {
      margin: 0.4rem 0 0;
      color: #c0392b;
    }

    .form__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 0.75rem;
    }

    .btn {
      min-height: 2.75rem;
      padding: 0.6rem 1.1rem;
      border: var(--border-w) solid var(--ink);
      border-radius: var(--radius-sm);
      background: var(--ink);
      color: var(--paper);
      font-family: var(--font-body);
      font-weight: 700;
      cursor: pointer;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--ghost {
      background: transparent;
      color: var(--ink);
    }
  `
})
export class VideoForm {
  private readonly fb = inject(FormBuilder);

  readonly saving = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<CreateVideoRequest>();
  readonly cancel = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    youtubeUrl: ['', [Validators.required]],
    description: ['']
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { title, youtubeUrl, description } = this.form.getRawValue();

    // A URL vai como o admin colou. Extrair o ID aqui criaria uma segunda
    // implementação da mesma regra — e ela chega em cinco formas.
    this.submitted.emit({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      ...(description.trim() ? { description: description.trim() } : {})
    });
  }

  reset(): void {
    this.form.reset({ title: '', youtubeUrl: '', description: '' });
  }
}

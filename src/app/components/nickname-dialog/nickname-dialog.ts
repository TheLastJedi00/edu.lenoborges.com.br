import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

/** O mesmo formato que o servidor valida. Duplicado para o erro sair na hora. */
export const NICKNAME_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;

/**
 * O validador do formato, **sobre o valor aparado**.
 *
 * `Validators.pattern` roda sobre o texto cru, e o padrão não aceita espaço —
 * então um espaço no fim, que o teclado do celular põe sozinho ao completar uma
 * palavra, travaria o botão com a mensagem "use letras, números, hífen e
 * underscore" na frente de um nome que só tem isso. O membro leria uma regra que
 * está seguindo e não teria o que corrigir.
 *
 * O que é enviado também é o valor aparado, então validar e enviar concordam.
 */
function nicknameFormat(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();

  return NICKNAME_PATTERN.test(value) ? null : { nicknameFormat: true };
}

/**
 * O modal da gamertag (spec 022, decisão 16).
 *
 * **Bloqueante, no mesmo molde do `LegalBlockDialog`**: não fecha no Esc, não
 * tem botão de fechar e não fecha no backdrop. A diferença é o que ele bloqueia
 * — ali é o painel inteiro, aqui é só a rota de Jogos, e sair dele é voltar para
 * onde se estava.
 *
 * **Não reusa o `ConfirmDialog`** pela mesma razão escrita lá: aquele existe
 * para ser cancelável, e a coisa mais fácil do mundo é alguém "melhorar" a
 * experiência devolvendo o botão de fechar.
 *
 * Componente burro: recebe `pending` e `error`, emite `submitted` e `dismissed`.
 * Quem fala com a API é o guard.
 */
@Component({
  selector: 'app-nickname-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="gamertag animate-enter"
      aria-labelledby="titulo-gamertag"
      (cancel)="$event.preventDefault()"
    >
      <h2 class="gamertag__title" id="titulo-gamertag">
        Você precisa de um Gamertag para entrar na Liga
      </h2>

      <p class="gamertag__lead">
        Ele será seu nome público no Ranking e nos Jogos. Escolha bem:
        <strong>ele é único e não poderá ser alterado depois.</strong>
      </p>

      <form class="gamertag__form" [formGroup]="form" (ngSubmit)="submit()">
        <label class="gamertag__label" for="nickname">Seu gamertag</label>
        <input
          id="nickname"
          class="gamertag__input"
          formControlName="nickname"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          maxlength="20"
          [attr.aria-invalid]="mostrarErroDeFormato() || error() ? 'true' : null"
          [attr.aria-describedby]="'ajuda-gamertag'"
        />

        <p class="gamertag__help" id="ajuda-gamertag">
          De 3 a 20 caracteres. Letras, números, hífen e underscore — sem espaços e sem
          acentos.
        </p>

        @if (mostrarErroDeFormato()) {
          <p class="gamertag__error" role="alert">
            Use de 3 a 20 caracteres, entre letras, números, hífen e underscore.
          </p>
        }

        <!--
          O erro do servidor tem prioridade e vem do corpo, nunca do status: o
          409 tem dois motivos, e "esse nome já é de alguém" é o único que a
          pessoa nesta tela pode resolver.
        -->
        @if (error()) {
          <p class="gamertag__error" role="alert">{{ error() }}</p>
        }

        <div class="gamertag__actions">
          <button
            type="button"
            class="gamertag__ghost"
            [disabled]="pending()"
            (click)="dismissed.emit()"
          >
            Agora não
          </button>
          <button
            type="submit"
            class="gamertag__submit"
            [disabled]="form.invalid || pending()"
          >
            {{ pending() ? 'Salvando…' : 'Confirmar gamertag' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
  styleUrl: './nickname-dialog.scss'
})
export class NicknameDialog implements AfterViewInit {
  /** Enquanto o `PUT` não volta: trava os dois botões e o texto do submit. */
  readonly pending = input(false);

  /** A mensagem do servidor, já do corpo da resposta. `null` quando não há. */
  readonly error = input<string | null>(null);

  readonly submitted = output<string>();

  /**
   * "Agora não": o membro desiste de entrar em Jogos.
   *
   * **Existe, e não contradiz o bloqueio.** O modal não pode ser fechado por
   * acidente — Esc e backdrop não fecham —, mas prender alguém numa tela sem
   * saída seria pior do que a tela não existir. Quem sai volta para onde estava,
   * e o guard não deixa entrar em Jogos.
   */
  readonly dismissed = output<void>();

  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly form = new FormGroup({
    nickname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nicknameFormat]
    })
  });

  ngAfterViewInit(): void {
    this.dialogRef().nativeElement.showModal();
    // O foco vai para o campo, e não para o primeiro botão: a única coisa a
    // fazer aqui é digitar.
    this.dialogRef().nativeElement.querySelector('input')?.focus();
  }

  /** Erro de formato só depois de a pessoa ter mexido no campo. */
  protected mostrarErroDeFormato(): boolean {
    const control = this.form.controls.nickname;

    return control.invalid && (control.dirty || control.touched);
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      return;
    }

    this.submitted.emit(this.form.controls.nickname.value.trim());
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MuralService } from '../../../services/mural.service';
import { CommunityService } from '../../../services/community.service';
import { MuralState } from '../../../models/mural.model';

@Component({
  selector: 'app-nova-pergunta-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nova-pergunta.page.html',
  styleUrl: './nova-pergunta.page.scss'
})
export class NovaPerguntaPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mural = inject(MuralService);
  private readonly community = inject(CommunityService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<MuralState | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly stages = computed(() => this.community.trackStages());

  /**
   * Vem pronto da API.
   *
   * **O front não recalcula a regra a partir do `tier`**: ela tem duas partes —
   * ser pagante e ainda não ter perguntado — e duas implementações divergiriam
   * na primeira exceção. Ver a decisão 3 da spec 010.
   */
  protected readonly canAsk = computed(() => this.state()?.canAsk ?? false);

  /** Já perguntou esta semana: o formulário vira edição da própria pergunta. */
  protected readonly editing = computed(
    () => this.state()?.myQuestionId ?? null
  );

  /** A pergunta que está sendo editada, inteira, para preencher o formulário. */
  protected readonly myQuestion = computed(() => this.state()?.myQuestion ?? null);

  /**
   * O formulário fechou porque a pergunta saiu da coleta (spec 016).
   *
   * Acontece por dois caminhos — a semana virou enquanto a pessoa escrevia, ou
   * o admin adiantou a pergunta — e **a tela não os distingue de propósito**: o
   * servidor manda uma mensagem só, porque o resultado é o mesmo e a causa não
   * muda nada para quem está lendo.
   */
  protected readonly locked = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    badgeId: ['', Validators.required],
    title: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(140)]
    ],
    body: ['', Validators.maxLength(1000)]
  });

  /**
   * O contador aparece **depois** dos primeiros 100 caracteres.
   *
   * Visível desde o primeiro caractere, ele transforma escrever numa prova — e a
   * pessoa começa a contar em vez de pensar na pergunta.
   */
  protected readonly showCounter = computed(
    () => this.titleLength() >= 100
  );

  protected readonly titleLength = signal(0);

  ngOnInit(): void {
    this.mural
      .getState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (state) => this.fill(state) });

    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.titleLength.set(value.length));
  }

  protected selectBadge(badgeId: string): void {
    // Em edição a insígnia não muda: o `PUT` a descarta, e um seletor que aceita
    // clique descartado mente para quem está usando.
    if (this.editing()) {
      return;
    }

    this.form.controls.badgeId.setValue(badgeId);
  }

  /**
   * Guarda o estado e, havendo pergunta, **abre o formulário preenchido**.
   *
   * Sem isto, editar é reescrever: o título abre vazio, o corpo abre vazio, e a
   * insígnia obrigatória abre sem seleção — o que deixa o formulário inválido
   * de saída, com o botão desabilitado, para quem só queria corrigir uma
   * vírgula.
   */
  /** Relê o estado depois do 409, para a leitura mostrar o texto que valeu. */
  private reload(): void {
    this.mural
      .getState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (state) => this.state.set(state) });
  }

  private fill(state: MuralState): void {
    this.state.set(state);

    const minha = state.myQuestion;
    if (!minha) {
      return;
    }

    this.form.patchValue({
      badgeId: minha.badgeId,
      title: minha.title,
      body: minha.body ?? ''
    });
    this.titleLength.set(minha.title.length);
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const { badgeId, title, body } = this.form.getRawValue();
    const editando = this.editing();

    const requisicao = editando
      ? this.mural.updateQuestion(editando, {
          title: title.trim(),
          ...(body.trim() ? { body: body.trim() } : {})
        })
      : this.mural.createQuestion({
          badgeId,
          title: title.trim(),
          ...(body.trim() ? { body: body.trim() } : {})
        });

    requisicao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/dashboard/mural']);
      },
      error: (erro: { status?: number }) => {
        this.saving.set(false);

        // O 409 na edição fecha o formulário e mostra a pergunta em modo
        // leitura: deixá-lo aberto convidaria a pessoa a tentar de novo o que
        // nunca vai passar, com um texto que não vai ser salvo.
        //
        // **Uma mensagem só para os dois motivos** — a semana virou ou o admin
        // adiantou —, porque o resultado é o mesmo e o servidor manda uma só de
        // propósito.
        if (erro.status === 409 && editando) {
          this.locked.set(true);
          this.error.set(
            'A sua pergunta já está em votação, e o texto não muda mais — quem votou votou nele.'
          );
          this.reload();
          return;
        }

        // Os três erros pedem ações diferentes de quem está lendo, e tratá-los
        // como um só é o atalho que arruína a decisão 3.
        this.error.set(
          erro.status === 403
            ? 'O Dev Tier vota, mas não pergunta. Veja o Financeiro para assinar.'
            : erro.status === 409
              ? 'Você já perguntou esta semana, ou a semana virou enquanto você escrevia.'
              : 'Não consegui enviar agora. Tente de novo.'
        );
      }
    });
  }
}

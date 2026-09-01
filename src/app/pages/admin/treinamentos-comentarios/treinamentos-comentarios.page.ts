import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { dataPorExtenso } from '../../../core/datas';
import type { AdminTrainingComment } from '../../../models/training.model';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * O painel centralizado dos comentários da Arena (spec 023, decisão 5).
 *
 * **Smart page**: é ela que fala com a API, e a lista inteira vem de uma
 * requisição só. Um componente por linha buscando o treinamento de origem seria
 * uma requisição por comentário para pintar uma tela de suporte.
 *
 * **Responder é inline, e não uma tela a mais.** O admin abre esta página para
 * responder; obrigá-lo a navegar até a insígnia de cada comentário faria a tela
 * existir só para dizer que há trabalho a fazer.
 */
@Component({
  selector: 'app-admin-treinamentos-comentarios-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './treinamentos-comentarios.page.html',
  styleUrl: './treinamentos-comentarios.page.scss',
})
export class AdminTreinamentosComentariosPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<LoadState>('loading');
  protected readonly comments = signal<readonly AdminTrainingComment[]>([]);

  /** O comentário com a caixa de resposta aberta. Um por vez. */
  protected readonly respondendoId = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.erro.set(null);

    this.admin
      .listTrainingCommentsRecent()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.comments.set(lista.comments);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected abrirResposta(comment: AdminTrainingComment): void {
    this.respondendoId.set(comment.id);
    this.erro.set(null);
  }

  protected fecharResposta(): void {
    this.respondendoId.set(null);
  }

  /**
   * Grava a resposta e **substitui a linha em memória**.
   *
   * A resposta da rota traz o comentário atualizado, então recarregar a lista
   * inteira só custaria uma viagem para chegar ao mesmo lugar — e faria o admin
   * perder a posição de leitura no meio de uma fila de comentários.
   */
  protected responder(comment: AdminTrainingComment, texto: string): void {
    const conteudo = texto.trim();

    if (!conteudo || this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.admin
      .replyTrainingComment(comment.id, conteudo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (atualizado) => {
          this.comments.update((lista) =>
            lista.map((item) =>
              item.id === comment.id ? { ...item, adminReply: atualizado.adminReply } : item,
            ),
          );
          this.enviando.set(false);
          this.respondendoId.set(null);
        },
        error: () => {
          this.enviando.set(false);
          this.erro.set('Não consegui responder agora. Tente de novo.');
        },
      });
  }

  protected quando(iso: string): string {
    return dataPorExtenso(iso);
  }
}

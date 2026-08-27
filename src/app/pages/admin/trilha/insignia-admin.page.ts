import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { VideoForm } from '../../../components/video-form/video-form';
import { AdminService } from '../../../services/admin.service';
import { CommunityService } from '../../../services/community.service';
import { MuralService } from '../../../services/mural.service';
import { CreateVideoRequest } from '../../../models/admin.model';
import {
  AnsweredQuestion,
  BadgeVideo,
  BadgeVideoKind
} from '../../../models/track.model';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-insignia-page',
  standalone: true,
  imports: [RouterLink, VideoForm, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './insignia-admin.page.html',
  styleUrl: './insignia-admin.page.scss'
})
export class AdminInsigniaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly admin = inject(AdminService);
  private readonly community = inject(CommunityService);
  private readonly mural = inject(MuralService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly confirmDialog = viewChild.required(ConfirmDialog);
  private readonly form = viewChild(VideoForm);

  protected readonly state = signal<LoadState>('loading');
  protected readonly videos = signal<readonly BadgeVideo[]>([]);
  protected readonly badgeId = signal('');

  /**
   * A aba corrente. **Não é enfeite de simetria com a trilha do aluno.**
   *
   * A reordenação valida a lista contra os vídeos de **uma** aba, e até a spec
   * 017 esta tela listava as duas juntas e mandava a lista misturada. Não
   * quebrava porque não existia resposta nenhuma; a partir da primeira, seria
   * 400 em toda seta clicada.
   */
  protected readonly aba = signal<BadgeVideoKind>('aula');

  /**
   * A pergunta a responder, quando a tela foi aberta pela pauta do Mural.
   *
   * Preenchida, o formulário nasce aberto e em modo resposta.
   */
  protected readonly perguntaAlvo = signal<AnsweredQuestion | null>(null);

  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  /** Aviso de reordenação que falhou e foi revertida. */
  protected readonly reorderError = signal<string | null>(null);

  private pendingRemoval: BadgeVideo | null = null;
  protected readonly removalTarget = signal<BadgeVideo | null>(null);

  protected readonly stage = computed(() =>
    this.community.trackStages().find((item) => item.id === this.badgeId())
  );

  protected readonly confirmMessage = computed(() => {
    const video = this.removalTarget();
    return video
      ? `"${video.title}" sai da trilha. Isso não pode ser desfeito.`
      : '';
  });

  ngOnInit(): void {
    this.badgeId.set(this.route.snapshot.paramMap.get('badgeId') ?? '');
    this.load();

    const questionId = this.route.snapshot.queryParamMap.get('resposta');
    if (questionId) {
      this.aba.set('resposta');
      this.carregarPergunta(questionId);
    }
  }

  /**
   * Troca de aba, e recarrega.
   *
   * Não filtra a lista em memória: cada aba tem a própria ordem, 0..n-1 **dentro
   * dela**, e filtrar uma lista das duas juntas daria posições que não batem com
   * o que o servidor guardou.
   */
  protected selectTab(aba: BadgeVideoKind): void {
    if (this.aba() === aba) {
      return;
    }

    this.aba.set(aba);
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.admin
      .listVideos(this.badgeId(), this.aba())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.videos.set(list.videos);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
  }

  /**
   * Resolve a pergunta do `?resposta=` **pela pauta**, que já é uma leitura que
   * existe.
   *
   * Sem rota nova: um "buscar pergunta por id" seria um endpoint a mais para um
   * dado que já está na mão de quem veio da tela do Mural.
   *
   * Se o id não estiver na pauta, a tela abre em modo aula e **não** mostra
   * erro. O backend recusaria a publicação de qualquer jeito, e um erro na
   * abertura da tela por causa de um parâmetro de query é ruído — quem chegou
   * aqui pela pauta nunca vê isso.
   */
  private carregarPergunta(questionId: string): void {
    this.mural
      .listWinners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pauta) => {
          const alvo = pauta.find((linha) => linha.question?.id === questionId);
          if (!alvo?.question) {
            this.aba.set('aula');
            return;
          }

          this.perguntaAlvo.set({
            id: alvo.question.id,
            title: alvo.question.title,
            authorName: alvo.question.authorName,
            askedAt: alvo.question.createdAt
          });
          this.showForm.set(true);
        },
        error: () => this.aba.set('aula')
      });
  }

  protected openForm(): void {
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected create(body: CreateVideoRequest): void {
    this.saving.set(true);
    this.formError.set(null);

    this.admin
      .createVideo(this.badgeId(), body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (video) => {
          this.videos.update((current) => [...current, video]);
          this.saving.set(false);
          this.showForm.set(false);
          this.form()?.reset();
          // A pergunta é consumida na publicação: uma resposta responde uma
          // pergunta, e reabrir o formulário ainda apontando para ela publicaria
          // a segunda resposta da mesma — que o backend aceita e que ninguém
          // quis.
          this.perguntaAlvo.set(null);
        },
        error: (error: { status?: number }) => {
          this.saving.set(false);
          this.formError.set(
            error.status === 409
              ? 'Esse vídeo já está nesta insígnia. Ele pode entrar em outra, mas não duas vezes na mesma.'
              : error.status === 404
                ? 'Não achei essa pergunta no Mural. Volte à pauta e tente pelo botão de lá.'
                : error.status === 400
                  ? // A mensagem antiga dizia só "cole a URL do vídeo", e passou a
                    // mentir quando o link de Shorts virou formato aceito: quem
                    // colou um Short certo lia que o formato estava errado.
                    // Mensagem de erro que não diz o que serve faz a pessoa tentar
                    // de novo com a mesma coisa.
                    'Não reconheci esse link. Servem youtube.com/watch, youtu.be, ' +
                    'youtube.com/shorts ou o ID do vídeo.'
                  : 'Não consegui publicar agora. Tente de novo.'
          );
        }
      });
  }

  protected askRemove(video: BadgeVideo): void {
    this.pendingRemoval = video;
    this.removalTarget.set(video);
    this.confirmDialog().open();
  }

  protected cancelRemove(): void {
    this.pendingRemoval = null;
    this.removalTarget.set(null);
  }

  protected confirmRemove(): void {
    const video = this.pendingRemoval;
    this.pendingRemoval = null;
    this.removalTarget.set(null);

    if (!video) {
      return;
    }

    this.admin
      .deleteVideo(this.badgeId(), video.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // O backend renormaliza a ordem ao apagar, então reler é o que mantém a
        // lista igual ao banco em vez de igual ao palpite da tela.
        next: () => this.load(),
        error: () => this.reorderError.set('Não consegui remover agora.')
      });
  }

  protected moveUp(index: number): void {
    if (index > 0) {
      this.move(index, index - 1);
    }
  }

  protected moveDown(index: number): void {
    if (index < this.videos().length - 1) {
      this.move(index, index + 1);
    }
  }

  /**
   * Reordenação **otimista, com rollback**.
   *
   * A lista se move na hora e a requisição sai atrás. Esperar a rede a cada
   * clique de seta torna insuportável uma operação que é repetitiva por
   * natureza — e como o backend grava em lote atômico, o rollback é sempre para
   * um estado íntegro: não existe meio-reordenado.
   *
   * Uma requisição por gesto, **sem debounce**. Debounce só ganharia se a pessoa
   * clicasse muito rápido, e perderia a garantia de que o que está na tela é o
   * que está no banco.
   */
  private move(from: number, to: number): void {
    const anterior = this.videos();
    const reordenado = [...anterior];
    const [movido] = reordenado.splice(from, 1);
    reordenado.splice(to, 0, movido);

    this.videos.set(reordenado);
    this.reorderError.set(null);

    this.admin
      .reorderVideos(
        this.badgeId(),
        reordenado.map((video) => video.id),
        // A aba corrente, e não o padrão: o backend valida a lista contra os
        // vídeos daquela aba, e mandar uma lista de respostas como se fossem
        // aulas é 400 na certa.
        this.aba()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.videos.set(anterior);
          this.reorderError.set(
            'A nova ordem não foi salva, então voltei para a anterior.'
          );
        }
      });
  }
}

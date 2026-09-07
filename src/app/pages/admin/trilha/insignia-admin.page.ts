import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { VideoForm } from '../../../components/video-form/video-form';
import { TrainingForm } from '../../../components/training-form/training-form';
import { AdminService } from '../../../services/admin.service';
import { CommunityService } from '../../../services/community.service';
import { MuralService } from '../../../services/mural.service';
import { CreateVideoRequest } from '../../../models/admin.model';
import { AnsweredQuestion, BadgeVideo, BadgeVideoTab } from '../../../models/track.model';
import type {
  CreateTrainingRequest,
  Training,
  UpdateTrainingRequest,
} from '../../../models/training.model';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-insignia-page',
  standalone: true,
  imports: [RouterLink, VideoForm, TrainingForm, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './insignia-admin.page.html',
  styleUrl: './insignia-admin.page.scss',
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
  protected readonly aba = signal<BadgeVideoTab>('aula');

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

  /**
   * A linha que diz onde a resposta ficou, depois de uma publicação que trocou
   * de aba (spec 021, decisão 10).
   *
   * Existe porque um vídeo que aparece **no fim** de uma lista de doze é um
   * vídeo que a pessoa não vê sem rolar — e o admin acabou de vir da pauta do
   * Mural, numa aba que não é esta. Some na próxima ação, e é uma linha, nunca
   * um modal: é a mesma forma dos avisos que esta tela já tem.
   */
  protected readonly avisoDaTrilha = signal<string | null>(null);

  private pendingRemoval: BadgeVideo | null = null;
  protected readonly removalTarget = signal<BadgeVideo | null>(null);

  /* ------------------------------------- Arena de Treinamento (spec 023) */

  protected readonly trainings = signal<readonly Training[]>([]);
  /** O desafio sendo editado, ou `null` quando o formulário é de criação. */
  protected readonly editandoTreino = signal<Training | null>(null);
  protected readonly formTreinoAberto = signal(false);
  protected readonly salvandoTreino = signal(false);
  protected readonly erroDoTreino = signal<string | null>(null);
  protected readonly erroDaOrdemDoTreino = signal<string | null>(null);

  private pendingTrainingRemoval: Training | null = null;
  protected readonly trainingRemovalTarget = signal<Training | null>(null);

  protected readonly stage = computed(() =>
    this.community.trackStages().find((item) => item.id === this.badgeId()),
  );

  protected readonly confirmTitle = computed(() =>
    this.trainingRemovalTarget() ? 'Remover este desafio?' : 'Remover este vídeo?',
  );

  /**
   * O texto da confirmação, para as duas remoções desta tela.
   *
   * **A do desafio diz o que vai junto**, e isso não é excesso de zelo: a
   * exclusão é em cascata no servidor — os comentários e as conclusões daquele
   * desafio somem com ele —, e quem confirma sem saber disso apaga a conversa
   * de outras pessoas achando que está tirando um card da lista.
   */
  protected readonly confirmMessage = computed(() => {
    const treino = this.trainingRemovalTarget();
    if (treino) {
      return `"${treino.title}" sai da Arena, e os comentários e as conclusões dele vão junto. Isso não pode ser desfeito.`;
    }

    const video = this.removalTarget();
    return video ? `"${video.title}" sai da trilha. Isso não pode ser desfeito.` : '';
  });

  ngOnInit(): void {
    this.badgeId.set(this.route.snapshot.paramMap.get('badgeId') ?? '');
    this.load();
    this.carregarTreinamentos();

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
  protected selectTab(aba: BadgeVideoTab): void {
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
        error: () => this.state.set('error'),
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
            askedAt: alvo.question.createdAt,
          });
          this.showForm.set(true);
        },
        error: () => this.aba.set('aula'),
      });
  }

  protected openForm(): void {
    this.formError.set(null);
    this.avisoDaTrilha.set(null);
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
          this.saving.set(false);
          this.showForm.set(false);
          this.form()?.reset();

          if (video.tab !== this.aba()) {
            // **Não empurra na lista em memória** (spec 021, decisão 10). O
            // vídeo foi para outra aba, e o empurrão o poria na aba errada: o
            // admin veio da pauta do Mural, está em Respostas, e o vídeo entrou
            // na trilha. O defeito é invisível até alguém recarregar a página.
            //
            // Trocar de aba e recarregar não é só cosmético: a etapa de
            // posicionar precisa da lista vinda do SERVIDOR, com as posições
            // certas, antes de as setas fazerem sentido.
            this.aba.set(video.tab);
            this.load();
            this.avisoDaTrilha.set(
              `"${video.title}" entrou no fim da trilha. Use as setas para mover ela de lugar.`,
            );
            this.perguntaAlvo.set(null);
            return;
          }

          this.videos.update((current) => [...current, video]);
          this.avisoDaTrilha.set(null);
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
                  : 'Não consegui publicar agora. Tente de novo.',
          );
        },
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
    this.pendingTrainingRemoval = null;
    this.trainingRemovalTarget.set(null);
  }

  protected confirmRemove(): void {
    // O desafio primeiro: quando ele existe, foi ele que abriu a caixa. As duas
    // remoções compartilham um `ConfirmDialog` só porque um segundo na página
    // faria o `viewChild.required` pegar sempre o primeiro, e o outro nunca
    // abriria.
    const treino = this.pendingTrainingRemoval;
    if (treino) {
      this.pendingTrainingRemoval = null;
      this.trainingRemovalTarget.set(null);
      this.removerTreino(treino);
      return;
    }

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
        error: () => this.reorderError.set('Não consegui remover agora.'),
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
        this.aba(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.videos.set(anterior);
          this.reorderError.set('A nova ordem não foi salva, então voltei para a anterior.');
        },
      });
  }

  /* ------------------------------------- Arena de Treinamento (spec 023) */

  /**
   * Carrega os desafios da insígnia.
   *
   * **Fora do `load()` das abas, e de propósito**: a Arena não depende da aba, e
   * recarregá-la a cada troca entre Aulas e Perguntas Frequentes seria uma
   * requisição por clique numa lista que não mudou.
   */
  protected carregarTreinamentos(): void {
    this.admin
      .listTrainings(this.badgeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => this.trainings.set(lista.trainings),
        error: () => this.erroDoTreino.set('Não consegui carregar os desafios agora.'),
      });
  }

  protected abrirFormTreino(): void {
    this.editandoTreino.set(null);
    this.formTreinoAberto.set(true);
    this.erroDoTreino.set(null);
  }

  protected editarTreino(training: Training): void {
    this.editandoTreino.set(training);
    this.formTreinoAberto.set(true);
    this.erroDoTreino.set(null);
  }

  protected fecharFormTreino(): void {
    this.formTreinoAberto.set(false);
    this.editandoTreino.set(null);
  }

  /**
   * Cria ou edita, conforme haja desafio em edição.
   *
   * **Uma rota por caso, e um `if` só.** O formulário é o mesmo e não sabe a
   * diferença: quem sabe é a página, que é quem fala com a API.
   */
  protected salvarTreino(corpo: CreateTrainingRequest | UpdateTrainingRequest): void {
    const emEdicao = this.editandoTreino();

    this.salvandoTreino.set(true);
    this.erroDoTreino.set(null);

    const requisicao = emEdicao
      ? this.admin.updateTraining(emEdicao.id, corpo)
      : this.admin.createTraining(this.badgeId(), corpo as CreateTrainingRequest);

    requisicao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (salvo) => {
        // O item entra ou é substituído **em memória**, sem reler a lista: a
        // posição vem do servidor no corpo da resposta, e uma releitura só
        // custaria uma viagem para chegar ao mesmo lugar.
        this.trainings.update((lista) =>
          emEdicao ? lista.map((item) => (item.id === salvo.id ? salvo : item)) : [...lista, salvo],
        );
        this.salvandoTreino.set(false);
        this.fecharFormTreino();
      },
      error: () => {
        this.salvandoTreino.set(false);
        this.erroDoTreino.set('Não consegui salvar agora. Tente de novo.');
      },
    });
  }

  /**
   * Exclui o desafio, e tira o item da lista em memória.
   *
   * **A exclusão é em cascata no servidor**: os comentários e as conclusões
   * daquele desafio vão junto, e as posições dos que sobraram são
   * renormalizadas. A lista é relida para ficar igual ao banco em vez de igual
   * ao palpite da tela — mesma escolha da remoção de vídeo.
   */
  private removerTreino(training: Training): void {
    this.admin
      .deleteTraining(training.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.carregarTreinamentos(),
        error: () => this.erroDoTreino.set('Não consegui remover agora.'),
      });
  }

  protected pedirRemocaoDoTreino(training: Training): void {
    this.pendingTrainingRemoval = training;
    this.trainingRemovalTarget.set(training);
    this.confirmDialog().open();
  }

  protected subirTreino(index: number): void {
    if (index > 0) {
      this.moverTreino(index, index - 1);
    }
  }

  protected descerTreino(index: number): void {
    if (index < this.trainings().length - 1) {
      this.moverTreino(index, index + 1);
    }
  }

  /**
   * Reordenação **otimista, com rollback** — o mesmo desenho dos vídeos.
   *
   * A lista se move na hora e a requisição sai atrás. Como o backend grava em
   * lote atômico, o rollback é sempre para um estado íntegro: não existe
   * meio-reordenado.
   *
   * **Setas, e não arrastar.** O projeto não usa `@angular/cdk`, e no toque o
   * arrastar disputa com a rolagem da tela justamente em 360px, que é onde o
   * painel mais é aberto. As setas funcionam igual no teclado, no leitor de tela
   * e no dedo.
   */
  private moverTreino(from: number, to: number): void {
    const anterior = this.trainings();
    const reordenado = [...anterior];
    const [movido] = reordenado.splice(from, 1);
    reordenado.splice(to, 0, movido);

    this.trainings.set(reordenado);
    this.erroDaOrdemDoTreino.set(null);

    this.admin
      .reorderTrainings(
        this.badgeId(),
        reordenado.map((item) => item.id),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.trainings.set(anterior);
          this.erroDaOrdemDoTreino.set('A nova ordem não foi salva, então voltei para a anterior.');
        },
      });
  }
}

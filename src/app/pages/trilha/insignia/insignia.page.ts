import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  AnsweredQuestion,
  BadgeVideo,
  BadgeVideoTab,
  youtubeEmbedUrl
} from '../../../models/track.model';
import { dataPorExtenso } from '../../../core/datas';
import { TrackService } from '../../../services/track.service';
import { Logo } from '../../../shared/logo/logo';
import { IconClose } from '../../../components/icons/icon-close';
import { CommunityService } from '../../../services/community.service';
import { AuthStore } from '../../../core/auth/auth.store';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-insignia-page',
  standalone: true,
  imports: [RouterLink, Logo, IconClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './insignia.page.html',
  styleUrl: './insignia.page.scss'
})
export class InsigniaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly track = inject(TrackService);
  private readonly community = inject(CommunityService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  /**
   * O XP mora no perfil do `AuthStore`, que o painel le -- e esta tela escreve
   * nele em vez de guardar um numero proprio (spec 019, decisao 3). Um segundo
   * signal de XP aqui seria o que fica velho na navegacao de volta.
   */
  private readonly authStore = inject(AuthStore);

  protected readonly aba = signal<BadgeVideoTab>('aula');
  protected readonly state = signal<LoadState>('loading');
  protected readonly videos = signal<readonly BadgeVideo[]>([]);
  protected readonly badgeId = signal('');

  /** Ids com um `PUT` em voo. Trava o check para o clique não sair duas vezes. */
  protected readonly marcando = signal<ReadonlySet<string>>(new Set());

  /** O id do vídeo cuja marcação falhou, para a linha de erro sob o check. */
  protected readonly erroDoVisto = signal<string | null>(null);

  /**
   * O vídeo aberto no modal, **guardado por id e não por cópia** (spec 021).
   *
   * Guardar o objeto pareceria mais direto e deixaria o check de dentro do
   * modal congelado: `alternarVisto` reescreve a lista, e uma cópia presa aqui
   * continuaria mostrando o estado de antes do clique. Pelo id, o modal lê
   * sempre o mesmo vídeo que a lista.
   */
  private readonly respostaAbertaId = signal<string | null>(null);

  protected readonly respostaAberta = computed(() => {
    const id = this.respostaAbertaId();

    return id ? (this.videos().find((item) => item.id === id) ?? null) : null;
  });

  private readonly respostaDialog =
    viewChild<ElementRef<HTMLDialogElement>>('respostaDialog');

  /**
   * O botão que abriu o modal, para o foco voltar para ele ao fechar.
   *
   * Sem isso o foco cai no `body` e quem navega por teclado recomeça a lista do
   * topo — numa trilha de doze itens, é rolar tudo de novo para voltar ao lugar.
   */
  private botaoQueAbriu: HTMLElement | null = null;

  /**
   * Se a lista na tela é a trilha (spec 021).
   *
   * **É a aba corrente, e não o `kind` do vídeo.** A página já sabe qual lista
   * está mostrando, e essa é a informação mais barata e mais difícil de errar
   * que ela tem: um vídeo com `kind: 'resposta'` desenha o cartão de pergunta
   * na trilha e o player embutido na aba de respostas, e ler `kind` no template
   * faria as duas abas desenharem a mesma forma.
   */
  protected readonly naTrilha = computed(() => this.aba() === 'aula');

  protected readonly stage = computed(() =>
    this.community.trackStages().find((item) => item.id === this.badgeId())
  );

  /**
   * Lista vazia **não é erro**, e a tela precisa dizer isso com todas as letras.
   *
   * A API responde 200 com `videos: []` quando a insígnia ainda não tem
   * conteúdo, e esse é o estado normal do produto — no lançamento, onze das
   * treze etapas estarão assim. Um estado de erro aqui faria o aluno ler uma
   * pendência nossa como falha dele.
   */
  protected readonly empty = computed(
    () => this.state() === 'ready' && this.videos().length === 0
  );

  /**
   * Troca de aba.
   *
   * Cada aba tem a própria ordem, vinda do servidor: as posições são 0..n-1
   * **dentro da aba**. Filtrar no cliente uma lista das duas juntas daria a
   * ordem errada — e o admin arrastaria sem ver efeito.
   */
  protected selectTab(aba: BadgeVideoTab): void {
    if (this.aba() === aba) {
      return;
    }

    // Trocar de aba com o modal aberto deixaria um vídeo da outra lista
    // flutuando por cima da lista nova.
    this.fecharResposta();
    this.aba.set(aba);
    this.load();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('badgeId') ?? '';
    this.badgeId.set(id);
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.erroDoVisto.set(null);

    // O `watched` de cada vídeo vem do servidor junto da lista, em toda carga e
    // em toda troca de aba. **Nada disso mora no navegador** (decisão 11): um
    // `localStorage` falharia nas duas direções — navegador limpo faria quem já
    // assistiu ver tudo desmarcado, e um estado gravado por engano esconderia
    // para sempre um vídeo que a pessoa quis marcar.
    this.track
      .getVideos(this.badgeId(), this.aba())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          // A ordem vem do servidor e o front NÃO reordena: ela é dado, é
          // editável pelo admin, e uma segunda ordenação aqui faria o admin
          // arrastar sem ver efeito na tela do aluno.
          this.videos.set(list.videos);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
  }

  /**
   * Marca ou desmarca o vídeo (spec 019).
   *
   * **Duas coisas mudam, e elas têm origens diferentes** (decisão 2):
   *
   * - o **check** muda na hora, otimista, porque é a reação direta a um toque —
   *   um check que espera 400 ms de rede parece travado no celular, e quem
   *   duvida clica de novo;
   * - o **XP** só muda quando a resposta chega, porque ele não é reação a nada:
   *   é um número que o servidor calculou. Somar 10 aqui seria a decisão 1
   *   violada no único lugar em que ela é fácil de violar sem perceber — a soma
   *   acertaria no primeiro clique de cada vídeo e erraria em todos os
   *   seguintes, porque **remarcar não paga XP**.
   *
   * Se o `PUT` falhar, o check volta ao que era e uma linha discreta aparece.
   */
  protected alternarVisto(video: BadgeVideo): void {
    if (this.marcando().has(video.id)) {
      return;
    }

    const desejado = !video.watched;

    this.erroDoVisto.set(null);
    this.marcando.update((atual) => new Set(atual).add(video.id));
    this.aplicarVisto(video.id, desejado);

    this.track
      .setWatched(video.id, desejado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          // O número vem do corpo da resposta, sempre. A tela não multiplica.
          this.authStore.setXp(resultado.xp);
          // E o check volta a ser o que o servidor afirma — que é o mesmo valor
          // do palpite otimista, exceto se algo tiver mudado no meio.
          this.aplicarVisto(video.id, resultado.watched);
          this.liberar(video.id);
        },
        error: () => {
          this.aplicarVisto(video.id, !desejado);
          this.erroDoVisto.set(video.id);
          this.liberar(video.id);
        }
      });
  }

  /**
   * Abre a resposta num modal (spec 021, decisão 1).
   *
   * Na trilha a resposta **não desenha player**: um 9:16 com largura de desktop
   * passa de mil pixels de altura, e uma coluna de cartões 16:9 com um cartão
   * estreito e altíssimo no meio não parece uma sequência, parece erro de
   * layout. E o cartão fechado não carrega iframe nenhum — oito respostas numa
   * página seriam oito players do YouTube carregados para nada.
   */
  protected abrirResposta(video: BadgeVideo, origem: HTMLElement): void {
    this.botaoQueAbriu = origem;
    this.respostaAbertaId.set(video.id);
    this.respostaDialog()?.nativeElement.showModal();
  }

  protected fecharResposta(): void {
    this.respostaDialog()?.nativeElement.close();
    this.limparResposta();
  }

  /**
   * A saída por `Esc`, que fecha o `<dialog>` sem passar pelo botão.
   *
   * Limpar o estado **só** no botão deixaria `respostaAberta` apontando para um
   * modal que já não está na tela — com o iframe vivo dentro dele, tocando.
   */
  protected onRespostaClose(): void {
    this.limparResposta();
  }

  /**
   * Fecha o estado do modal, e **é idempotente de propósito**.
   *
   * As duas saídas passam por aqui — o botão e o `Esc` — e o botão passa duas
   * vezes: ele chama `close()`, e o `close()` dispara o evento nativo. Sem a
   * saída antecipada, a segunda passagem devolveria o foco a um botão que já
   * recebeu foco, e o `focus()` da segunda vez rolaria a página de volta se a
   * pessoa já tivesse se mexido.
   *
   * Chamar isto no botão em vez de confiar só no evento não é redundância: o
   * evento `close` é assíncrono, e há ambiente em que o `<dialog>` nativo não
   * o dispara. **O estado da tela não pode depender de um evento de terceiro
   * para deixar de existir** — é essa dependência que deixaria um iframe
   * tocando atrás de um modal fechado.
   */
  private limparResposta(): void {
    if (this.respostaAbertaId() === null) {
      return;
    }

    this.respostaAbertaId.set(null);
    this.botaoQueAbriu?.focus();
    this.botaoQueAbriu = null;
  }

  private aplicarVisto(videoId: string, watched: boolean): void {
    this.videos.update((lista) =>
      lista.map((item) =>
        item.id === videoId ? { ...item, watched } : item
      )
    );
  }

  private liberar(videoId: string): void {
    this.marcando.update((atual) => {
      const proximo = new Set(atual);
      proximo.delete(videoId);
      return proximo;
    });
  }

  /**
   * A URL do player é derivada do ID e marcada como confiável.
   *
   * O `youtubeId` vem da nossa API, que o extraiu e validou contra o formato de
   * 11 caracteres — não é entrada de usuário chegando crua no `iframe`.
   */
  protected embedUrl(video: BadgeVideo): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      youtubeEmbedUrl(video.youtubeId)
    );
  }

  /**
   * A data que vai no balão: a da **pergunta**, e não a do vídeo.
   *
   * O balão conta quando alguém teve aquela dúvida. A data em que o vídeo foi
   * gravado não é informação de ninguém, e por isso ela nem chega aqui.
   */
  protected dataDaPergunta(pergunta: AnsweredQuestion): string {
    return dataPorExtenso(pergunta.askedAt);
  }
}

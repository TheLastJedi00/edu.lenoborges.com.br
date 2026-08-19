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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  BadgeVideo,
  BadgeVideoKind,
  youtubeEmbedUrl
} from '../../../models/track.model';
import { TrackService } from '../../../services/track.service';
import { Logo } from '../../../shared/logo/logo';
import { CommunityService } from '../../../services/community.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-insignia-page',
  standalone: true,
  imports: [RouterLink, Logo],
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

  protected readonly aba = signal<BadgeVideoKind>('aula');
  protected readonly state = signal<LoadState>('loading');
  protected readonly videos = signal<readonly BadgeVideo[]>([]);
  protected readonly badgeId = signal('');

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
  protected selectTab(aba: BadgeVideoKind): void {
    if (this.aba() === aba) {
      return;
    }

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
}
